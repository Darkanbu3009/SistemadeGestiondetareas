import { useState, useEffect, useCallback, useRef } from 'react';
import type { Inquilino, InquilinoFormData, Propiedad } from '../../types';
import {
  getInquilinos,
  createInquilino,
  updateInquilino,
  deleteInquilino,
  uploadInquilinoAvatar,
  uploadInquilinoDocumento,
} from '../../services/inquilinosService';
import { getPropiedadesDisponibles, getAllPropiedades } from '../../services/propiedadService';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  GoogleMap,
  useJsApiLoader,
  OverlayViewF,
  OverlayView,
} from '@react-google-maps/api';

const emptyFormData: InquilinoFormData = {
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  documento: '',
  avatar: '',
  direccionContacto: '',
  propiedadId: undefined,
};

type ViewMode = 'map' | 'grid';

// Map configuration
const mapContainerStyle: React.CSSProperties = {
  width: '100%',
  height: '500px',
  borderRadius: '12px',
};

const defaultCenter = { lat: 19.4326, lng: -99.1332 };

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

const geocodeCache = new Map<string, { lat: number; lng: number }>();

interface GeocodedInquilino {
  inquilino: Inquilino;
  lat: number;
  lng: number;
}

export function InquilinosPage() {
  const { t } = useLanguage();
  const [inquilinos, setInquilinos] = useState<Inquilino[]>([]);
  const [propiedadesDisponibles, setPropiedadesDisponibles] = useState<Propiedad[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingInquilino, setEditingInquilino] = useState<Inquilino | null>(null);
  const [formData, setFormData] = useState<InquilinoFormData>(emptyFormData);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('map');

  // File upload states
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [documentoFile, setDocumentoFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingDocumento, setUploadingDocumento] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const documentoInputRef = useRef<HTMLInputElement>(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;

  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Map states
  const [geocodedInquilinos, setGeocodedInquilinos] = useState<GeocodedInquilino[]>([]);
  const [selectedInquilinoId, setSelectedInquilinoId] = useState<number | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(5);
  const mapRef = useRef<google.maps.Map | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  const { isLoaded: isMapLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchInquilinos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getInquilinos(currentPage, pageSize, debouncedSearch || undefined);
      setInquilinos(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar inquilinos');
      setInquilinos([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch]);

  useEffect(() => {
    fetchInquilinos();
  }, [fetchInquilinos]);

  // Geocode inquilinos for map view
  useEffect(() => {
    if (!isMapLoaded || !geocoderRef.current || inquilinos.length === 0) return;

    const geocodeInquilinos = async () => {
      const geocoder = geocoderRef.current!;
      const results: GeocodedInquilino[] = [];

      for (const inquilino of inquilinos) {
        const address = inquilino.direccionContacto;
        if (!address || address.trim() === '') continue;

        const cacheKey = address.toLowerCase().trim();

        if (geocodeCache.has(cacheKey)) {
          const cached = geocodeCache.get(cacheKey)!;
          results.push({ inquilino, lat: cached.lat, lng: cached.lng });
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
          results.push({ inquilino, ...coords });
        } catch {
          console.warn(`Could not geocode: ${address}`);
        }

        await new Promise((r) => setTimeout(r, 200));
      }

      setGeocodedInquilinos(results);

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

    geocodeInquilinos();
  }, [isMapLoaded, inquilinos]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    geocoderRef.current = new google.maps.Geocoder();
  }, []);

  const fetchPropiedadesDisponibles = async (inquilinoActual?: Inquilino) => {
    try {
      const disponibles = await getPropiedadesDisponibles();
      if (inquilinoActual?.propiedad) {
        const yaIncluida = disponibles.some(p => p.id === inquilinoActual.propiedad?.id);
        if (!yaIncluida) {
          setPropiedadesDisponibles([inquilinoActual.propiedad, ...disponibles]);
          return;
        }
      }
      setPropiedadesDisponibles(disponibles);
    } catch (err) {
      console.error('Error al cargar propiedades:', err);
      try {
        const todas = await getAllPropiedades();
        setPropiedadesDisponibles(todas.filter(p => p.estado === 'disponible' || p.id === inquilinoActual?.propiedad?.id));
      } catch {
        setPropiedadesDisponibles([]);
      }
    }
  };

  const handleOpenModal = (inquilino?: Inquilino) => {
    if (inquilino) {
      setEditingInquilino(inquilino);
      setFormData({
        nombre: inquilino.nombre,
        apellido: inquilino.apellido,
        email: inquilino.email,
        telefono: inquilino.telefono,
        documento: inquilino.documento,
        avatar: inquilino.avatar || '',
        direccionContacto: inquilino.direccionContacto || '',
        propiedadId: inquilino.propiedad?.id,
      });
      fetchPropiedadesDisponibles(inquilino);
    } else {
      setEditingInquilino(null);
      setFormData(emptyFormData);
      fetchPropiedadesDisponibles();
    }
    setAvatarFile(null);
    setAvatarPreview(null);
    setDocumentoFile(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingInquilino(null);
    setFormData(emptyFormData);
    setAvatarFile(null);
    setAvatarPreview(null);
    setDocumentoFile(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'propiedadId' ? (value ? parseInt(value) : undefined) : value,
    }));
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten archivos de imagen');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('El archivo no puede superar los 5MB');
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleDocumentoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setError('Solo se permiten archivos de imagen o PDF');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo no puede superar los 10MB');
      return;
    }

    setDocumentoFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      let savedInquilino: Inquilino;
      if (editingInquilino) {
        savedInquilino = await updateInquilino(editingInquilino.id, formData);
      } else {
        savedInquilino = await createInquilino(formData);
      }

      // Upload avatar file if selected
      if (avatarFile) {
        setUploadingAvatar(true);
        try {
          await uploadInquilinoAvatar(savedInquilino.id, avatarFile);
        } catch (err) {
          console.error('Error uploading avatar:', err);
          setError(t('inq.errorFoto'));
        } finally {
          setUploadingAvatar(false);
        }
      }

      // Upload identity document if selected
      if (documentoFile) {
        setUploadingDocumento(true);
        try {
          await uploadInquilinoDocumento(savedInquilino.id, documentoFile);
        } catch (err) {
          console.error('Error uploading document:', err);
          setError(t('inq.errorDocumento'));
        } finally {
          setUploadingDocumento(false);
        }
      }

      handleCloseModal();
      fetchInquilinos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar inquilino');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('inq.confirmarEliminar'))) {
      return;
    }

    try {
      await deleteInquilino(id);
      fetchInquilinos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar inquilino');
    }
  };

  const handleContactar = (inquilino: Inquilino) => {
    window.location.href = `mailto:${inquilino.email}`;
  };

  const handlePageChange = (page: number) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
    }
  };

  const getContratoEstadoClass = (estado?: string) => {
    switch (estado) {
      case 'activo':
        return 'badge-success';
      case 'en_proceso':
        return 'badge-warning';
      case 'finalizado':
        return 'badge-danger';
      case 'sin_contrato':
      default:
        return 'badge-secondary';
    }
  };

  const getContratoEstadoLabel = (estado?: string) => {
    switch (estado) {
      case 'activo':
        return t('inq.activo');
      case 'en_proceso':
        return t('inq.enProceso');
      case 'finalizado':
        return t('inq.finalizado');
      case 'sin_contrato':
        return t('inq.sinContrato');
      default:
        return t('inq.sinContrato');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisiblePages = 4;
    let startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages);

    if (endPage - startPage < maxVisiblePages) {
      startPage = Math.max(0, endPage - maxVisiblePages);
    }

    for (let i = startPage; i < endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const startItem = currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, totalElements);

  const getMarkerColor = (estado?: string) => {
    switch (estado) {
      case 'activo':
        return '#10b981';
      case 'en_proceso':
        return '#f59e0b';
      case 'finalizado':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const TenantAvatar = ({ src, alt, size = 40 }: { src?: string; alt: string; size?: number }) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    useEffect(() => {
      setImageError(false);
      setImageLoaded(false);
    }, [src]);

    const isValidUrl = (url?: string): boolean => {
      if (!url || url.trim() === '') return false;
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    };

    const showFallback = !src || !isValidUrl(src) || imageError;

    if (showFallback) {
      return (
        <div
          className="tenant-avatar-fallback"
          style={{
            width: size,
            height: size,
            minWidth: size,
            minHeight: size,
            backgroundColor: '#e5e7eb',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9ca3af'
          }}
        >
          <svg
            width={size * 0.5}
            height={size * 0.5}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
      );
    }

    return (
      <div style={{ position: 'relative', width: size, height: size, minWidth: size, minHeight: size }}>
        {!imageLoaded && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: size,
              height: size,
              backgroundColor: '#e5e7eb',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div style={{
              width: size * 0.4,
              height: size * 0.4,
              border: '2px solid #d1d5db',
              borderTop: '2px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          </div>
        )}
        <img
          src={src}
          alt={alt}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            objectFit: 'cover',
            display: imageLoaded ? 'block' : 'none'
          }}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageError(true);
            setImageLoaded(false);
          }}
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  };

  return (
    <div className="inquilinos-page">
      <div className="page-header">
        <h1 className="page-title">{t('inq.titulo')}</h1>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <span>+</span> {t('inq.agregar').replace('+ ', '')}
        </button>
      </div>

      {error && (
        <div className="error-message" style={{
          backgroundColor: '#fee2e2',
          color: '#dc2626',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#dc2626',
              fontSize: '18px',
              padding: '0 8px'
            }}
          >
            ×
          </button>
        </div>
      )}

      <div className="table-toolbar">
        <div className="search-box">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder={t('inq.buscar')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="view-toggle">
          <button
            className={`view-btn ${viewMode === 'map' ? 'active' : ''}`}
            onClick={() => setViewMode('map')}
            title={t('inq.vistaMapa')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </button>
          <button
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title={t('inq.vistaGrid')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container" style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '60px',
          color: '#6b7280'
        }}>
          <span>{t('inq.cargando')}</span>
        </div>
      ) : inquilinos.length === 0 ? (
        <div className="empty-state" style={{
          textAlign: 'center',
          padding: '60px',
          color: '#6b7280'
        }}>
          <p>{debouncedSearch ? t('inq.noEncontrados') : t('inq.sinInquilinos')}</p>
          {!debouncedSearch && (
            <button className="btn btn-primary" onClick={() => handleOpenModal()} style={{ marginTop: '16px' }}>
              {t('inq.agregarPrimero')}
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Map View */}
          {viewMode === 'map' && (
            <div style={{ marginTop: '24px' }}>
              {isMapLoaded ? (
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={mapCenter}
                  zoom={mapZoom}
                  onLoad={onMapLoad}
                  options={mapOptions}
                >
                  {geocodedInquilinos.map((geo) => {
                    const isSelected = geo.inquilino.id === selectedInquilinoId;
                    const color = getMarkerColor(geo.inquilino.contratoEstado);

                    return (
                      <OverlayViewF
                        key={geo.inquilino.id}
                        position={{ lat: geo.lat, lng: geo.lng }}
                        mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                      >
                        <div
                          onClick={() => setSelectedInquilinoId(isSelected ? null : geo.inquilino.id)}
                          style={{
                            transform: 'translate(-50%, -100%)',
                            cursor: 'pointer',
                            transition: 'transform 0.2s ease',
                          }}
                        >
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
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                            {geo.inquilino.nombre} {geo.inquilino.apellido}
                          </div>
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
                          {isSelected && (
                            <div style={{
                              position: 'absolute',
                              top: '100%',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              marginTop: '8px',
                              backgroundColor: 'white',
                              borderRadius: '8px',
                              padding: '12px',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                              minWidth: '200px',
                              zIndex: 20,
                            }}>
                              <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                                {geo.inquilino.nombre} {geo.inquilino.apellido}
                              </div>
                              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>
                                {geo.inquilino.email}
                              </div>
                              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                                {geo.inquilino.telefono}
                              </div>
                              {geo.inquilino.direccionContacto && (
                                <div style={{ fontSize: '12px', color: '#374151', marginBottom: '4px' }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}>
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                    <circle cx="12" cy="10" r="3" />
                                  </svg>
                                  {geo.inquilino.direccionContacto}
                                </div>
                              )}
                              <span className={`badge ${getContratoEstadoClass(geo.inquilino.contratoEstado)}`} style={{ fontSize: '11px' }}>
                                {getContratoEstadoLabel(geo.inquilino.contratoEstado)}
                              </span>
                              <div style={{ marginTop: '8px', display: 'flex', gap: '4px' }}>
                                <button
                                  className="btn btn-outline btn-sm"
                                  onClick={(e) => { e.stopPropagation(); handleOpenModal(geo.inquilino); }}
                                  style={{ fontSize: '11px', padding: '2px 8px' }}
                                >
                                  {t('inq.editarBtn')}
                                </button>
                                <button
                                  className="btn btn-outline btn-sm"
                                  onClick={(e) => { e.stopPropagation(); handleContactar(geo.inquilino); }}
                                  style={{ fontSize: '11px', padding: '2px 8px' }}
                                >
                                  {t('inq.contactar')}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </OverlayViewF>
                    );
                  })}
                </GoogleMap>
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '500px',
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
              )}

              {/* Cards below map for inquilinos without address */}
              {inquilinos.filter(i => !i.direccionContacto || i.direccionContacto.trim() === '').length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
                    {t('inq.sinDireccion')}:
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {inquilinos.filter(i => !i.direccionContacto || i.direccionContacto.trim() === '').map(inquilino => (
                      <div
                        key={inquilino.id}
                        onClick={() => handleOpenModal(inquilino)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          backgroundColor: 'white',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb',
                          cursor: 'pointer',
                          fontSize: '13px',
                        }}
                      >
                        <TenantAvatar src={inquilino.avatar} alt={`${inquilino.nombre} ${inquilino.apellido}`} size={28} />
                        <span style={{ fontWeight: 500 }}>{inquilino.nombre} {inquilino.apellido}</span>
                        <span className={`badge ${getContratoEstadoClass(inquilino.contratoEstado)}`} style={{ fontSize: '10px' }}>
                          {getContratoEstadoLabel(inquilino.contratoEstado)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="inquilinos-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '24px',
              marginTop: '24px'
            }}>
              {inquilinos.map((inquilino) => (
                <div key={inquilino.id} className="inquilino-card" style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  border: '1px solid #e5e7eb',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  transition: 'box-shadow 0.2s ease',
                }}>
                  {/* Header: Avatar + Name + Contract Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <TenantAvatar
                        src={inquilino.avatar}
                        alt={`${inquilino.nombre} ${inquilino.apellido}`}
                        size={48}
                      />
                      <div>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>
                          {inquilino.nombre} {inquilino.apellido}
                        </h4>
                        <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#6b7280' }}>
                          {inquilino.email}
                        </p>
                      </div>
                    </div>
                    {inquilino.contratoEstado && inquilino.contratoEstado !== 'sin_contrato' ? (
                      <span className={`badge ${getContratoEstadoClass(inquilino.contratoEstado)}`}>
                        {getContratoEstadoLabel(inquilino.contratoEstado)}
                      </span>
                    ) : (
                      <span className="badge badge-secondary">{t('inq.sinContrato')}</span>
                    )}
                  </div>

                  {/* Contact Address */}
                  {inquilino.direccionContacto && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '6px',
                      fontSize: '13px',
                      color: '#374151',
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" style={{ marginTop: '2px', flexShrink: 0 }}>
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {inquilino.direccionContacto}
                    </div>
                  )}

                  {/* Property Info */}
                  <div style={{
                    padding: '0.75rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                  }}>
                    {inquilino.propiedad ? (
                      <>
                        <div style={{ fontWeight: 500, fontSize: '0.9rem', color: '#374151' }}>
                          {inquilino.propiedad.nombre}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '2px' }}>
                          {inquilino.propiedad.direccion}, {inquilino.propiedad.ciudad}
                        </div>
                      </>
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '14px' }}>{t('inq.sinPropiedad')}</span>
                    )}
                  </div>

                  {/* Details */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <span style={{ fontSize: '12px', color: '#6b7280', display: 'block' }}>{t('inq.telefono')}</span>
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>{inquilino.telefono}</span>
                    </div>
                    {inquilino.contratoFin && (
                      <div>
                        <span style={{ fontSize: '12px', color: '#6b7280', display: 'block' }}>{t('inq.vencimiento')}</span>
                        <span style={{ fontSize: '14px', fontWeight: '500' }}>{formatDate(inquilino.contratoFin)}</span>
                      </div>
                    )}
                  </div>

                  {/* Document badge */}
                  {inquilino.documentoIdentidadUrl && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <a
                        href={inquilino.documentoIdentidadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                          color: '#3b82f6',
                          textDecoration: 'none',
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14,2 14,8 20,8" />
                        </svg>
                        {t('inq.verDocumento')}
                      </a>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleOpenModal(inquilino)}
                      style={{ flex: 1 }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      {t('inq.editarBtn')}
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleContactar(inquilino)}
                      style={{ flex: 1 }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                      {t('inq.contactar')}
                    </button>
                    <button
                      className="btn btn-outline btn-sm btn-danger-text"
                      onClick={() => handleDelete(inquilino.id)}
                      style={{ color: '#dc2626', borderColor: '#dc2626' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3,6 5,6 21,6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      {t('inq.eliminar')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="table-pagination">
            <span className="pagination-info">
              {totalElements > 0 ? `${startItem}-${endItem} de ${totalElements}` : `0 ${t('pag.resultados')}`}
            </span>
            <div className="pagination-controls">
              <button
                className="pagination-btn"
                disabled={currentPage === 0}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                &lt;
              </button>
              {getPageNumbers().map((page) => (
                <button
                  key={page}
                  className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                  onClick={() => handlePageChange(page)}
                >
                  {page + 1}
                </button>
              ))}
              <button
                className="pagination-btn"
                disabled={currentPage >= totalPages - 1}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                &gt;
              </button>
            </div>
          </div>
        </>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>{editingInquilino ? t('inq.editar') : t('inq.agregarTitle')}</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="nombre">{t('inq.nombre')}</label>
                    <input
                      type="text"
                      id="nombre"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="apellido">{t('inq.apellido')}</label>
                    <input
                      type="text"
                      id="apellido"
                      name="apellido"
                      value={formData.apellido}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="email">{t('inq.email')}</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="telefono">{t('inq.telefono')}</label>
                    <input
                      type="tel"
                      id="telefono"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="documento">{t('inq.documento')}</label>
                    <input
                      type="text"
                      id="documento"
                      name="documento"
                      value={formData.documento}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                {/* Contact Address */}
                <div className="form-group">
                  <label htmlFor="direccionContacto">{t('inq.direccionContacto')}</label>
                  <input
                    type="text"
                    id="direccionContacto"
                    name="direccionContacto"
                    value={formData.direccionContacto || ''}
                    onChange={handleInputChange}
                    placeholder={t('inq.placeholder.direccion')}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="propiedadId">{t('inq.propiedad')}</label>
                  <select
                    id="propiedadId"
                    name="propiedadId"
                    value={formData.propiedadId || ''}
                    onChange={handleInputChange}
                  >
                    <option value="">{t('inq.sinPropiedad')}</option>
                    {propiedadesDisponibles.map((propiedad) => (
                      <option key={propiedad.id} value={propiedad.id}>
                        {propiedad.nombre} - {propiedad.direccion}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Photo Upload */}
                <div className="form-group">
                  <label>{t('inq.adjuntarFoto')}</label>
                  <input
                    type="file"
                    ref={avatarInputRef}
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    style={{ display: 'none' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <TenantAvatar
                      src={avatarPreview || (editingInquilino?.avatar) || undefined}
                      alt="Avatar"
                      size={64}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={uploadingAvatar}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17,8 12,3 7,8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        {editingInquilino?.avatar ? t('inq.cambiarFoto') : t('inq.adjuntarFoto')}
                      </button>
                      {avatarFile && (
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>
                          {t('inq.archivoSeleccionado')} {avatarFile.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {t('inq.fotoInfo')}
                  </small>
                </div>

                {/* Identity Document Upload */}
                <div className="form-group">
                  <label>{t('inq.adjuntarDocumento')}</label>
                  <input
                    type="file"
                    ref={documentoInputRef}
                    accept="image/*,.pdf"
                    onChange={handleDocumentoFileChange}
                    style={{ display: 'none' }}
                  />
                  <div style={{
                    border: '2px dashed #d1d5db',
                    borderRadius: '8px',
                    padding: '16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: '#f9fafb',
                    transition: 'border-color 0.2s',
                  }}
                    onClick={() => documentoInputRef.current?.click()}
                  >
                    {documentoFile ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14,2 14,8 20,8" />
                        </svg>
                        <span style={{ fontSize: '13px', color: '#374151' }}>
                          {t('inq.archivoSeleccionado')} {documentoFile.name}
                        </span>
                      </div>
                    ) : editingInquilino?.documentoIdentidadUrl ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14,2 14,8 20,8" />
                        </svg>
                        <span style={{ fontSize: '13px', color: '#3b82f6' }}>
                          {t('inq.cambiarDocumento')}
                        </span>
                        <a
                          href={editingInquilino.documentoIdentidadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{ fontSize: '12px', color: '#3b82f6' }}
                        >
                          {t('inq.verDocumento')}
                        </a>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17,8 12,3 7,8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        <span style={{ fontSize: '13px', color: '#6b7280' }}>
                          {t('inq.adjuntarDocumento')}
                        </span>
                      </div>
                    )}
                  </div>
                  <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {t('inq.documentoInfo')}
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal} disabled={submitting || uploadingAvatar || uploadingDocumento}>
                  {t('inq.cancelar')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting || uploadingAvatar || uploadingDocumento}>
                  {submitting || uploadingAvatar || uploadingDocumento
                    ? (uploadingAvatar ? t('inq.subiendoFoto') : uploadingDocumento ? t('inq.subiendoDocumento') : t('inq.guardando'))
                    : (editingInquilino ? t('inq.guardarCambios') : t('inq.agregarTitle'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
