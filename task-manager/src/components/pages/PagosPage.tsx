import { useState, useEffect } from 'react';
import type { Pago, PagoFormData, Inquilino, Propiedad } from '../../types';
import * as pagosService from '../../services/pagosService';
import { getAllInquilinos } from '../../services/inquilinosService';
import { getAllPropiedades } from '../../services/propiedadService';

interface PagosStats {
  ingresosMes: number;
  ingresosVariacion: number;
  rentasPendientes: number;
  morosos: number;
}

const emptyFormData: PagoFormData = {
  inquilinoId: 0,
  propiedadId: 0,
  monto: 0,
  fechaPago: new Date().toISOString().split('T')[0],
  comprobante: '',
};

export function PagosPage() {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [inquilinos, setInquilinos] = useState<Inquilino[]>([]);
  const [propiedades, setPropiedades] = useState<Propiedad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedPago, setSelectedPago] = useState<Pago | null>(null);
  const [formData, setFormData] = useState<PagoFormData>(emptyFormData);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${months[now.getMonth()]} ${now.getFullYear()}`;
  });
  const [stats, setStats] = useState<PagosStats>({
    ingresosMes: 0,
    ingresosVariacion: 0,
    rentasPendientes: 0,
    morosos: 0,
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;

  // Load data on mount
  useEffect(() => {
    loadData();
    loadInquilinos();
    loadPropiedades();
    loadStats();
  }, []);

  // Reload pagos when search/filter changes
  useEffect(() => {
    loadPagos();
  }, [searchTerm, filterEstado, currentPage]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      await loadPagos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const loadPagos = async () => {
    try {
      const response = await pagosService.getPagos(
        currentPage,
        pageSize,
        searchTerm || undefined,
        filterEstado || undefined
      );
      setPagos(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err) {
      console.error('Error loading pagos:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los pagos');
    }
  };

  const loadInquilinos = async () => {
    try {
      const data = await getAllInquilinos();
      setInquilinos(data);
    } catch (err) {
      console.error('Error loading inquilinos:', err);
    }
  };

  const loadPropiedades = async () => {
    try {
      const data = await getAllPropiedades();
      setPropiedades(data);
    } catch (err) {
      console.error('Error loading propiedades:', err);
    }
  };

  const loadStats = async () => {
    try {
      const [ingresosData, morososCount] = await Promise.all([
        pagosService.getIngresosMes(),
        pagosService.getMorososCount(),
      ]);

      setStats({
        ingresosMes: ingresosData.ingresosMes || 0,
        ingresosVariacion: 0, // TODO: Calculate variation when historical data is available
        rentasPendientes: ingresosData.rentasPendientes || 0,
        morosos: morososCount,
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleOpenModal = (pago?: Pago) => {
    if (pago) {
      setSelectedPago(pago);
      setFormData({
        inquilinoId: pago.inquilinoId || pago.inquilino?.id || 0,
        propiedadId: pago.propiedadId || pago.propiedad?.id || 0,
        monto: pago.monto,
        fechaPago: new Date().toISOString().split('T')[0],
        comprobante: '',
      });
    } else {
      setSelectedPago(null);
      setFormData(emptyFormData);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPago(null);
    setFormData(emptyFormData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ['inquilinoId', 'propiedadId', 'monto'].includes(name)
        ? parseFloat(value) || 0
        : value,
    }));

    // Auto-fill monto when selecting inquilino based on their propiedad
    if (name === 'inquilinoId' && value) {
      const inquilino = inquilinos.find((i) => i.id === parseInt(value));
      if (inquilino?.propiedadId) {
        const propiedad = propiedades.find((p) => p.id === inquilino.propiedadId);
        if (propiedad) {
          setFormData((prev) => ({
            ...prev,
            inquilinoId: parseInt(value),
            propiedadId: propiedad.id,
            monto: propiedad.rentaMensual,
          }));
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (selectedPago) {
        // Register payment for existing pago
        await pagosService.registrarPago(selectedPago.id, {
          fechaPago: formData.fechaPago,
          comprobante: formData.comprobante || undefined,
        });
      } else {
        // Create new payment record
        await pagosService.createPago({
          inquilinoId: formData.inquilinoId,
          propiedadId: formData.propiedadId,
          monto: formData.monto,
          fechaVencimiento: formData.fechaPago,
          fechaPago: formData.fechaPago,
          comprobante: formData.comprobante || undefined,
        });
      }

      handleCloseModal();
      loadPagos();
      loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el pago');
    }
  };

  const filteredPagos = pagos.filter((p) => {
    const matchesSearch =
      `${p.inquilino?.nombre || ''} ${p.inquilino?.apellido || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.propiedad?.nombre || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = !filterEstado || p.estado === filterEstado;
    return matchesSearch && matchesFilter;
  });

  const getEstadoClass = (estado: string) => {
    switch (estado) {
      case 'pagado':
        return 'badge-success';
      case 'pendiente':
        return 'badge-warning';
      case 'atrasado':
        return 'badge-danger';
      default:
        return '';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="pagos-page">
        <div className="loading-container">
          <p>Cargando pagos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pagos-page">
      <div className="page-header">
        <h1 className="page-title">Pagos</h1>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <span>+</span> Registrar pago
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Cerrar</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid stats-4">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Ingresos del mes</span>
          </div>
          <div className="stat-content">
            <span className="stat-value">${stats.ingresosMes.toLocaleString()}</span>
            {stats.ingresosVariacion > 0 && (
              <span className="stat-change positive">+{stats.ingresosVariacion}%</span>
            )}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Rentas pendientes</span>
            <span className="stat-icon pending">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12,6 12,12 16,14" />
              </svg>
            </span>
          </div>
          <div className="stat-content">
            <span className="stat-value">${stats.rentasPendientes.toLocaleString()}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Morosos</span>
            {stats.morosos > 0 && <span className="morosos-badge">{stats.morosos}</span>}
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.morosos}</span>
          </div>
        </div>

        <div className="stat-card month-selector">
          <select
            className="month-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="Enero 2026">Enero 2026</option>
            <option value="Diciembre 2025">Diciembre 2025</option>
            <option value="Noviembre 2025">Noviembre 2025</option>
            <option value="Octubre 2025">Octubre 2025</option>
          </select>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="table-toolbar">
        <div className="toolbar-left">
          <select
            className="filter-select"
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="pagado">Pagado</option>
            <option value="pendiente">Pendiente</option>
            <option value="atrasado">Atrasado</option>
          </select>
          <div className="search-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Buscar pago..."
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
        <table className="data-table">
          <thead>
            <tr>
              <th>Inquilino</th>
              <th>Propiedad</th>
              <th>Estado</th>
              <th>Monto</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredPagos.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                  No hay pagos registrados
                </td>
              </tr>
            ) : (
              filteredPagos.map((pago) => (
                <tr key={pago.id}>
                  <td>
                    <div className="tenant-cell">
                      <img
                        src={pago.inquilino?.avatar || '/default-avatar.png'}
                        alt={pago.inquilino?.nombre}
                        className="tenant-avatar"
                      />
                      <div className="tenant-info">
                        <span className="tenant-name">
                          {pago.inquilino?.nombre} {pago.inquilino?.apellido}
                        </span>
                        <span className="tenant-subtitle">
                          {pago.inquilino?.nombre} {pago.inquilino?.apellido}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="property-info-cell">
                      <span className="property-name-text">{pago.propiedad?.nombre}</span>
                      <span className="property-address-text">
                        {pago.propiedad?.direccion}, {pago.propiedad?.ciudad}, {pago.propiedad?.pais}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${getEstadoClass(pago.estado)}`}>
                      {pago.estado === 'pagado' ? 'Pagado' :
                       pago.estado === 'pendiente' ? 'Pendiente' : 'Atrasado'}
                    </span>
                  </td>
                  <td>
                    <span className="amount-value">${pago.monto.toLocaleString()}</span>
                    {pago.diasAtrasado && pago.diasAtrasado > 0 && pago.estado !== 'pagado' && (
                      <span className="days-late-text">{pago.diasAtrasado} dias atrasada</span>
                    )}
                  </td>
                  <td>
                    <span className="date-text">
                      {formatDate(pago.fechaPago || pago.fechaVencimiento)}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {pago.estado === 'pagado' ? (
                        <>
                          <button className="btn btn-outline btn-sm">
                            Ver
                          </button>
                          {pago.comprobante && (
                            <button className="btn btn-outline btn-sm">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21,15 16,10 5,21" />
                              </svg>
                              Ver
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          className="btn btn-outline btn-sm btn-register"
                          onClick={() => handleOpenModal(pago)}
                        >
                          Registrar pago
                        </button>
                      )}
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
          {Array.from({ length: Math.min(totalPages, 4) }, (_, i) => (
            <button
              key={i}
              className={`pagination-btn ${currentPage === i ? 'active' : ''}`}
              onClick={() => setCurrentPage(i)}
            >
              {i + 1}
            </button>
          ))}
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
              <h2>{selectedPago ? 'Registrar pago' : 'Nuevo pago'}</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {selectedPago && (
                  <div className="pago-info-summary">
                    <div className="summary-item">
                      <span className="summary-label">Inquilino:</span>
                      <span className="summary-value">
                        {selectedPago.inquilino?.nombre} {selectedPago.inquilino?.apellido}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Propiedad:</span>
                      <span className="summary-value">{selectedPago.propiedad?.nombre}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Monto a pagar:</span>
                      <span className="summary-value">${selectedPago.monto.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {!selectedPago && (
                  <>
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
                            {propiedad.nombre} - ${propiedad.rentaMensual}/mes
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="monto">Monto ($)</label>
                      <input
                        type="number"
                        id="monto"
                        name="monto"
                        value={formData.monto}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label htmlFor="fechaPago">Fecha de pago</label>
                  <input
                    type="date"
                    id="fechaPago"
                    name="fechaPago"
                    value={formData.fechaPago}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="comprobante">Comprobante (opcional)</label>
                  <input
                    type="file"
                    id="comprobante"
                    name="comprobante"
                    accept="image/*,.pdf"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Registrar pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
