import { useState, useEffect, useCallback } from 'react';
import type { Propiedad, PropiedadFormData } from '../../types';
import {
  getAllPropiedades,
  createPropiedad,
  updatePropiedad,
  deletePropiedad,
} from '../../services/propiedadService';

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

export function PropiedadesPage() {
  const [propiedades, setPropiedades] = useState<Propiedad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPropiedad, setEditingPropiedad] = useState<Propiedad | null>(null);
  const [formData, setFormData] = useState<PropiedadFormData>(emptyFormData);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load properties from API
  const loadPropiedades = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllPropiedades();
      setPropiedades(data);
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
        // Update existing
        const updated = await updatePropiedad(editingPropiedad.id, formData);
        setPropiedades((prev) =>
          prev.map((p) => (p.id === editingPropiedad.id ? updated : p))
        );
      } else {
        // Create new
        const created = await createPropiedad(formData);
        setPropiedades((prev) => [created, ...prev]);
      }
      handleCloseModal();
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
            X
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
          <button className="view-btn active">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </button>
          <button className="view-btn">
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

      {/* Table */}
      {!loading && propiedades.length > 0 && (
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
                    <div className="property-cell">
                      {propiedad.imagen && (
                        <img
                          src={propiedad.imagen}
                          alt={propiedad.nombre}
                          className="property-thumbnail"
                        />
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
                    {propiedad.inquilino ? (
                      <div className="tenant-cell-small">
                        <img
                          src={propiedad.inquilino.avatar || '/default-avatar.png'}
                          alt={propiedad.inquilino.nombre}
                          className="tenant-avatar-small"
                        />
                        <span>{propiedad.inquilino.nombre} {propiedad.inquilino.apellido}</span>
                      </div>
                    ) : (
                      <span className="no-tenant">Sin inquilino</span>
                    )}
                  </td>
                  <td>
                    <span className="rent-value">${propiedad.rentaMensual.toLocaleString()}</span>
                  </td>
                  <td>
                    <span className={`badge ${getEstadoClass(propiedad.estado)}`}>
                      {propiedad.estado === 'disponible' ? 'Disponible' :
                       propiedad.estado === 'ocupada' ? 'Ocupada' : 'Mantenimiento'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
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
            <button className="pagination-btn">&gt;</button>
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
