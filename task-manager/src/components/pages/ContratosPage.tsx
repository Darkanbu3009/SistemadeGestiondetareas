import { useState, useEffect, useCallback, useRef } from 'react';
import type { Contrato, ContratoFormData, Inquilino, Propiedad } from '../../types';
import {
  getContratos,
  createContrato,
  updateContrato,
  deleteContrato,
  getContratosCountByEstado,
  firmarContrato,
} from '../../services/contratosService';
import { getAllInquilinos } from '../../services/inquilinosService';
import { getAllPropiedades } from '../../services/propiedadService';
import { uploadFile } from '../../lib/supabase';

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
  pdfUrl: '',
};

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
  const [stats, setStats] = useState<ContratoStats>({
    activos: 0,
    porVencer: 0,
    finalizados: 0,
    sinFirmar: 0,
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;

  // File upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch stats from backend
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

  // Fetch contratos from backend
  const fetchContratos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getContratos(
        currentPage,
        pageSize,
        searchTerm || undefined,
        filterEstado || undefined
      );
      setContratos(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar contratos');
      console.error('Error fetching contratos:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterEstado]);

  // Fetch inquilinos and propiedades for the form dropdowns
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
    }
  }, []);

  useEffect(() => {
    fetchContratos();
    fetchStats();
    fetchDropdownData();
  }, [fetchContratos, fetchStats, fetchDropdownData]);

  const handleOpenModal = (contrato?: Contrato) => {
    if (contrato) {
      setEditingContrato(contrato);
      setFormData({
        inquilinoId: contrato.inquilinoId,
        propiedadId: contrato.propiedadId,
        fechaInicio: contrato.fechaInicio,
        fechaFin: contrato.fechaFin,
        rentaMensual: contrato.rentaMensual,
        pdfUrl: contrato.pdfUrl || '',
      });
    } else {
      setEditingContrato(null);
      setFormData(emptyFormData);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingContrato(null);
    setFormData(emptyFormData);
    setSelectedFile(null);
    setFormErrors({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setFormErrors((prev) => ({ ...prev, pdf: 'Solo se permiten archivos PDF' }));
        setSelectedFile(null);
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setFormErrors((prev) => ({ ...prev, pdf: 'El archivo no debe exceder 10MB' }));
        setSelectedFile(null);
        return;
      }
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.pdf;
        return newErrors;
      });
      setSelectedFile(file);
    }
  };

  // Validate form data
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.inquilinoId || formData.inquilinoId <= 0) {
      errors.inquilinoId = 'Debe seleccionar un inquilino';
    }
    if (!formData.propiedadId || formData.propiedadId <= 0) {
      errors.propiedadId = 'Debe seleccionar una propiedad';
    }
    if (!formData.fechaInicio) {
      errors.fechaInicio = 'La fecha de inicio es requerida';
    }
    if (!formData.fechaFin) {
      errors.fechaFin = 'La fecha de fin es requerida';
    }
    if (formData.fechaInicio && formData.fechaFin && formData.fechaInicio >= formData.fechaFin) {
      errors.fechaFin = 'La fecha de fin debe ser posterior a la fecha de inicio';
    }
    if (!formData.rentaMensual || formData.rentaMensual <= 0) {
      errors.rentaMensual = 'La renta mensual debe ser mayor a 0';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    try {
      setUploading(true);
      let submitData = { ...formData };

      // Upload file if selected
      if (selectedFile) {
        try {
          const pdfUrl = await uploadFile(selectedFile, 'contratos', 'pdfs');
          submitData = { ...submitData, pdfUrl };
        } catch (uploadErr) {
          console.error('Error uploading PDF:', uploadErr);
          // Continue without PDF if upload fails, but show warning
          setError('Advertencia: No se pudo subir el PDF, pero el contrato se guardara sin documento.');
        }
      }

      if (editingContrato) {
        await updateContrato(editingContrato.id, submitData);
      } else {
        await createContrato(submitData);
      }
      handleCloseModal();
      fetchContratos();
      fetchStats();
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al guardar contrato';
      console.error('Error saving contract:', err);
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Estas seguro de eliminar este contrato?')) {
      try {
        await deleteContrato(id);
        fetchContratos();
        fetchStats();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al eliminar contrato');
      }
    }
  };

  const handleFirmar = async (id: number) => {
    try {
      await firmarContrato(id);
      fetchContratos();
      fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al firmar contrato');
    }
  };

  const handleUploadPdf = async (contratoId: number) => {
    const pdfUrl = prompt('Ingrese la URL del PDF:');
    if (pdfUrl) {
      try {
        const contrato = contratos.find((c) => c.id === contratoId);
        if (contrato) {
          await updateContrato(contratoId, {
            inquilinoId: contrato.inquilinoId,
            propiedadId: contrato.propiedadId,
            fechaInicio: contrato.fechaInicio,
            fechaFin: contrato.fechaFin,
            rentaMensual: contrato.rentaMensual,
            pdfUrl,
          });
          fetchContratos();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al guardar PDF');
      }
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(0);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterEstado(e.target.value);
    setCurrentPage(0);
  };

  const getEstadoClass = (estado: string) => {
    switch (estado) {
      case 'activo':
        return 'badge-success';
      case 'por_vencer':
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
      default:
        return estado;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 4;
    let startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages);

    if (endPage - startPage < maxVisiblePages) {
      startPage = Math.max(0, endPage - maxVisiblePages);
    }

    for (let i = startPage; i < endPage; i++) {
      pages.push(
        <button
          key={i}
          className={`pagination-btn ${i === currentPage ? 'active' : ''}`}
          onClick={() => setCurrentPage(i)}
        >
          {i + 1}
        </button>
      );
    }

    return pages;
  };

  if (loading && contratos.length === 0) {
    return (
      <div className="contratos-page">
        <div className="loading-state">Cargando contratos...</div>
      </div>
    );
  }

  return (
    <div className="contratos-page">
      <div className="page-header">
        <h1 className="page-title">Contratos</h1>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <span>+</span> Anadir contrato
        </button>
      </div>

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)}>×</button>
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
            <span className="stat-label">Contratos proximos a vencer.</span>
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
            onChange={handleFilterChange}
          >
            <option value="">Todos</option>
            <option value="activo">Activo</option>
            <option value="por_vencer">Por vencer</option>
            <option value="finalizado">Finalizado</option>
            <option value="sin_firmar">Sin firmar</option>
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
              onChange={handleSearch}
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
            {contratos.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-state">
                  No hay contratos registrados
                </td>
              </tr>
            ) : (
              contratos.map((contrato) => (
                <tr key={contrato.id}>
                  <td>
                    <div className="tenant-cell">
                      <img
                        src={contrato.inquilino?.avatar || '/default-avatar.png'}
                        alt={contrato.inquilino?.nombre}
                        className="tenant-avatar"
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
                        <a
                          href={contrato.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline btn-sm"
                        >
                          Ver PDF
                        </a>
                      ) : (
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleUploadPdf(contrato.id)}
                        >
                          + Anadir PDF
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
                      {contrato.estado === 'sin_firmar' && (
                        <button
                          className="btn btn-outline btn-sm btn-success-text"
                          onClick={() => handleFirmar(contrato.id)}
                        >
                          Firmar
                        </button>
                      )}
                      <button
                        className="btn btn-outline btn-sm btn-danger-text"
                        onClick={() => handleDelete(contrato.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="table-pagination">
        <span className="pagination-info">
          {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, totalElements)} de {totalElements}
        </span>
        <div className="pagination-controls">
          <button
            className="pagination-btn"
            disabled={currentPage === 0}
            onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
          >
            &lt;
          </button>
          {renderPagination()}
          <button
            className="pagination-btn"
            disabled={currentPage >= totalPages - 1}
            onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
          >
            &gt;
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingContrato ? 'Editar contrato' : 'Anadir contrato'}</h2>
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
                    <label htmlFor="inquilinoId">Inquilino <span className="required">*</span></label>
                    <select
                      id="inquilinoId"
                      name="inquilinoId"
                      value={formData.inquilinoId || ''}
                      onChange={handleInputChange}
                      className={formErrors.inquilinoId ? 'input-error' : ''}
                    >
                      <option value="">Seleccionar inquilino</option>
                      {inquilinos.map((inquilino) => (
                        <option key={inquilino.id} value={inquilino.id}>
                          {inquilino.nombre} {inquilino.apellido}
                        </option>
                      ))}
                    </select>
                    {formErrors.inquilinoId && (
                      <span className="error-text">{formErrors.inquilinoId}</span>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="propiedadId">Propiedad <span className="required">*</span></label>
                    <select
                      id="propiedadId"
                      name="propiedadId"
                      value={formData.propiedadId || ''}
                      onChange={handleInputChange}
                      className={formErrors.propiedadId ? 'input-error' : ''}
                    >
                      <option value="">Seleccionar propiedad</option>
                      {propiedades.map((propiedad) => (
                        <option key={propiedad.id} value={propiedad.id}>
                          {propiedad.nombre}
                        </option>
                      ))}
                    </select>
                    {formErrors.propiedadId && (
                      <span className="error-text">{formErrors.propiedadId}</span>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="fechaInicio">Fecha de inicio <span className="required">*</span></label>
                    <input
                      type="date"
                      id="fechaInicio"
                      name="fechaInicio"
                      value={formData.fechaInicio}
                      onChange={handleInputChange}
                      className={formErrors.fechaInicio ? 'input-error' : ''}
                    />
                    {formErrors.fechaInicio && (
                      <span className="error-text">{formErrors.fechaInicio}</span>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="fechaFin">Fecha de fin <span className="required">*</span></label>
                    <input
                      type="date"
                      id="fechaFin"
                      name="fechaFin"
                      value={formData.fechaFin}
                      onChange={handleInputChange}
                      className={formErrors.fechaFin ? 'input-error' : ''}
                    />
                    {formErrors.fechaFin && (
                      <span className="error-text">{formErrors.fechaFin}</span>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="rentaMensual">Renta mensual ($) <span className="required">*</span></label>
                  <input
                    type="number"
                    id="rentaMensual"
                    name="rentaMensual"
                    value={formData.rentaMensual}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className={formErrors.rentaMensual ? 'input-error' : ''}
                  />
                  {formErrors.rentaMensual && (
                    <span className="error-text">{formErrors.rentaMensual}</span>
                  )}
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
                    className={formErrors.pdf ? 'input-error' : ''}
                  />
                  {selectedFile && (
                    <span className="file-selected">Archivo seleccionado: {selectedFile.name}</span>
                  )}
                  {formErrors.pdf && (
                    <span className="error-text">{formErrors.pdf}</span>
                  )}
                  {editingContrato?.pdfUrl && !selectedFile && (
                    <span className="file-existing">
                      PDF actual: <a href={editingContrato.pdfUrl} target="_blank" rel="noopener noreferrer">Ver documento</a>
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="pdfUrl">O ingrese URL del PDF</label>
                  <input
                    type="url"
                    id="pdfUrl"
                    name="pdfUrl"
                    value={formData.pdfUrl || ''}
                    onChange={handleInputChange}
                    placeholder="https://ejemplo.com/documento.pdf"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal} disabled={uploading}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  {uploading ? 'Guardando...' : (editingContrato ? 'Guardar cambios' : 'Anadir contrato')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
