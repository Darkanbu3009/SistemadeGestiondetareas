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
import { getAllPagos } from '../../services/pagosService';
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

const mapContainerStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
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

interface InquilinoPagoInfo {
  estado: 'pagado' | 'pendiente' | 'atrasado' | null;
  monto: number | null;
  fechaVencimiento: string | null;
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

  const [pagosPorInquilino, setPagosPorInquilino] = useState<Map<number, InquilinoPagoInfo>>(new Map());

  const [geocodedInquilinos, setGeocodedInquilinos] = useState<GeocodedInquilino[]>([]);
  const [selectedInquilinoId, setSelectedInquilinoId] = useState<number | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(5);
  const mapRef = useRef<google.maps.Map | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  // State to track when geocoder is ready (refs don't trigger re-renders)
  const [geocoderReady, setGeocoderReady] = useState(false);

  const [contextMenu, setContextMenu] = useState<{ id: number; x: number; y: number } | null>(null);

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

  useEffect(() => {
    const fetchPagos = async () => {
      try {
        const allPagos = await getAllPagos();
        const pagoMap = new Map<number, InquilinoPagoInfo>();
        for (const pago of allPagos) {
          const existing = pagoMap.get(pago.inquilinoId);
          if (!existing || new Date(pago.fechaVencimiento) > new Date(existing.fechaVencimiento || '')) {
            pagoMap.set(pago.inquilinoId, {
              estado: pago.estado,
              monto: pago.monto,
              fechaVencimiento: pago.fechaVencimiento,
            });
          }
        }
        setPagosPorInquilino(pagoMap);
      } catch (err) {
        console.error('Error fetching pagos:', err);
      }
    };
    fetchPagos();
  }, [inquilinos]);

  // Helper to get address for geocoding
  const getGeoAddress = (inquilino: Inquilino): string | null => {
    const contactAddr = inquilino.direccionContacto?.trim();
    if (contactAddr && contactAddr.length > 0) return contactAddr;
    const propAddr = inquilino.propiedad?.direccion?.trim();
    const propCity = inquilino.propiedad?.ciudad?.trim();
    if (propAddr) return propCity ? `${propAddr}, ${propCity}` : propAddr;
    return null;
  };

  // Geocode a single address
  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    const cacheKey = address.toLowerCase().trim();
    if (geocodeCache.has(cacheKey)) {
      return geocodeCache.get(cacheKey)!;
    }
    if (!geocoderRef.current) return null;
    try {
      const response = await new Promise<google.maps.GeocoderResult[]>(
        (resolve, reject) => {
          geocoderRef.current!.geocode({ address }, (res, status) => {
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
      return coords;
    } catch {
      console.warn(`Could not geocode: ${address}`);
      return null;
    }
  };

  // Geocode all inquilinos when geocoder is ready
  useEffect(() => {
    if (!isMapLoaded || !geocoderReady || inquilinos.length === 0) return;

    const geocodeAll = async () => {
      const results: GeocodedInquilino[] = [];

      for (const inquilino of inquilinos) {
        const address = getGeoAddress(inquilino);
        if (!address) continue;

        const coords = await geocodeAddress(address);
        if (coords) {
          results.push({ inquilino, ...coords });
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

    geocodeAll();
  }, [isMapLoaded, geocoderReady, inquilinos]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    geocoderRef.current = new google.maps.Geocoder();
    setGeocoderReady(true);
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
    if (!window.confirm(t('inq.confirmarEliminar'))) return;
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
    if (page >= 0 && page < totalPages) setCurrentPage(page);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatCurrency = (amount?: number | null) => {
    if (amount == null) return null;
    return `$${amount.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisiblePages = 4;
    let startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages);
    if (endPage - startPage < maxVisiblePages) startPage = Math.max(0, endPage - maxVisiblePages);
    for (let i = startPage; i < endPage; i++) pages.push(i);
    return pages;
  };

  const startItem = currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, totalElements);

  // Get display amount: pago monto first, then propiedad.rentaMensual as fallback
  const getDisplayAmount = (inquilino: Inquilino, pagoInfo?: InquilinoPagoInfo) => {
    if (pagoInfo?.monto != null) return pagoInfo.monto;
    if (inquilino.propiedad?.rentaMensual != null) return inquilino.propiedad.rentaMensual;
    return null;
  };

  // Get display date: pago fechaVencimiento first, then contract/createdAt as fallback
  const getDisplayDate = (inquilino: Inquilino, pagoInfo?: InquilinoPagoInfo) => {
    if (pagoInfo?.fechaVencimiento) return { date: pagoInfo.fechaVencimiento, isVence: true };
    if (inquilino.createdAt) return { date: inquilino.createdAt, isVence: false };
    return null;
  };

  const getPaymentStatusLabel = (estado?: 'pagado' | 'pendiente' | 'atrasado' | null): string => {
    switch (estado) {
      case 'pagado': return t('inq.alCorriente');
      case 'pendiente': return t('inq.pendientePago');
      case 'atrasado': return t('inq.mora');
      default: return t('inq.nuevo');
    }
  };

  const getPaymentStatusClass = (estado?: 'pagado' | 'pendiente' | 'atrasado' | null): string => {
    switch (estado) {
      case 'pagado': return 'inq-status-paid';
      case 'pendiente': return 'inq-status-pending';
      case 'atrasado': return 'inq-status-overdue';
      default: return 'inq-status-new';
    }
  };

  const getStatusDotColor = (estado?: 'pagado' | 'pendiente' | 'atrasado' | null): string => {
    switch (estado) {
      case 'pagado': return '#10b981';
      case 'pendiente': return '#f59e0b';
      case 'atrasado': return '#ef4444';
      default: return '#2563eb';
    }
  };

  const getMarkerColor = (inquilinoId: number) => {
    const pagoInfo = pagosPorInquilino.get(inquilinoId);
    return getStatusDotColor(pagoInfo?.estado);
  };

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  const handleCardClick = async (inquilino: Inquilino) => {
    const isSelected = inquilino.id === selectedInquilinoId;
    setSelectedInquilinoId(isSelected ? null : inquilino.id);
    setContextMenu(null);

    if (!isSelected) {
      // Check if already geocoded
      let geo = geocodedInquilinos.find(g => g.inquilino.id === inquilino.id);

      // If not geocoded yet, try geocoding on demand
      if (!geo && geocoderRef.current) {
        const address = getGeoAddress(inquilino);
        if (address) {
          const coords = await geocodeAddress(address);
          if (coords) {
            const newGeo: GeocodedInquilino = { inquilino, ...coords };
            setGeocodedInquilinos(prev => [...prev, newGeo]);
            geo = newGeo;
          }
        }
      }

      if (geo && mapRef.current) {
        mapRef.current.panTo({ lat: geo.lat, lng: geo.lng });
        mapRef.current.setZoom(15);
      }
    }
  };

  const handleCardContextMenu = (e: React.MouseEvent, inquilinoId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ id: inquilinoId, x: e.clientX, y: e.clientY });
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
      try { new URL(url); return true; } catch { return false; }
    };

    const showFallback = !src || !isValidUrl(src) || imageError;

    if (showFallback) {
      return (
        <div
          className="tenant-avatar-fallback"
          style={{
            width: size, height: size, minWidth: size, minHeight: size,
            backgroundColor: '#e5e7eb', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af'
          }}
        >
          <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
      );
    }

    return (
      <div style={{ position: 'relative', width: size, height: size, minWidth: size, minHeight: size }}>
        {!imageLoaded && (
          <div style={{
            position: 'absolute', top: 0, left: 0, width: size, height: size,
            backgroundColor: '#e5e7eb', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{
              width: size * 0.4, height: size * 0.4,
              border: '2px solid #d1d5db', borderTop: '2px solid #3b82f6',
              borderRadius: '50%', animation: 'spin 1s linear infinite'
            }} />
          </div>
        )}
        <img
          src={src} alt={alt}
          style={{
            width: size, height: size, borderRadius: '50%',
            objectFit: 'cover', display: imageLoaded ? 'block' : 'none'
          }}
          onLoad={() => setImageLoaded(true)}
          onError={() => { setImageError(true); setImageLoaded(false); }}
          crossOrigin="anonymous" referrerPolicy="no-referrer"
        />
      </div>
    );
  };

  return (
    <div className="inquilinos-page">
      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 className="page-title">{t('inq.titulo')}</h1>
          <span className="inq-header-count">{totalElements}</span>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <span>+</span> {t('inq.agregar').replace('+ ', '')}
        </button>
      </div>

      {error && (
        <div className="error-message" style={{
          backgroundColor: '#fee2e2', color: '#dc2626', padding: '12px 16px',
          borderRadius: '8px', marginBottom: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <span>{error}</span>
          <button onClick={() => setError(null)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#dc2626', fontSize: '18px', padding: '0 8px'
          }}>x</button>
        </div>
      )}

      {/* Search Bar */}
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
      </div>

      {loading ? (
        <div className="loading-container" style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          padding: '60px', color: '#6b7280'
        }}>
          <span>{t('inq.cargando')}</span>
        </div>
      ) : inquilinos.length === 0 ? (
        <div className="empty-state" style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
          <p>{debouncedSearch ? t('inq.noEncontrados') : t('inq.sinInquilinos')}</p>
          {!debouncedSearch && (
            <button className="btn btn-primary" onClick={() => handleOpenModal()} style={{ marginTop: '16px' }}>
              {t('inq.agregarPrimero')}
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Main Layout: Tenant List + Map */}
          <div className="inq-main-layout">
            {/* Tenant List Panel */}
            <div className="inq-list-panel">
              <div className="inq-list-scroll">
                {inquilinos.map((inquilino) => {
                  const pagoInfo = pagosPorInquilino.get(inquilino.id);
                  const isSelected = inquilino.id === selectedInquilinoId;
                  const displayAmount = getDisplayAmount(inquilino, pagoInfo);
                  const displayDateInfo = getDisplayDate(inquilino, pagoInfo);
                  const formattedAmount = formatCurrency(displayAmount);
                  const formattedDate = displayDateInfo ? formatDate(displayDateInfo.date) : null;

                  return (
                    <div
                      key={inquilino.id}
                      className={`inq-card ${isSelected ? 'inq-card-selected' : ''}`}
                      onClick={() => handleCardClick(inquilino)}
                      onContextMenu={(e) => handleCardContextMenu(e, inquilino.id)}
                    >
                      <div className="inq-card-body">
                        {/* Left side: Avatar + Info */}
                        <div className="inq-card-left">
                          <TenantAvatar
                            src={inquilino.avatar}
                            alt={`${inquilino.nombre} ${inquilino.apellido}`}
                            size={52}
                          />
                          <div className="inq-card-info">
                            <span className="inq-card-name">
                              {inquilino.nombre} {inquilino.apellido}
                            </span>
                            <span className="inq-card-property">
                              {inquilino.propiedad ? inquilino.propiedad.nombre : t('inq.sinPropiedadCorta')}
                            </span>
                            <div className="inq-card-details">
                              <div className="inq-card-detail">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                  <circle cx="12" cy="10" r="3" />
                                </svg>
                                <span>
                                  {inquilino.propiedad
                                    ? `${inquilino.propiedad.direccion}, ${inquilino.propiedad.ciudad}`
                                    : inquilino.direccionContacto || t('inq.sinDireccion')}
                                </span>
                              </div>
                              <div className="inq-card-detail">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                  <polyline points="22,6 12,13 2,6" />
                                </svg>
                                <span>{inquilino.email}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right side: Status + Payment */}
                        <div className="inq-card-right">
                          <span className={`inq-status-badge ${getPaymentStatusClass(pagoInfo?.estado)}`}>
                            {getPaymentStatusLabel(pagoInfo?.estado)}
                          </span>
                          <div className="inq-card-payment">
                            {formattedAmount && (
                              <span className="inq-card-amount">
                                {formattedAmount}{t('inq.porMes')}
                              </span>
                            )}
                            {formattedDate && (
                              <div className="inq-card-due">
                                <span
                                  className="inq-card-due-dot"
                                  style={{ backgroundColor: getStatusDotColor(pagoInfo?.estado) }}
                                />
                                <span className="inq-card-due-date">
                                  {displayDateInfo?.isVence ? t('inq.venceFecha') : t('inq.desdeFecha')} {formattedDate}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              <div className="inq-pagination">
                <span className="pagination-info">
                  {totalElements > 0 ? `${startItem}-${endItem} de ${totalElements}` : `0 ${t('pag.resultados')}`}
                </span>
                <div className="pagination-controls">
                  <button className="pagination-btn" disabled={currentPage === 0} onClick={() => handlePageChange(currentPage - 1)}>
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
                  <button className="pagination-btn" disabled={currentPage >= totalPages - 1} onClick={() => handlePageChange(currentPage + 1)}>
                    &gt;
                  </button>
                </div>
              </div>
            </div>

            {/* Map Panel */}
            <div className="inq-map-panel">
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
                    const color = getMarkerColor(geo.inquilino.id);
                    const propName = geo.inquilino.propiedad?.nombre || `${geo.inquilino.nombre} ${geo.inquilino.apellido}`;

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
                          }}
                        >
                          {/* Marker bubble */}
                          <div
                            style={{
                              backgroundColor: isSelected ? '#1f2937' : 'white',
                              color: isSelected ? 'white' : '#1e293b',
                              padding: '6px 12px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                              boxShadow: isSelected
                                ? '0 4px 12px rgba(0,0,0,0.4)'
                                : '0 2px 8px rgba(0,0,0,0.15)',
                              transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                              transition: 'all 0.2s ease',
                              position: 'relative',
                              zIndex: isSelected ? 10 : 1,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              border: isSelected ? 'none' : '1px solid #e5e7eb',
                            }}
                          >
                            <span style={{
                              width: 8, height: 8, borderRadius: '50%',
                              backgroundColor: color, flexShrink: 0,
                            }} />
                            {propName}
                          </div>
                          {/* Arrow */}
                          <div style={{
                            width: 0, height: 0,
                            borderLeft: '6px solid transparent',
                            borderRight: '6px solid transparent',
                            borderTop: `6px solid ${isSelected ? '#1f2937' : 'white'}`,
                            margin: '0 auto',
                            filter: isSelected ? 'none' : 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))',
                          }} />
                          {/* Info popup on selection */}
                          {isSelected && (
                            <div style={{
                              position: 'absolute', top: '100%', left: '50%',
                              transform: 'translateX(-50%)', marginTop: '8px',
                              backgroundColor: 'white', borderRadius: '12px',
                              padding: '14px 16px',
                              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                              minWidth: '200px', zIndex: 20,
                            }}>
                              <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '3px', color: '#1e293b' }}>
                                {geo.inquilino.nombre} {geo.inquilino.apellido}
                              </div>
                              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>
                                {geo.inquilino.email}
                              </div>
                              {geo.inquilino.propiedad && (
                                <div style={{ fontSize: '12px', color: '#374151', marginBottom: '4px', fontWeight: 500 }}>
                                  {geo.inquilino.propiedad.nombre}
                                </div>
                              )}
                              {(() => {
                                const pi = pagosPorInquilino.get(geo.inquilino.id);
                                const amt = getDisplayAmount(geo.inquilino, pi);
                                return (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                                    <span className={`inq-status-badge ${getPaymentStatusClass(pi?.estado)}`} style={{ fontSize: '11px' }}>
                                      {getPaymentStatusLabel(pi?.estado)}
                                    </span>
                                    {amt != null && (
                                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>
                                        {formatCurrency(amt)}{t('inq.porMes')}
                                      </span>
                                    )}
                                  </div>
                                );
                              })()}
                              <div style={{ marginTop: '10px', display: 'flex', gap: '4px' }}>
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
                <div className="inq-map-loading">
                  <div className="inq-map-spinner" />
                  <p>Cargando mapa...</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Context Menu */}
      {contextMenu && (() => {
        const inquilino = inquilinos.find(i => i.id === contextMenu.id);
        if (!inquilino) return null;
        return (
          <div
            className="inq-context-menu"
            style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, zIndex: 1000 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="inq-context-item" onClick={() => { handleOpenModal(inquilino); setContextMenu(null); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              {t('inq.editarBtn')}
            </button>
            <button className="inq-context-item" onClick={() => { handleContactar(inquilino); setContextMenu(null); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              {t('inq.contactar')}
            </button>
            <div className="inq-context-divider" />
            <button className="inq-context-item inq-context-danger" onClick={() => { handleDelete(inquilino.id); setContextMenu(null); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3,6 5,6 21,6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              {t('inq.eliminar')}
            </button>
          </div>
        );
      })()}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h2>{editingInquilino ? t('inq.editar') : t('inq.agregarTitle')}</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="nombre">{t('inq.nombre')}</label>
                    <input type="text" id="nombre" name="nombre" value={formData.nombre} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="apellido">{t('inq.apellido')}</label>
                    <input type="text" id="apellido" name="apellido" value={formData.apellido} onChange={handleInputChange} required />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="email">{t('inq.email')}</label>
                  <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="telefono">{t('inq.telefono')}</label>
                    <input type="tel" id="telefono" name="telefono" value={formData.telefono} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="documento">{t('inq.documento')}</label>
                    <input type="text" id="documento" name="documento" value={formData.documento} onChange={handleInputChange} required />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="direccionContacto">{t('inq.direccionContacto')}</label>
                  <input type="text" id="direccionContacto" name="direccionContacto" value={formData.direccionContacto || ''} onChange={handleInputChange} placeholder={t('inq.placeholder.direccion')} />
                </div>
                <div className="form-group">
                  <label htmlFor="propiedadId">{t('inq.propiedad')}</label>
                  <select id="propiedadId" name="propiedadId" value={formData.propiedadId || ''} onChange={handleInputChange}>
                    <option value="">{t('inq.sinPropiedad')}</option>
                    {propiedadesDisponibles.map((propiedad) => (
                      <option key={propiedad.id} value={propiedad.id}>{propiedad.nombre} - {propiedad.direccion}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('inq.adjuntarFoto')}</label>
                  <input type="file" ref={avatarInputRef} accept="image/*" onChange={handleAvatarFileChange} style={{ display: 'none' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <TenantAvatar src={avatarPreview || (editingInquilino?.avatar) || undefined} alt="Avatar" size={64} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17,8 12,3 7,8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        {editingInquilino?.avatar ? t('inq.cambiarFoto') : t('inq.adjuntarFoto')}
                      </button>
                      {avatarFile && <span style={{ fontSize: '12px', color: '#6b7280' }}>{t('inq.archivoSeleccionado')} {avatarFile.name}</span>}
                    </div>
                  </div>
                  <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>{t('inq.fotoInfo')}</small>
                </div>
                <div className="form-group">
                  <label>{t('inq.adjuntarDocumento')}</label>
                  <input type="file" ref={documentoInputRef} accept="image/*,.pdf" onChange={handleDocumentoFileChange} style={{ display: 'none' }} />
                  <div style={{
                    border: '2px dashed #d1d5db', borderRadius: '8px', padding: '16px',
                    textAlign: 'center', cursor: 'pointer', backgroundColor: '#f9fafb',
                  }} onClick={() => documentoInputRef.current?.click()}>
                    {documentoFile ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14,2 14,8 20,8" />
                        </svg>
                        <span style={{ fontSize: '13px', color: '#374151' }}>{t('inq.archivoSeleccionado')} {documentoFile.name}</span>
                      </div>
                    ) : editingInquilino?.documentoIdentidadUrl ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14,2 14,8 20,8" />
                        </svg>
                        <span style={{ fontSize: '13px', color: '#3b82f6' }}>{t('inq.cambiarDocumento')}</span>
                        <a href={editingInquilino.documentoIdentidadUrl} target="_blank" rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()} style={{ fontSize: '12px', color: '#3b82f6' }}>
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
                        <span style={{ fontSize: '13px', color: '#6b7280' }}>{t('inq.adjuntarDocumento')}</span>
                      </div>
                    )}
                  </div>
                  <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>{t('inq.documentoInfo')}</small>
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
