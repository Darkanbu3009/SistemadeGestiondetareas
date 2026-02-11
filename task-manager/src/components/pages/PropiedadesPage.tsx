import { useState, useEffect, useCallback, useRef } from 'react';
import type { Propiedad, PropiedadFormData } from '../../types';
import {
  getAllPropiedades,
  createPropiedad,
  updatePropiedad,
  deletePropiedad,
} from '../../services/propiedadService';
import { getInquilinosByPropiedad } from '../../services/inquilinosService';
import { useLanguage } from '../../i18n/LanguageContext';
import { PropertyMap } from '../map/PropertyMap';

const emptyFormData: PropiedadFormData = {
  nombre: '',
  direccion: '',
  ciudad: '',
  pais: '',
  tipo: 'apartamento',
  rentaMensual: 0,
  estado: 'disponible',
  imagen: '',
};

type ViewMode = 'grid' | 'map';

// Tipo extendido para incluir inquilino
interface PropiedadConInquilino extends Propiedad {
  inquilinoNombre?: string;
  inquilinoApellido?: string;
  inquilinoAvatar?: string;
}

export function PropiedadesPage() {
  const { t } = useLanguage();
  const [propiedades, setPropiedades] = useState<PropiedadConInquilino[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPropiedad, setEditingPropiedad] = useState<Propiedad | null>(null);
  const [formData, setFormData] = useState<PropiedadFormData>(emptyFormData);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const mapListRef = useRef<HTMLDivElement>(null);

  // Load properties from API and fetch associated tenants
  const loadPropiedades = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllPropiedades();
      
      // Obtener inquilinos para cada propiedad
      const propiedadesConInquilinos = await Promise.all(
        data.map(async (propiedad) => {
          try {
            const inquilinos = await getInquilinosByPropiedad(propiedad.id);
            if (inquilinos && inquilinos.length > 0) {
              const inquilino = inquilinos[0];
              return {
                ...propiedad,
                inquilinoNombre: inquilino.nombre,
                inquilinoApellido: inquilino.apellido,
                inquilinoAvatar: inquilino.avatar,
              };
            }
          } catch {
            // Si hay error obteniendo inquilinos, continuar sin ellos
          }
          return propiedad;
        })
      );
      
      setPropiedades(propiedadesConInquilinos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar propiedades');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load properties on mount
  useEffect(() => {
    loadPropiedades();
  }, [loadPropiedades]);

  const handleOpenModal = (propiedad?: Propiedad) => {
    if (propiedad) {
      setEditingPropiedad(propiedad);
      setFormData({
        nombre: propiedad.nombre,
        direccion: propiedad.direccion,
        ciudad: propiedad.ciudad,
        pais: propiedad.pais,
        tipo: propiedad.tipo,
        rentaMensual: propiedad.rentaMensual,
        estado: propiedad.estado,
        imagen: propiedad.imagen || '',
      });
    } else {
      setEditingPropiedad(null);
      setFormData(emptyFormData);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPropiedad(null);
    setFormData(emptyFormData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'rentaMensual' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (editingPropiedad) {
        await updatePropiedad(editingPropiedad.id, formData);
      } else {
        await createPropiedad(formData);
      }
      handleCloseModal();
      loadPropiedades(); // Recargar para obtener datos actualizados
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar propiedad');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estas seguro de eliminar esta propiedad?')) {
      return;
    }

    try {
      setError(null);
      await deletePropiedad(id);
      setPropiedades((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar propiedad');
    }
  };

  const filteredPropiedades = propiedades.filter((p) =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.direccion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getEstadoClass = (estado: string) => {
    switch (estado) {
      case 'disponible':
        return 'badge-success';
      case 'ocupada':
        return 'badge-primary';
      case 'mantenimiento':
        return 'badge-warning';
      default:
        return '';
    }
  };

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'disponible':
        return t('prop.disponible');
      case 'ocupada':
        return t('prop.ocupada');
      case 'mantenimiento':
        return t('prop.mantenimiento');
      default:
        return estado;
    }
  };

  // Función para manejar errores de imagen
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.style.display = 'none';
  };

  // Avatar placeholder
  const AvatarPlaceholder = ({ size = 32 }: { size?: number }) => (
    <div style={{
      width: size,
      height: size,
      backgroundColor: '#e5e7eb',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </div>
  );

  return (
    <div className="propiedades-page">
      <div className="page-header">
        <h1 className="page-title">{t('prop.titulo')}</h1>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          {t('prop.agregar')}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="error-message" style={{
          backgroundColor: '#fee2e2',
          color: '#dc2626',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          {error}
          <button
            onClick={() => setError(null)}
            style={{ marginLeft: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="table-toolbar">
        <div className="search-box">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder={t('prop.buscar')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="view-toggle">
          <button
            className={`view-btn ${viewMode === 'map' ? 'active' : ''}`}
            onClick={() => setViewMode('map')}
            title={t('prop.vistaMapa')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </button>
          <button
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title={t('prop.vistaGrid')}
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

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <div className="loading-spinner" style={{
            width: '40px',
            height: '40px',
            border: '3px solid #e5e7eb',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
          <p style={{ marginTop: '16px', color: '#6b7280' }}>{t('prop.cargando')}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && propiedades.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
          <p>{t('prop.sinPropiedades')}</p>
          <button
            className="btn btn-primary"
            onClick={() => handleOpenModal()}
            style={{ marginTop: '16px' }}
          >
            {t('prop.agregarPrimera')}
          </button>
        </div>
      )}

      {/* Grid View */}
      {!loading && propiedades.length > 0 && viewMode === 'grid' && (
        <div className="properties-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '24px',
          marginTop: '24px'
        }}>
          {filteredPropiedades.map((propiedad) => (
            <div key={propiedad.id} className="property-card" style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              border: '1px solid #e5e7eb'
            }}>
              {/* Property Image */}
              <div style={{
                height: '180px',
                backgroundColor: '#f3f4f6',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {propiedad.imagen ? (
                  <img
                    src={propiedad.imagen}
                    alt={propiedad.nombre}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={handleImageError}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9,22 9,12 15,12 15,22" />
                    </svg>
                  </div>
                )}
                <span className={`badge ${getEstadoClass(propiedad.estado)}`} style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px'
                }}>
                  {getEstadoLabel(propiedad.estado)}
                </span>
              </div>

              {/* Property Details */}
              <div style={{ padding: '16px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>
                  {propiedad.nombre}
                </h3>
                <p style={{ margin: '0 0 12px 0', color: '#6b7280', fontSize: '14px' }}>
                  {propiedad.direccion}, {propiedad.ciudad}
                </p>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px'
                }}>
                  <span style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
                    ${propiedad.rentaMensual.toLocaleString()}
                    <span style={{ fontSize: '14px', fontWeight: '400', color: '#6b7280' }}>{t('prop.mes')}</span>
                  </span>
                </div>

                {/* Inquilino */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}>
                  {propiedad.inquilinoNombre ? (
                    <>
                      {propiedad.inquilinoAvatar ? (
                        <img
                          src={propiedad.inquilinoAvatar}
                          alt={propiedad.inquilinoNombre}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            objectFit: 'cover'
                          }}
                          onError={handleImageError}
                        />
                      ) : (
                        <AvatarPlaceholder size={32} />
                      )}
                      <div>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>
                          {propiedad.inquilinoNombre} {propiedad.inquilinoApellido}
                        </p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Inquilino</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AvatarPlaceholder size={32} />
                      <span style={{ color: '#9ca3af', fontSize: '14px' }}>{t('prop.sinInquilino')}</span>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => handleOpenModal(propiedad)}
                    style={{ flex: 1 }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    {t('prop.editarBtn')}
                  </button>
                  <button
                    onClick={() => handleDelete(propiedad.id)}
                    style={{
                      backgroundColor: '#ef4444',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <polyline points="3,6 5,6 21,6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Map View */}
      {!loading && propiedades.length > 0 && viewMode === 'map' && (
        <div style={{
          display: 'flex',
          gap: '20px',
          marginTop: '24px',
          height: 'calc(100vh - 220px)',
          minHeight: '500px',
        }}>
          {/* Property cards sidebar */}
          <div
            ref={mapListRef}
            style={{
              width: '380px',
              minWidth: '380px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              paddingRight: '8px',
            }}
          >
            {filteredPropiedades.map((propiedad) => {
              const isSelected = propiedad.id === selectedPropertyId;
              return (
                <div
                  key={propiedad.id}
                  id={`map-card-${propiedad.id}`}
                  onClick={() => setSelectedPropertyId(propiedad.id)}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    border: isSelected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    boxShadow: isSelected
                      ? '0 4px 12px rgba(59,130,246,0.15)'
                      : '0 1px 3px rgba(0,0,0,0.08)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px', padding: '12px' }}>
                    {/* Thumbnail */}
                    <div style={{
                      width: '100px',
                      minWidth: '100px',
                      height: '80px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      backgroundColor: '#f3f4f6',
                    }}>
                      {propiedad.imagen ? (
                        <img
                          src={propiedad.imagen}
                          alt={propiedad.nombre}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={handleImageError}
                        />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9,22 9,12 15,12 15,22" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '4px',
                      }}>
                        <h4 style={{
                          margin: 0,
                          fontSize: '15px',
                          fontWeight: 600,
                          color: '#1f2937',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '160px',
                        }}>
                          {propiedad.nombre}
                        </h4>
                        <span className={`badge ${getEstadoClass(propiedad.estado)}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                          {getEstadoLabel(propiedad.estado)}
                        </span>
                      </div>

                      <p style={{
                        margin: '0 0 6px 0',
                        fontSize: '13px',
                        color: '#6b7280',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {propiedad.direccion}, {propiedad.ciudad}
                      </p>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}>
                        <span style={{ fontSize: '16px', fontWeight: 700, color: '#1f2937' }}>
                          ${propiedad.rentaMensual.toLocaleString()}
                          <span style={{ fontSize: '12px', fontWeight: 400, color: '#6b7280' }}>{t('prop.mes')}</span>
                        </span>

                        {propiedad.inquilinoNombre ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {propiedad.inquilinoAvatar ? (
                              <img
                                src={propiedad.inquilinoAvatar}
                                alt={propiedad.inquilinoNombre}
                                style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }}
                                onError={handleImageError}
                              />
                            ) : (
                              <AvatarPlaceholder size={22} />
                            )}
                            <span style={{ fontSize: '12px', color: '#6b7280' }}>
                              {propiedad.inquilinoNombre}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                            {t('prop.sinInquilino')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredPropiedades.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '32px 16px',
                color: '#6b7280',
                fontSize: '14px',
              }}>
                {t('prop.sinPropiedades')}
              </div>
            )}
          </div>

          {/* Map container */}
          <div style={{
            flex: 1,
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid #e5e7eb',
          }}>
            <PropertyMap
              propiedades={filteredPropiedades}
              selectedPropertyId={selectedPropertyId}
              onPropertySelect={(id) => {
                setSelectedPropertyId(id);
                const card = document.getElementById(`map-card-${id}`);
                if (card && mapListRef.current) {
                  card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredPropiedades.length > 0 && viewMode !== 'map' && (
        <div className="table-pagination">
          <span className="pagination-info">1-{filteredPropiedades.length} de {filteredPropiedades.length}</span>
          <div className="pagination-controls">
            <button className="pagination-btn" disabled>&lt;</button>
            <button className="pagination-btn active">1</button>
            <button className="pagination-btn" disabled>&gt;</button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingPropiedad ? t('prop.editar') : t('prop.agregarTitle')}</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="nombre">{t('prop.nombre')}</label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="direccion">{t('prop.direccion')}</label>
                    <input
                      type="text"
                      id="direccion"
                      name="direccion"
                      value={formData.direccion}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="ciudad">{t('prop.ciudad')}</label>
                    <input
                      type="text"
                      id="ciudad"
                      name="ciudad"
                      value={formData.ciudad}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="pais">{t('prop.pais')}</label>
                    <input
                      type="text"
                      id="pais"
                      name="pais"
                      value={formData.pais}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="tipo">{t('prop.tipo')}</label>
                    <select
                      id="tipo"
                      name="tipo"
                      value={formData.tipo}
                      onChange={handleInputChange}
                    >
                      <option value="apartamento">{t('prop.apartamento')}</option>
                      <option value="casa">{t('prop.casa')}</option>
                      <option value="local">{t('prop.localComercial')}</option>
                      <option value="oficina">{t('prop.oficina')}</option>
                      <option value="otro">{t('prop.otro')}</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="rentaMensual">{t('prop.rentaMensual')} ($)</label>
                    <input
                      type="number"
                      id="rentaMensual"
                      name="rentaMensual"
                      value={formData.rentaMensual}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="estado">{t('prop.estado')}</label>
                    <select
                      id="estado"
                      name="estado"
                      value={formData.estado}
                      onChange={handleInputChange}
                    >
                      <option value="disponible">{t('prop.disponible')}</option>
                      <option value="ocupada">{t('prop.ocupada')}</option>
                      <option value="mantenimiento">{t('prop.mantenimiento')}</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="imagen">{t('prop.urlImagen')}</label>
                  <input
                    type="url"
                    id="imagen"
                    name="imagen"
                    value={formData.imagen}
                    onChange={handleInputChange}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal} disabled={submitting}>
                  {t('prop.cancelar')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? t('common.guardando') : editingPropiedad ? t('prop.guardarCambios') : t('prop.agregarTitle')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
