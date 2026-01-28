import { useState, useEffect, useCallback } from 'react';
import type { Inquilino, InquilinoFormData } from '../../types';
import {
  getInquilinos,
  createInquilino,
  updateInquilino,
  deleteInquilino,
} from '../../services/inquilinosService';

const emptyFormData: InquilinoFormData = {
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  documento: '',
  avatar: '',
  propiedadId: undefined,
};

export function InquilinosPage() {
  const [inquilinos, setInquilinos] = useState<Inquilino[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingInquilino, setEditingInquilino] = useState<Inquilino | null>(null);
  const [formData, setFormData] = useState<InquilinoFormData>(emptyFormData);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(0); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch inquilinos from API
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
        propiedadId: inquilino.propiedadId,
      });
    } else {
      setEditingInquilino(null);
      setFormData(emptyFormData);
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
      fetchInquilinos(); // Refresh the list
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
      fetchInquilinos(); // Refresh the list
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
      case 'finalizado':
        return 'badge-danger';
      case 'sin_contrato':
        return '';
      default:
        return '';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Generate page numbers for pagination
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

  return (
    <div className="inquilinos-page">
      <div className="page-header">
        <h1 className="page-title">Inquilinos</h1>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <span>+</span> Agregar inquilino
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
            style={{
              marginLeft: '12px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#dc2626'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Search */}
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
      </div>

      {/* Loading state */}
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
          {/* Table */}
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
                      <div className="tenant-cell">
                        <img
                          src={inquilino.avatar || '/default-avatar.png'}
                          alt={inquilino.nombre}
                          className="tenant-avatar"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/default-avatar.png';
                          }}
                        />
                        <div className="tenant-info">
                          <span className="tenant-name">
                            {inquilino.nombre} {inquilino.apellido}
                          </span>
                          <span className="tenant-subtitle">
                            {inquilino.propiedad?.nombre || 'Sin propiedad'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      {inquilino.propiedad ? (
                        <div className="property-info-cell">
                          <span className="property-name-text">{inquilino.propiedad.nombre}</span>
                          <span className="property-address-text">
                            {inquilino.propiedad.direccion}, {inquilino.propiedad.ciudad}
                          </span>
                        </div>
                      ) : (
                        <span className="no-property">Sin propiedad</span>
                      )}
                    </td>
                    <td>
                      <span className="phone-text">{inquilino.telefono}</span>
                    </td>
                    <td>
                      {inquilino.contratoEstado === 'sin_contrato' || !inquilino.contratoEstado ? (
                        <span className="no-contract">No contrato</span>
                      ) : (
                        <div className="contract-info">
                          <span className={`badge ${getContratoEstadoClass(inquilino.contratoEstado)}`}>
                            {inquilino.contratoEstado === 'activo' ? 'Active' : 'Finalizado'}
                          </span>
                          {inquilino.contratoFin && (
                            <span className="contract-date">
                              $) {formatDate(inquilino.contratoFin)}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
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
                          className="btn btn-outline btn-sm btn-danger"
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

          {/* Pagination */}
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

      {/* Modal */}
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
                  <label htmlFor="avatar">URL de foto (opcional)</label>
                  <input
                    type="url"
                    id="avatar"
                    name="avatar"
                    value={formData.avatar}
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
                  {submitting ? 'Guardando...' : (editingInquilino ? 'Guardar cambios' : 'Agregar inquilino')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
