import { useState, useEffect, useCallback, useRef } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  OverlayViewF,
  OverlayView,
} from '@react-google-maps/api';
import type { Propiedad } from '../../types';

interface PropertyMapProps {
  propiedades: Propiedad[];
  selectedPropertyId?: number | null;
  onPropertySelect?: (id: number) => void;
}

interface GeocodedProperty {
  propiedad: Propiedad;
  lat: number;
  lng: number;
}

const mapContainerStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  borderRadius: '12px',
};

const defaultCenter = { lat: 19.4326, lng: -99.1332 }; // Mexico City default

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'transit',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
  ],
};

// Cache for geocoded addresses to avoid repeated API calls
const geocodeCache = new Map<string, { lat: number; lng: number }>();

export function PropertyMap({
  propiedades,
  selectedPropertyId,
  onPropertySelect,
}: PropertyMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  const [geocodedProperties, setGeocodedProperties] = useState<GeocodedProperty[]>([]);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(5);
  const mapRef = useRef<google.maps.Map | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    geocoderRef.current = new google.maps.Geocoder();
  }, []);

  // Geocode all properties when they change
  useEffect(() => {
    if (!isLoaded || !geocoderRef.current || propiedades.length === 0) return;

    const geocodeProperties = async () => {
      const geocoder = geocoderRef.current!;
      const results: GeocodedProperty[] = [];

      for (const propiedad of propiedades) {
        const address = `${propiedad.direccion}, ${propiedad.ciudad}, ${propiedad.pais}`;
        const cacheKey = address.toLowerCase().trim();

        if (geocodeCache.has(cacheKey)) {
          const cached = geocodeCache.get(cacheKey)!;
          results.push({ propiedad, lat: cached.lat, lng: cached.lng });
          continue;
        }

        try {
          const response = await new Promise<google.maps.GeocoderResult[]>(
            (resolve, reject) => {
              geocoder.geocode({ address }, (res, status) => {
                if (status === 'OK' && res && res.length > 0) {
                  resolve(res);
                } else {
                  reject(new Error(`Geocoding failed: ${status}`));
                }
              });
            }
          );

          const location = response[0].geometry.location;
          const coords = { lat: location.lat(), lng: location.lng() };
          geocodeCache.set(cacheKey, coords);
          results.push({ propiedad, ...coords });
        } catch {
          // Skip properties that can't be geocoded
          console.warn(`Could not geocode: ${address}`);
        }

        // Small delay to respect geocoding rate limits
        await new Promise((r) => setTimeout(r, 200));
      }

      setGeocodedProperties(results);

      // Fit bounds to show all markers
      if (results.length > 0 && mapRef.current) {
        const bounds = new google.maps.LatLngBounds();
        results.forEach((r) => bounds.extend({ lat: r.lat, lng: r.lng }));

        if (results.length === 1) {
          setMapCenter({ lat: results[0].lat, lng: results[0].lng });
          setMapZoom(15);
        } else {
          mapRef.current.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
        }
      }
    };

    geocodeProperties();
  }, [isLoaded, propiedades]);

  // Center on selected property
  useEffect(() => {
    if (selectedPropertyId && mapRef.current) {
      const found = geocodedProperties.find(
        (g) => g.propiedad.id === selectedPropertyId
      );
      if (found) {
        mapRef.current.panTo({ lat: found.lat, lng: found.lng });
        mapRef.current.setZoom(16);
      }
    }
  }, [selectedPropertyId, geocodedProperties]);

  const getMarkerColor = (estado: string) => {
    switch (estado) {
      case 'disponible':
        return '#10b981';
      case 'ocupada':
        return '#3b82f6';
      case 'mantenimiento':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  if (loadError) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        backgroundColor: '#f9fafb',
        borderRadius: '12px',
        color: '#ef4444',
        padding: '24px',
        textAlign: 'center',
      }}>
        <div>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" style={{ margin: '0 auto 12px' }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <p style={{ fontWeight: 600, marginBottom: '4px' }}>Error al cargar el mapa</p>
          <p style={{ fontSize: '13px', color: '#6b7280' }}>Verifica tu conexion a internet</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        backgroundColor: '#f9fafb',
        borderRadius: '12px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #e5e7eb',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto',
          }} />
          <p style={{ marginTop: '12px', color: '#6b7280', fontSize: '14px' }}>
            Cargando mapa...
          </p>
        </div>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={mapCenter}
      zoom={mapZoom}
      onLoad={onMapLoad}
      options={mapOptions}
    >
      {geocodedProperties.map((geo) => {
        const isSelected = geo.propiedad.id === selectedPropertyId;
        const color = getMarkerColor(geo.propiedad.estado);

        return (
          <OverlayViewF
            key={geo.propiedad.id}
            position={{ lat: geo.lat, lng: geo.lng }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <div
              onClick={() => onPropertySelect?.(geo.propiedad.id)}
              style={{
                transform: 'translate(-50%, -100%)',
                cursor: 'pointer',
                transition: 'transform 0.2s ease',
              }}
            >
              {/* Price tag */}
              <div
                style={{
                  backgroundColor: isSelected ? '#1f2937' : color,
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  boxShadow: isSelected
                    ? '0 4px 12px rgba(0,0,0,0.4)'
                    : '0 2px 8px rgba(0,0,0,0.2)',
                  transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  zIndex: isSelected ? 10 : 1,
                }}
              >
                ${geo.propiedad.rentaMensual.toLocaleString()}
              </div>
              {/* Arrow pointer */}
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderTop: `6px solid ${isSelected ? '#1f2937' : color}`,
                  margin: '0 auto',
                }}
              />
            </div>
          </OverlayViewF>
        );
      })}
    </GoogleMap>
  );
}
