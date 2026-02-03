import { useState, useEffect, useCallback, useRef } from 'react';
import type { Contrato, ContratoFormData, Inquilino, Propiedad, ContratoEstado } from '../../types';
import {
  getContratos,
  createContrato,
  updateContrato,
  deleteContrato,
  getContratosCountByEstado,
  uploadContratoPdf,
} from '../../services/contratosService';
import { getAllInquilinos } from '../../services/inquilinosService';
import { getAllPropiedades } from '../../services/propiedadService';

interface ContratoStats {
  activos: number;
  porVencer: number;
  finalizados: number;
  sinFirmar: number;
}

const emptyFormData: ContratoFormData = {
  inquilinoId: 0,
  propiedadId: 0,
  fechaInicio: '',
  fechaFin: '',
  rentaMensual: 0,
  estado: 'sin_firmar',
  pdfUrl: '',
};

// Opciones de estado para el dropdown
const estadoOptions: { value: ContratoEstado; label: string }[] = [
  { value: 'sin_firmar', label: 'Sin Firmar' },
  { value: 'en_proceso', label: 'En Proceso' },
  { value: 'firmado', label: 'Firmado' },
  { value: 'activo', label: 'Activo' },
  { value: 'por_vencer', label: 'Por Vencer' },
  { value: 'finalizado', label: 'Finalizado' },
];

export function ContratosPage() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [inquilinos, setInquilinos] = useState<Inquilino[]>([]);
  const [propiedades, setPropiedades] = useState<Propiedad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingContrato, setEditingContrato] = useState<Contrato | null>(null);
  const [formData, setFormData] = useState<ContratoFormData>(emptyFormData);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [stats, setStats] = useState<ContratoStats>({
    activos: 0,
    porVencer: 0,
    finalizados: 0,
    sinFirmar: 0,
  });
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pageSize = 10;

  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchContratos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getContratos(
        currentPage,
        pageSize,
        debouncedSearch || undefined,
        filterEstado || undefined
      );
      setContratos(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err) {
      console.error('Error fetching contratos:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar contratos');
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, filterEstado]);

  const fetchStats = useCallback(async () => {
    try {
      const [activos, porVencer, finalizados, sinFirmar] = await Promise.all([
        getContratosCountByEstado('activo'),
        getContratosCountByEstado('por_vencer'),
        getContratosCountByEstado('finalizado'),
        getContratosCountByEstado('sin_firmar'),
      ]);
      setStats({ activos, porVencer, finalizados, sinFirmar });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  const fetchDropdownData = useCallback(async () => {
    try {
      const [inquilinosData, propiedadesData] = await Promise.all([
        getAllInquilinos(),
        getAllPropiedades(),
      ]);
      setInquilinos(inquilinosData);
      setPropiedades(propiedadesData);
    } catch (err) {
      console.error('Error fetching dropdown data:', err);
      setError('Error al cargar inquilinos y propiedades.');
    }
  }, []);

  useEffect(() => {
    fetchContratos();
  }, [fetchContratos]);

  useEffect(() => {
    fetchStats();
    fetchDropdownData();
  }, [fetchStats, fetchDropdownData]);

  const handleOpenModal = (contrato?: Contrato) => {
    if (contrato) {
      setEditingContrato(contrato);
      setFormData({
        inquilinoId: contrato.inquilinoId || contrato.inquilino?.id || 0,
        propiedadId: contrato.propiedadId || contrato.propiedad?.id || 0,
        fechaInicio: contrato.fechaInicio,
        fechaFin: contrato.fechaFin,
        rentaMensual: contrato.rentaMensual,
        estado: contrato.estado || 'sin_firmar',
        pdfUrl: contrato.pdfUrl || '',
      });
    } else {
      setEditingContrato(null);
      setFormData(emptyFormData);
    }
    setSelectedPdfFile(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingContrato(null);
    setFormData(emptyFormData);
    setSelectedPdfFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ['inquilinoId', 'propiedadId', 'rentaMensual'].includes(name)
        ? parseFloat(value) || 0
        : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Solo se permiten archivos PDF');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('El archivo no puede superar los 10MB');
        return;
      }
      setSelectedPdfFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.inquilinoId || formData.inquilinoId === 0) {
      setError('Por favor selecciona un inquilino');
      return;
    }

    if (!formData.propiedadId || formData.propiedadId === 0) {
      setError('Por favor selecciona una propiedad');
      return;
    }

    if (!formData.fechaInicio) {
      setError('Por favor ingresa la fecha de inicio');
      return;
    }

    if (!formData.fechaFin) {
      setError('Por favor ingresa la fecha de fin');
      return;
    }

    if (!formData.rentaMensual || formData.rentaMensual <= 0) {
      setError('Por favor ingresa una renta mensual válida');
      return;
    }

    try {
      let savedContrato: Contrato;

      if (editingContrato) {
        savedContrato = await updateContrato(editingContrato.id, formData);
      } else {
        savedContrato = await createContrato(formData);
      }

      // Upload PDF if selected
      if (selectedPdfFile && savedContrato.id) {
        setUploadingPdf(true);
        try {
          await uploadContratoPdf(savedContrato.id, selectedPdfFile);
        } catch (uploadErr) {
          console.error('Error uploading PDF:', uploadErr);
          setError('Contrato guardado pero hubo un error al subir el PDF');
        } finally {
          setUploadingPdf(false);
        }
      }

      handleCloseModal();
      fetchContratos();
      fetchStats();
    } catch (err) {
      console.error('Error saving contrato:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar contrato');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar este contrato?')) {
      try {
        await deleteContrato(id);
        fetchContratos();
        fetchStats();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al eliminar contrato');
      }
    }
  };

  const handleUploadPdfForExisting = async (contratoId: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        if (file.type !== 'application/pdf') {
          setError('Solo se permiten archivos PDF');
          return;
        }
        if (file.size > 10 * 1024 * 1024) {
          setError('El archivo no puede superar los 10MB');
          return;
        }
        try {
          setUploadingPdf(true);
          await uploadContratoPdf(contratoId, file);
          fetchContratos();
          setError(null);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Error al subir PDF');
        } finally {
          setUploadingPdf(false);
        }
      }
    };
    input.click();
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  const getEstadoClass = (estado: string) => {
    switch (estado) {
      case 'activo':
      case 'firmado':
        return 'badge-success';
      case 'por_vencer':
      case 'en_proceso':
        return 'badge-warning';
      case 'finalizado':
        return 'badge-danger';
      case 'sin_firmar':
        return 'badge-secondary';
      default:
        return '';
    }
  };

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'activo':
        return 'Activo';
      case 'por_vencer':
        return 'Por vencer';
      case 'finalizado':
        return 'Finalizado';
      case 'sin_firmar':
        return 'Sin firmar';
      case 'en_proceso':
        return 'En proceso';
      case 'firmado':
        return 'Firmado';
      default:
        return estado;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxPagesToShow = 4;
    let startPage = Math.max(0, currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(totalPages - 1, startPage + maxPagesToShow - 1);

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(0, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="contratos-page">
      <div className="page-header">
        <h1 className="page-title">Contratos</h1>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <span>+</span> Añadir contrato
        </button>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '8px' }}>
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: '1rem', cursor: 'pointer' }}>×</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid stats-4">
        <div className="stat-card stat-card-bordered">
          <div className="stat-header">
            <span className="stat-label">Contratos activos</span>
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.activos}</span>
          </div>
        </div>

        <div className="stat-card stat-card-bordered stat-card-warning">
          <div className="stat-header">
            <span className="stat-label">Contratos próximos a vencer</span>
            <span className="stat-icon warning">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </span>
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.porVencer}</span>
          </div>
        </div>

        <div className="stat-card stat-card-bordered">
          <div className="stat-header">
            <span className="stat-label">Contratos finalizados</span>
            <span className="stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </span>
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.finalizados}</span>
          </div>
        </div>

        <div className="stat-card stat-card-bordered">
          <div className="stat-header">
            <span className="stat-label">Contratos sin firmar</span>
            <span className="stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14,2 14,8 20,8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </span>
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.sinFirmar}</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="table-toolbar">
        <div className="toolbar-left">
          <select
            className="filter-select"
            value={filterEstado}
            onChange={(e) => {
              setFilterEstado(e.target.value);
              setCurrentPage(0);
            }}
          >
            <option value="">Todos</option>
            <option value="sin_firmar">Sin firmar</option>
            <option value="en_proceso">En proceso</option>
            <option value="firmado">Firmado</option>
            <option value="activo">Activo</option>
            <option value="por_vencer">Por vencer</option>
            <option value="finalizado">Finalizado</option>
          </select>
          <div className="search-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Buscar contrato..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
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

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando contratos...</div>
        ) : contratos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>No hay contratos registrados</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Inquilino</th>
                <th>Propiedad</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Renta</th>
                <th>Estado</th>
                <th>Documento</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {contratos.map((contrato) => (
                <tr key={contrato.id}>
                  <td>
                    <div className="tenant-cell">
                      <img
                        src={contrato.inquilino?.avatar || '/default-avatar.png'}
                        alt={contrato.inquilino?.nombre}
                        className="tenant-avatar"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/default-avatar.png';
                        }}
                      />
                      <div className="tenant-info">
                        <span className="tenant-name">
                          {contrato.inquilino?.nombre} {contrato.inquilino?.apellido}
                        </span>
                        <span className="tenant-subtitle">
                          {contrato.inquilino?.email}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="property-info-cell">
                      <span className="property-name-text">{contrato.propiedad?.nombre}</span>
                      <span className="property-address-text">
                        {contrato.propiedad?.direccion}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="date-text">{formatDate(contrato.fechaInicio)}</span>
                  </td>
                  <td>
                    <span className="date-text">{formatDate(contrato.fechaFin)}</span>
                  </td>
                  <td>
                    <span className="rent-value">${contrato.rentaMensual.toLocaleString()}</span>
                  </td>
                  <td>
                    <span className={`badge ${getEstadoClass(contrato.estado)}`}>
                      {getEstadoLabel(contrato.estado)}
                    </span>
                  </td>
                  <td>
                    <div className="document-actions">
                      {contrato.pdfUrl ? (
                        
                          href={contrato.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline btn-sm"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14,2 14,8 20,8" />
                          </svg>
                          Ver PDF
                        </a>
                      ) : (
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleUploadPdfForExisting(contrato.id)}
                          disabled={uploadingPdf}
                        >
                          {uploadingPdf ? 'Subiendo...' : '+ Añadir PDF'}
                        </button>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => handleOpenModal(contrato)}
                      >
                        Ver
                      </button>
                      <button
                        className="btn btn-outline btn-sm btn-danger-text"
                        onClick={() => handleDelete(contrato.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="table-pagination">
          <span className="pagination-info">
            {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, totalElements)} de {totalElements}
          </span>
          <div className="pagination-controls">
            <button
              className="pagination-btn"
              disabled={currentPage === 0}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              &lt;
            </button>
            {getPageNumbers().map((pageNum) => (
              <button
                key={pageNum}
                className={`pagination-btn ${pageNum === currentPage ? 'active' : ''}`}
                onClick={() => handlePageChange(pageNum)}
              >
                {pageNum + 1}
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
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingContrato ? 'Editar contrato' : 'Añadir contrato'}</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && (
                  <div className="alert alert-error" style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '8px', fontSize: '0.875rem' }}>
                    {error}
                  </div>
                )}

                {inquilinos.length === 0 && (
                  <div className="alert alert-warning" style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#fef3c7', color: '#92400e', borderRadius: '8px', fontSize: '0.875rem' }}>
                    No hay inquilinos registrados. Por favor, registre al menos un inquilino primero.
                  </div>
                )}
                {propiedades.length === 0 && (
                  <div className="alert alert-warning" style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#fef3c7', color: '#92400e', borderRadius: '8px', fontSize: '0.875rem' }}>
                    No hay propiedades registradas. Por favor, registre al menos una propiedad primero.
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="inquilinoId">Inquilino</label>
                    <select
                      id="inquilinoId"
                      name="inquilinoId"
                      value={formData.inquilinoId}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Seleccionar inquilino</option>
                      {inquilinos.map((inquilino) => (
                        <option key={inquilino.id} value={inquilino.id}>
                          {inquilino.nombre} {inquilino.apellido}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="propiedadId">Propiedad</label>
                    <select
                      id="propiedadId"
                      name="propiedadId"
                      value={formData.propiedadId}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Seleccionar propiedad</option>
                      {propiedades.map((propiedad) => (
                        <option key={propiedad.id} value={propiedad.id}>
                          {propiedad.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="fechaInicio">Fecha de inicio</label>
                    <input
                      type="date"
                      id="fechaInicio"
                      name="fechaInicio"
                      value={formData.fechaInicio}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="fechaFin">Fecha de fin</label>
                    <input
                      type="date"
                      id="fechaFin"
                      name="fechaFin"
                      value={formData.fechaFin}
                      onChange={handleInputChange}
                      required
                    />
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
                    <label htmlFor="estado">Estado del contrato</label>
                    <select
                      id="estado"
                      name="estado"
                      value={formData.estado || 'sin_firmar'}
                      onChange={handleInputChange}
                      required
                    >
                      {estadoOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="pdfUpload">Documento del contrato (PDF)</label>
                  <input
                    type="file"
                    id="pdfUpload"
                    name="pdfUpload"
                    accept=".pdf"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                  {selectedPdfFile && (
                    <div style={{ marginTop: '8px', fontSize: '0.875rem', color: '#059669' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: '4px' }}>
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      Archivo seleccionado: {selectedPdfFile.name}
                    </div>
                  )}
                  {editingContrato?.pdfUrl && !selectedPdfFile && (
                    <div style={{ marginTop: '8px', fontSize: '0.875rem', color: '#6b7280' }}>
                      <a href={editingContrato.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>
                        Ver documento actual
                      </a>
                    </div>
                  )}
                  <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    Tamaño máximo: 10MB. Solo archivos PDF.
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={uploadingPdf}>
                  {uploadingPdf ? 'Subiendo PDF...' : (editingContrato ? 'Guardar cambios' : 'Añadir contrato')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
