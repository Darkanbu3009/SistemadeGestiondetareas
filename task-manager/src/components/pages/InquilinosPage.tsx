import { useState, useEffect, useCallback } from 'react';
import type { Inquilino, InquilinoFormData, Propiedad } from '../../types';
import {
  getInquilinos,
  createInquilino,
  updateInquilino,
  deleteInquilino,
} from '../../services/inquilinosService';
import { getPropiedadesDisponibles, getAllPropiedades } from '../../services/propiedadService';

const emptyFormData: InquilinoFormData = {
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  documento: '',
  avatar: '',
  propiedadId: undefined,
};

type ViewMode = 'grid' | 'list';

export function InquilinosPage() {
  const [inquilinos, setInquilinos] = useState<Inquilino[]>([]);
  const [propiedadesDisponibles, setPropiedadesDisponibles] = useState<Propiedad[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingInquilino, setEditingInquilino] = useState<Inquilino | null>(null);
  const [formData, setFormData] = useState<InquilinoFormData>(emptyFormData);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;

  const [debouncedSearch, setDebouncedSearch] = useState('');

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
        propiedadId: inquilino.propiedad?.id,
      });
      fetchPropiedadesDisponibles(inquilino);
    } else {
      setEditingInquilino(null);
      setFormData(emptyFormData);
      fetchPropiedadesDisponibles();
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingInquilino(null);
    setFormData(emptyFormData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'propiedadId' ? (value ? parseInt(value) : undefined) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (editingInquilino) {
        await updateInquilino(editingInquilino.id, formData);
      } else {
        await createInquilino(formData);
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
    if (!window.confirm('¿Está seguro de eliminar este inquilino?')) {
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

  // ============================================
  // FUNCIONES ACTUALIZADAS PARA MOSTRAR ESTADOS
  // ============================================

  // Get badge class based on contrato estado - Sincronizado con contratos
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

  // Get label for contrato estado - Sincronizado con contratos
  const getContratoEstadoLabel = (estado?: string) => {
    switch (estado) {
      case 'activo':
        return 'Activo';
      case 'en_proceso':
        return 'En Proceso';
      case 'finalizado':
        return 'Finalizado';
      case 'sin_contrato':
        return 'Sin Contrato';
      default:
        return 'Sin Contrato';
    }
  };

  // ============================================
  // FIN DE FUNCIONES ACTUALIZADAS
  // ============================================

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
        <h1 className="page-title">Inquilinos</h1>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <span>+</span> Agregar inquilino
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
            placeholder="Buscar inquilino..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="view-toggle">
          <button
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Vista en cuadrícula"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </button>
          <button
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="Vista en lista"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
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
          <span>Cargando inquilinos...</span>
        </div>
      ) : inquilinos.length === 0 ? (
        <div className="empty-state" style={{
          textAlign: 'center',
          padding: '60px',
          color: '#6b7280'
        }}>
          <p>{debouncedSearch ? 'No se encontraron inquilinos' : 'No hay inquilinos registrados'}</p>
          {!debouncedSearch && (
            <button className="btn btn-primary" onClick={() => handleOpenModal()} style={{ marginTop: '16px' }}>
              Agregar primer inquilino
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Grid View */}
          {viewMode === 'grid' ? (
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
                      <span className="badge badge-secondary">Sin Contrato</span>
                    )}
                  </div>

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
                      <span style={{ color: '#9ca3af', fontSize: '14px' }}>Sin propiedad asignada</span>
                    )}
                  </div>

                  {/* Details */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <span style={{ fontSize: '12px', color: '#6b7280', display: 'block' }}>Teléfono</span>
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>{inquilino.telefono}</span>
                    </div>
                    {inquilino.contratoFin && (
                      <div>
                        <span style={{ fontSize: '12px', color: '#6b7280', display: 'block' }}>Vencimiento</span>
                        <span style={{ fontSize: '14px', fontWeight: '500' }}>{formatDate(inquilino.contratoFin)}</span>
                      </div>
                    )}
                  </div>

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
                      Editar
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
                      Contactar
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
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List/Table View */
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Inquilino</th>
                    <th>Propiedad</th>
                    <th>Telefono</th>
                    <th>Contrato</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {inquilinos.map((inquilino) => (
                    <tr key={inquilino.id}>
                      <td>
                        <div className="tenant-cell" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <TenantAvatar
                            src={inquilino.avatar}
                            alt={`${inquilino.nombre} ${inquilino.apellido}`}
                            size={40}
                          />
                          <div className="tenant-info">
                            <span className="tenant-name" style={{ fontWeight: '500', display: 'block' }}>
                              {inquilino.nombre} {inquilino.apellido}
                            </span>
                            <span className="tenant-subtitle" style={{ fontSize: '13px', color: '#6b7280' }}>
                              {inquilino.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        {inquilino.propiedad ? (
                          <div className="property-info-cell">
                            <span className="property-name-text" style={{ fontWeight: '500', display: 'block' }}>
                              {inquilino.propiedad.nombre}
                            </span>
                            <span className="property-address-text" style={{ fontSize: '13px', color: '#6b7280' }}>
                              {inquilino.propiedad.direccion}, {inquilino.propiedad.ciudad}
                            </span>
                          </div>
                        ) : (
                          <span className="no-property" style={{ color: '#9ca3af' }}>Sin propiedad</span>
                        )}
                      </td>
                      <td>
                        <span className="phone-text">{inquilino.telefono}</span>
                      </td>
                      <td>
                        {inquilino.contratoEstado === 'sin_contrato' || !inquilino.contratoEstado ? (
                          <span className="no-contract" style={{ color: '#9ca3af' }}>Sin contrato</span>
                        ) : (
                          <div className="contract-info">
                            <span className={`badge ${getContratoEstadoClass(inquilino.contratoEstado)}`}>
                              {getContratoEstadoLabel(inquilino.contratoEstado)}
                            </span>
                            {inquilino.contratoFin && (
                              <span className="contract-date" style={{
                                display: 'block',
                                fontSize: '12px',
                                color: '#6b7280',
                                marginTop: '4px'
                              }}>
                                Vence: {formatDate(inquilino.contratoFin)}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="action-buttons" style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => handleOpenModal(inquilino)}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            Editar
                          </button>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => handleContactar(inquilino)}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                              <polyline points="22,6 12,13 2,6" />
                            </svg>
                            Contactar
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
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="table-pagination">
            <span className="pagination-info">
              {totalElements > 0 ? `${startItem}-${endItem} de ${totalElements}` : '0 resultados'}
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
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingInquilino ? 'Editar inquilino' : 'Agregar inquilino'}</h2>
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
                    <label htmlFor="nombre">Nombre</label>
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
                    <label htmlFor="apellido">Apellido</label>
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
                  <label htmlFor="email">Email</label>
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
                    <label htmlFor="telefono">Telefono</label>
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
                    <label htmlFor="documento">Documento de identidad</label>
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

                <div className="form-group">
                  <label htmlFor="propiedadId">Propiedad (opcional)</label>
                  <select
                    id="propiedadId"
                    name="propiedadId"
                    value={formData.propiedadId || ''}
                    onChange={handleInputChange}
                  >
                    <option value="">Sin propiedad asignada</option>
                    {propiedadesDisponibles.map((propiedad) => (
                      <option key={propiedad.id} value={propiedad.id}>
                        {propiedad.nombre} - {propiedad.direccion}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="avatar">URL de foto (opcional)</label>
                  <input
                    type="text"
                    id="avatar"
                    name="avatar"
                    value={formData.avatar}
                    onChange={handleInputChange}
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                  <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    Ingresa una URL válida de imagen (jpg, png, webp).
                  </small>
                  {formData.avatar && (
                    <div style={{ marginTop: '12px' }}>
                      <span style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                        Vista previa:
                      </span>
                      <TenantAvatar src={formData.avatar} alt="Vista previa" size={64} />
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal} disabled={submitting}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Guardando...' : (editingInquilino ? 'Guardar cambios' : 'Agregar inquilino')}
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
