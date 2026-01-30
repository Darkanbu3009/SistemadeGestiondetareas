import { useState, useEffect, useCallback } from 'react';
import type { Propiedad, PropiedadFormData } from '../../types';
import {
  getAllPropiedades,
  createPropiedad,
  updatePropiedad,
  deletePropiedad,
} from '../../services/propiedadService';
import { getInquilinosByPropiedad } from '../../services/inquilinosService';

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

type ViewMode = 'grid' | 'list';

// Tipo extendido para incluir inquilino
interface PropiedadConInquilino extends Propiedad {
  inquilinoNombre?: string;
  inquilinoApellido?: string;
  inquilinoAvatar?: string;
}

export function PropiedadesPage() {
  const [propiedades, setPropiedades] = useState<PropiedadConInquilino[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPropiedad, setEditingPropiedad] = useState<Propiedad | null>(null);
  const [formData, setFormData] = useState<PropiedadFormData>(emptyFormData);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

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
        return 'Disponible';
      case 'ocupada':
        return 'Ocupada';
      case 'mantenimiento':
        return 'Mantenimiento';
      default:
        return estado;
    }
  };

  // Función para manejar errores de imagen
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.style.display = 'none';
  };

  // Placeholder para imágenes
  const PropertyPlaceholder = () => (
    <div className="property-placeholder" style={{
      width: '48px',
      height: '48px',
      backgroundColor: '#e5e7eb',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9,22 9,12 15,12 15,22" />
      </svg>
    </div>
  );

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
        <h1 className="page-title">Propiedades</h1>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <span>+</span> Agregar propiedad
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
            placeholder="Buscar propiedad..."
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
          <p style={{ marginTop: '16px', color: '#6b7280' }}>Cargando propiedades...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && propiedades.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
          <p>No hay propiedades registradas</p>
          <button
            className="btn btn-primary"
            onClick={() => handleOpenModal()}
            style={{ marginTop: '16px' }}
          >
            Agregar primera propiedad
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
                    <span style={{ fontSize: '14px', fontWeight: '400', color: '#6b7280' }}>/mes</span>
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
                      <span style={{ color: '#9ca3af', fontSize: '14px' }}>Sin inquilino</span>
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
                    Editar
                  </button>
                  <button
                    className="btn btn-outline btn-sm btn-danger"
                    onClick={() => handleDelete(propiedad.id)}
                    style={{ color: '#dc2626', borderColor: '#dc2626' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

      {/* List/Table View */}
      {!loading && propiedades.length > 0 && viewMode === 'list' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Propiedad</th>
                <th>Direccion</th>
                <th>Inquilino</th>
                <th>Renta mensual</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredPropiedades.map((propiedad) => (
                <tr key={propiedad.id}>
                  <td>
                    <div className="property-cell" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {propiedad.imagen ? (
                        <img
                          src={propiedad.imagen}
                          alt={propiedad.nombre}
                          className="property-thumbnail"
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '8px',
                            objectFit: 'cover'
                          }}
                          onError={handleImageError}
                        />
                      ) : (
                        <PropertyPlaceholder />
                      )}
                      <span className="property-name">{propiedad.nombre}</span>
                    </div>
                  </td>
                  <td>
                    <span className="address-text">
                      {propiedad.direccion}, {propiedad.ciudad}, {propiedad.pais}
                    </span>
                  </td>
                  <td>
                    {propiedad.inquilinoNombre ? (
                      <div className="tenant-cell-small" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {propiedad.inquilinoAvatar ? (
                          <img
                            src={propiedad.inquilinoAvatar}
                            alt={propiedad.inquilinoNombre}
                            className="tenant-avatar-small"
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              objectFit: 'cover'
                            }}
                            onError={handleImageError}
                          />
                        ) : (
                          <AvatarPlaceholder size={28} />
                        )}
                        <span>{propiedad.inquilinoNombre} {propiedad.inquilinoApellido}</span>
                      </div>
                    ) : (
                      <span className="no-tenant" style={{ color: '#9ca3af' }}>Sin inquilino</span>
                    )}
                  </td>
                  <td>
                    <span className="rent-value">${propiedad.rentaMensual.toLocaleString()}</span>
                  </td>
                  <td>
                    <span className={`badge ${getEstadoClass(propiedad.estado)}`}>
                      {getEstadoLabel(propiedad.estado)}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons" style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-icon"
                        onClick={() => handleOpenModal(propiedad)}
                        title="Editar"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        className="btn btn-icon btn-danger"
                        onClick={() => handleDelete(propiedad.id)}
                        title="Eliminar"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3,6 5,6 21,6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredPropiedades.length > 0 && (
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
              <h2>{editingPropiedad ? 'Editar propiedad' : 'Agregar propiedad'}</h2>
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
                  <label htmlFor="nombre">Nombre de la propiedad</label>
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
                    <label htmlFor="direccion">Direccion</label>
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
                    <label htmlFor="ciudad">Ciudad</label>
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
                    <label htmlFor="pais">Pais</label>
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
                    <label htmlFor="tipo">Tipo</label>
                    <select
                      id="tipo"
                      name="tipo"
                      value={formData.tipo}
                      onChange={handleInputChange}
                    >
                      <option value="apartamento">Apartamento</option>
                      <option value="casa">Casa</option>
                      <option value="local">Local comercial</option>
                      <option value="oficina">Oficina</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="rentaMensual">Renta mensual ($)</label>
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
                    <label htmlFor="estado">Estado</label>
                    <select
                      id="estado"
                      name="estado"
                      value={formData.estado}
                      onChange={handleInputChange}
                    >
                      <option value="disponible">Disponible</option>
                      <option value="ocupada">Ocupada</option>
                      <option value="mantenimiento">Mantenimiento</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="imagen">URL de imagen (opcional)</label>
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
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Guardando...' : editingPropiedad ? 'Guardar cambios' : 'Agregar propiedad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
