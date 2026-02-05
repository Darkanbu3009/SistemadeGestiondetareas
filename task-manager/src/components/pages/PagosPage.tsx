import { useState, useEffect, useCallback } from 'react';
import type { Pago, PagoFormData, Inquilino, Propiedad } from '../../types';
import * as pagosService from '../../services/pagosService';
import { getAllInquilinos } from '../../services/inquilinosService';
import { getAllPropiedades } from '../../services/propiedadService';

interface PagosStats {
  ingresosMes: number;
  rentasPendientes: number;
  morosos: number;
}

interface PagoCreateData {
  inquilinoId: number;
  propiedadId: number;
  monto: number;
  fechaVencimiento: string;
  fechaPago?: string;
  comprobante?: string;
  estado?: string;
}

const emptyFormData: PagoFormData = {
  inquilinoId: 0,
  propiedadId: 0,
  monto: 0,
  fechaPago: new Date().toISOString().split('T')[0],
  comprobante: '',
  estado: 'pagado',
};

export function PagosPage() {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [allPagos, setAllPagos] = useState<Pago[]>([]); // All pagos for client-side filtering
  const [inquilinos, setInquilinos] = useState<Inquilino[]>([]);
  const [propiedades, setPropiedades] = useState<Propiedad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'register'>('create');
  const [selectedPago, setSelectedPago] = useState<Pago | null>(null);
  const [formData, setFormData] = useState<PagoFormData>(emptyFormData);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('');
  
  // View mode
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  
  // Month selector
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return now.getMonth() + 1; // 1-12
  });
  const [selectedYear, setSelectedYear] = useState(() => {
    const now = new Date();
    return now.getFullYear();
  });
  
  // Stats
  const [stats, setStats] = useState<PagosStats>({
    ingresosMes: 0,
    rentasPendientes: 0,
    morosos: 0,
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  // Load all pagos
  const loadAllPagos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await pagosService.getAllPagos();
      setAllPagos(data);
    } catch (err) {
      console.error('Error loading pagos:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los pagos');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load inquilinos
  const loadInquilinos = useCallback(async () => {
    try {
      const data = await getAllInquilinos();
      setInquilinos(data);
    } catch (err) {
      console.error('Error loading inquilinos:', err);
    }
  }, []);

  // Load propiedades
  const loadPropiedades = useCallback(async () => {
    try {
      const data = await getAllPropiedades();
      setPropiedades(data);
    } catch (err) {
      console.error('Error loading propiedades:', err);
    }
  }, []);

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      const [ingresosData, morososCount] = await Promise.all([
        pagosService.getIngresosMes(selectedMonth, selectedYear),
        pagosService.getMorososCount(),
      ]);

      setStats({
        ingresosMes: ingresosData.ingresosMes || 0,
        rentasPendientes: ingresosData.rentasPendientes || 0,
        morosos: morososCount || 0,
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }, [selectedMonth, selectedYear]);

  // Initial load
  useEffect(() => {
    loadAllPagos();
    loadInquilinos();
    loadPropiedades();
  }, [loadAllPagos, loadInquilinos, loadPropiedades]);

  // Load stats when month changes
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Filter pagos based on search, estado, and month/year
  useEffect(() => {
    let filtered = [...allPagos];

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter((pago) => {
        const inquilinoName = `${pago.inquilino?.nombre || ''} ${pago.inquilino?.apellido || ''}`.toLowerCase();
        const propiedadName = (pago.propiedad?.nombre || '').toLowerCase();
        return inquilinoName.includes(search) || propiedadName.includes(search);
      });
    }

    // Filter by estado
    if (filterEstado) {
      filtered = filtered.filter((pago) => pago.estado === filterEstado);
    }

    // Filter by month and year
    filtered = filtered.filter((pago) => {
      const fechaPago = pago.fechaPago ? new Date(pago.fechaPago) : null;
      const fechaVencimiento = pago.fechaVencimiento ? new Date(pago.fechaVencimiento) : null;
      const fecha = fechaPago || fechaVencimiento;
      
      if (!fecha) return false;
      
      const pagoMonth = fecha.getMonth() + 1;
      const pagoYear = fecha.getFullYear();
      
      return pagoMonth === selectedMonth && pagoYear === selectedYear;
    });

    setPagos(filtered);
    setCurrentPage(0);
  }, [allPagos, searchTerm, filterEstado, selectedMonth, selectedYear]);

  // Calculate stats from filtered data
  useEffect(() => {
    // Calculate stats based on filtered pagos for the selected month
    const filteredByMonth = allPagos.filter((pago) => {
      const fechaPago = pago.fechaPago ? new Date(pago.fechaPago) : null;
      const fechaVencimiento = pago.fechaVencimiento ? new Date(pago.fechaVencimiento) : null;
      const fecha = fechaPago || fechaVencimiento;
      
      if (!fecha) return false;
      
      const pagoMonth = fecha.getMonth() + 1;
      const pagoYear = fecha.getFullYear();
      
      return pagoMonth === selectedMonth && pagoYear === selectedYear;
    });

    const ingresosMes = filteredByMonth
      .filter((p) => p.estado === 'pagado')
      .reduce((sum, p) => sum + (p.monto || 0), 0);

    const rentasPendientes = allPagos
      .filter((p) => p.estado === 'pendiente' || p.estado === 'atrasado')
      .reduce((sum, p) => sum + (p.monto || 0), 0);

    const morosos = allPagos.filter((p) => p.estado === 'atrasado').length;

    setStats({
      ingresosMes,
      rentasPendientes,
      morosos,
    });
  }, [allPagos, selectedMonth, selectedYear]);

  // Get paginated data
  const paginatedPagos = pagos.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const totalPages = Math.ceil(pagos.length / pageSize);
  const totalElements = pagos.length;

  // Open modal for creating new pago
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setSelectedPago(null);
    setFormData({
      ...emptyFormData,
      fechaPago: new Date().toISOString().split('T')[0],
      estado: 'pagado',
    });
    setError(null);
    setShowModal(true);
  };

  // Open modal for editing pago
  const handleOpenEditModal = (pago: Pago) => {
    setModalMode('edit');
    setSelectedPago(pago);
    setFormData({
      inquilinoId: pago.inquilino?.id || 0,
      propiedadId: pago.propiedad?.id || 0,
      monto: pago.monto,
      fechaPago: pago.fechaVencimiento || new Date().toISOString().split('T')[0],
      comprobante: pago.comprobante || '',
      estado: pago.estado || 'pendiente',
    });
    setError(null);
    setShowModal(true);
  };

  // Open modal for registering payment
  const handleOpenRegisterModal = (pago: Pago) => {
    setModalMode('register');
    setSelectedPago(pago);
    setFormData({
      inquilinoId: pago.inquilino?.id || 0,
      propiedadId: pago.propiedad?.id || 0,
      monto: pago.monto,
      fechaPago: new Date().toISOString().split('T')[0],
      comprobante: '',
      estado: 'pagado',
    });
    setError(null);
    setShowModal(true);
  };

  // Open view modal
  const handleOpenViewModal = (pago: Pago) => {
    setSelectedPago(pago);
    setShowViewModal(true);
  };

  // Close modals
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPago(null);
    setFormData(emptyFormData);
    setError(null);
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setSelectedPago(null);
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ['inquilinoId', 'propiedadId', 'monto'].includes(name)
        ? parseFloat(value) || 0
        : value,
    }));

    // Auto-fill monto and propiedad when selecting inquilino
    if (name === 'inquilinoId' && value) {
      const inquilino = inquilinos.find((i) => i.id === parseInt(value));
      if (inquilino?.propiedad) {
        const propiedad = inquilino.propiedad;
        setFormData((prev) => ({
          ...prev,
          inquilinoId: parseInt(value),
          propiedadId: propiedad.id,
          monto: propiedad.rentaMensual,
        }));
      }
    }
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (modalMode === 'register' && selectedPago) {
        // Register payment with estado
        if (formData.estado === 'pagado') {
          await pagosService.registrarPago(selectedPago.id, {
            fechaPago: formData.fechaPago,
            comprobante: formData.comprobante || undefined,
          });
        } else {
          // Si el estado no es pagado, usar update para cambiar solo el estado
          await pagosService.updatePago(selectedPago.id, {
            inquilinoId: selectedPago.inquilino?.id || 0,
            propiedadId: selectedPago.propiedad?.id || 0,
            monto: selectedPago.monto,
            fechaVencimiento: selectedPago.fechaVencimiento || formData.fechaPago,
            comprobante: formData.comprobante || undefined,
            estado: formData.estado,
          });
        }
      } else if (modalMode === 'edit' && selectedPago) {
        await pagosService.updatePago(selectedPago.id, {
          inquilinoId: formData.inquilinoId,
          propiedadId: formData.propiedadId,
          monto: formData.monto,
          fechaVencimiento: formData.fechaPago,
          comprobante: formData.comprobante || undefined,
          estado: formData.estado,
        });
      } else {
        // Create new pago
        const createData: PagoCreateData = {
          inquilinoId: formData.inquilinoId,
          propiedadId: formData.propiedadId,
          monto: formData.monto,
          fechaVencimiento: formData.fechaPago,
          fechaPago: formData.estado === 'pagado' ? formData.fechaPago : undefined,
          comprobante: formData.comprobante || undefined,
          estado: formData.estado,
        };
        await pagosService.createPago(createData);
      }

      handleCloseModal();
      loadAllPagos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el pago');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este pago?')) return;

    try {
      await pagosService.deletePago(id);
      loadAllPagos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el pago');
    }
  };

  // Get estado badge class
  const getEstadoClass = (estado: string) => {
    switch (estado) {
      case 'pagado':
        return 'badge-success';
      case 'pendiente':
        return 'badge-warning';
      case 'atrasado':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  };

  // Get estado label
  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'pagado':
        return 'Pagado';
      case 'pendiente':
        return 'Pendiente';
      case 'atrasado':
        return 'Atrasado';
      default:
        return estado;
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Generate month options
  const getMonthOptions = () => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const options = [];
    const currentYear = new Date().getFullYear();
    
    for (let year = currentYear; year >= currentYear - 2; year--) {
      for (let month = 12; month >= 1; month--) {
        if (year === currentYear && month > new Date().getMonth() + 1) continue;
        options.push({
          value: `${month}-${year}`,
          label: `${months[month - 1]} ${year}`,
          month,
          year,
        });
      }
    }
    return options;
  };

  // Handle month change
  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [month, year] = e.target.value.split('-').map(Number);
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  // Get page numbers
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

  // Tenant Avatar Component
  const TenantAvatar = ({ src, alt, size = 40 }: { src?: string; alt: string; size?: number }) => {
    const [imageError, setImageError] = useState(false);

    const isValidUrl = (url?: string): boolean => {
      if (!url || url.trim() === '') return false;
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    };

    if (!src || !isValidUrl(src) || imageError) {
      return (
        <div
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
            color: '#9ca3af',
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
      <img
        src={src}
        alt={alt}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
        }}
        onError={() => setImageError(true)}
      />
    );
  };

  return (
    <div className="pagos-page">
      <div className="page-header">
        <h1 className="page-title">Pagos</h1>
        <button className="btn btn-primary" onClick={handleOpenCreateModal}>
          <span>+</span> Registrar pago
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '1rem',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid stats-4">
        {/* Ingresos del mes */}
        <div className="stat-card stat-card-bordered">
          <div className="stat-header">
            <span className="stat-label">Ingresos del mes</span>
            <span className="stat-icon" style={{ color: '#10b981' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </span>
          </div>
          <div className="stat-content">
            <span className="stat-value">${stats.ingresosMes.toLocaleString()}</span>
          </div>
        </div>

        {/* Rentas pendientes */}
        <div className="stat-card stat-card-bordered stat-card-warning">
          <div className="stat-header">
            <span className="stat-label">Rentas pendientes</span>
            <span className="stat-icon" style={{ color: '#3b82f6' }}>
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

        {/* Morosos */}
        <div className="stat-card stat-card-bordered">
          <div className="stat-header">
            <span className="stat-label">Morosos</span>
            <span className="stat-icon" style={{ color: '#ef4444' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </span>
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.morosos}</span>
          </div>
        </div>

        {/* Month Selector */}
        <div className="stat-card stat-card-bordered">
          <div className="stat-header">
            <select
              className="month-select"
              value={`${selectedMonth}-${selectedYear}`}
              onChange={handleMonthChange}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: 'white',
                cursor: 'pointer',
              }}
            >
              {getMonthOptions().map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
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
          <button 
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Vista de cuadrícula"
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
            title="Vista de lista"
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

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando pagos...</div>
      ) : paginatedPagos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>No hay pagos para el período seleccionado</p>
          <button className="btn btn-primary" onClick={handleOpenCreateModal} style={{ marginTop: '1rem' }}>
            Registrar primer pago
          </button>
        </div>
      ) : viewMode === 'list' ? (
        /* Table View */
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Inquilino</th>
                <th>Propiedad</th>
                <th>Estado</th>
                <th>Monto</th>
                <th>Fecha Vencimiento</th>
                <th>Fecha Pago</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPagos.map((pago) => (
                <tr key={pago.id}>
                  <td>
                    <div className="tenant-cell" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <TenantAvatar
                        src={pago.inquilino?.avatar}
                        alt={`${pago.inquilino?.nombre} ${pago.inquilino?.apellido}`}
                        size={40}
                      />
                      <div className="tenant-info">
                        <span className="tenant-name" style={{ fontWeight: '500', display: 'block' }}>
                          {pago.inquilino?.nombre} {pago.inquilino?.apellido}
                        </span>
                        <span className="tenant-subtitle" style={{ fontSize: '13px', color: '#6b7280' }}>
                          {pago.inquilino?.email}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="property-info-cell">
                      <span className="property-name-text" style={{ fontWeight: '500', display: 'block' }}>
                        {pago.propiedad?.nombre}
                      </span>
                      <span className="property-address-text" style={{ fontSize: '13px', color: '#6b7280' }}>
                        {pago.propiedad?.direccion}, {pago.propiedad?.ciudad}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${getEstadoClass(pago.estado)}`}>
                      {getEstadoLabel(pago.estado)}
                    </span>
                    {pago.estado === 'atrasado' && pago.diasAtrasado && pago.diasAtrasado > 0 && (
                      <span style={{ display: 'block', fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
                        {pago.diasAtrasado} días atrasado
                      </span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontWeight: '600' }}>${pago.monto.toLocaleString()}</span>
                  </td>
                  <td>
                    <span>{formatDate(pago.fechaVencimiento)}</span>
                  </td>
                  <td>
                    <span>{pago.fechaPago ? formatDate(pago.fechaPago) : '-'}</span>
                  </td>
                  <td>
                    <div className="action-buttons" style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => handleOpenViewModal(pago)}
                        title="Ver detalles"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        Ver
                      </button>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => handleOpenEditModal(pago)}
                        title="Editar pago"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Editar
                      </button>
                      {pago.estado !== 'pagado' && (
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleOpenRegisterModal(pago)}
                          style={{ color: '#10b981', borderColor: '#10b981' }}
                          title="Registrar pago"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                          </svg>
                          Pagar
                        </button>
                      )}
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => handleDelete(pago.id)}
                        style={{ color: '#dc2626', borderColor: '#dc2626' }}
                        title="Eliminar"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
      ) : (
        /* Grid View */
        <div 
          className="pagos-grid" 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
            gap: '1rem',
            marginTop: '1rem'
          }}
        >
          {paginatedPagos.map((pago) => (
            <div 
              key={pago.id} 
              className="pago-card"
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                padding: '1.25rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <TenantAvatar
                    src={pago.inquilino?.avatar}
                    alt={`${pago.inquilino?.nombre} ${pago.inquilino?.apellido}`}
                    size={48}
                  />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>
                      {pago.inquilino?.nombre} {pago.inquilino?.apellido}
                    </h4>
                    <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#6b7280' }}>
                      {pago.propiedad?.nombre}
                    </p>
                  </div>
                </div>
                <span className={`badge ${getEstadoClass(pago.estado)}`}>
                  {getEstadoLabel(pago.estado)}
                </span>
              </div>

              {/* Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1rem' }}>
                <div>
                  <span style={{ fontSize: '12px', color: '#6b7280', display: 'block' }}>Monto</span>
                  <span style={{ fontSize: '18px', fontWeight: '600', color: '#10b981' }}>
                    ${pago.monto.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#6b7280', display: 'block' }}>Vencimiento</span>
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>
                    {formatDate(pago.fechaVencimiento)}
                  </span>
                </div>
              </div>

              {pago.fechaPago && (
                <div style={{ marginBottom: '1rem' }}>
                  <span style={{ fontSize: '12px', color: '#6b7280', display: 'block' }}>Fecha de Pago</span>
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>
                    {formatDate(pago.fechaPago)}
                  </span>
                </div>
              )}

              {pago.estado === 'atrasado' && pago.diasAtrasado && pago.diasAtrasado > 0 && (
                <div style={{ 
                  padding: '8px 12px', 
                  backgroundColor: '#fef2f2', 
                  borderRadius: '6px', 
                  marginBottom: '1rem',
                  fontSize: '13px',
                  color: '#dc2626'
                }}>
                  ⚠️ {pago.diasAtrasado} días de atraso
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => handleOpenViewModal(pago)}
                  style={{ flex: 1 }}
                >
                  Ver
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => handleOpenEditModal(pago)}
                  style={{ flex: 1 }}
                >
                  Editar
                </button>
                {pago.estado !== 'pagado' && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleOpenRegisterModal(pago)}
                    style={{ flex: 1 }}
                  >
                    Pagar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="table-pagination">
          <span className="pagination-info">
            {totalElements > 0 ? `${currentPage * pageSize + 1}-${Math.min((currentPage + 1) * pageSize, totalElements)} de ${totalElements}` : '0 resultados'}
          </span>
          <div className="pagination-controls">
            <button
              className="pagination-btn"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
            >
              &lt;
            </button>
            {getPageNumbers().map((pageNum) => (
              <button
                key={pageNum}
                className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum + 1}
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
      )}

      {/* View Modal */}
      {showViewModal && selectedPago && (
        <div className="modal-overlay" onClick={handleCloseViewModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detalles del Pago</h2>
              <button className="modal-close" onClick={handleCloseViewModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
                  <TenantAvatar
                    src={selectedPago.inquilino?.avatar}
                    alt={`${selectedPago.inquilino?.nombre} ${selectedPago.inquilino?.apellido}`}
                    size={60}
                  />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px' }}>
                      {selectedPago.inquilino?.nombre} {selectedPago.inquilino?.apellido}
                    </h3>
                    <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '14px' }}>
                      {selectedPago.inquilino?.email}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Propiedad</label>
                    <p style={{ margin: '4px 0 0', fontWeight: '500' }}>{selectedPago.propiedad?.nombre}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#6b7280' }}>
                      {selectedPago.propiedad?.direccion}
                    </p>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Estado</label>
                    <p style={{ margin: '4px 0 0' }}>
                      <span className={`badge ${getEstadoClass(selectedPago.estado)}`}>
                        {getEstadoLabel(selectedPago.estado)}
                      </span>
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Monto</label>
                    <p style={{ margin: '4px 0 0', fontWeight: '600', fontSize: '20px', color: '#10b981' }}>
                      ${selectedPago.monto.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Fecha Vencimiento</label>
                    <p style={{ margin: '4px 0 0', fontWeight: '500' }}>{formatDate(selectedPago.fechaVencimiento)}</p>
                  </div>
                </div>

                {selectedPago.fechaPago && (
                  <div>
                    <label style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Fecha de Pago</label>
                    <p style={{ margin: '4px 0 0', fontWeight: '500' }}>{formatDate(selectedPago.fechaPago)}</p>
                  </div>
                )}

                {selectedPago.comprobante && (
                  <div>
                    <label style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Comprobante</label>
                    <p style={{ margin: '4px 0 0' }}>
                      <a href={selectedPago.comprobante} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>
                        Ver comprobante
                      </a>
                    </p>
                  </div>
                )}

                {selectedPago.estado === 'atrasado' && selectedPago.diasAtrasado && selectedPago.diasAtrasado > 0 && (
                  <div style={{ padding: '12px', backgroundColor: '#fef2f2', borderRadius: '8px' }}>
                    <p style={{ margin: 0, color: '#dc2626', fontWeight: '500' }}>
                      ⚠️ Este pago tiene {selectedPago.diasAtrasado} días de atraso
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={handleCloseViewModal}>
                Cerrar
              </button>
              {selectedPago.estado !== 'pagado' && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    handleCloseViewModal();
                    handleOpenRegisterModal(selectedPago);
                  }}
                >
                  Registrar Pago
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit/Register Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {modalMode === 'register'
                  ? 'Registrar Pago'
                  : modalMode === 'edit'
                  ? 'Editar Pago'
                  : 'Nuevo Pago'}
              </h2>
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
                  <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '8px', fontSize: '0.875rem' }}>
                    {error}
                  </div>
                )}

                {/* Summary for register mode */}
                {modalMode === 'register' && selectedPago && (
                  <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7280' }}>Inquilino:</span>
                        <span style={{ fontWeight: '500' }}>
                          {selectedPago.inquilino?.nombre} {selectedPago.inquilino?.apellido}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7280' }}>Propiedad:</span>
                        <span style={{ fontWeight: '500' }}>{selectedPago.propiedad?.nombre}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7280' }}>Monto a pagar:</span>
                        <span style={{ fontWeight: '600', color: '#10b981', fontSize: '18px' }}>
                          ${selectedPago.monto.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Full form for create/edit mode */}
                {(modalMode === 'create' || modalMode === 'edit') && (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="inquilinoId">Inquilino</label>
                        <select
                          id="inquilinoId"
                          name="inquilinoId"
                          value={formData.inquilinoId}
                          onChange={handleInputChange}
                          required
                          disabled={modalMode === 'edit'}
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
                          disabled={modalMode === 'edit'}
                        >
                          <option value="">Seleccionar propiedad</option>
                          {propiedades.map((propiedad) => (
                            <option key={propiedad.id} value={propiedad.id}>
                              {propiedad.nombre} - ${propiedad.rentaMensual?.toLocaleString()}/mes
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
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
                      <div className="form-group">
                        <label htmlFor="fechaPago">
                          {modalMode === 'edit' ? 'Fecha de Vencimiento' : 'Fecha de Pago'}
                        </label>
                        <input
                          type="date"
                          id="fechaPago"
                          name="fechaPago"
                          value={formData.fechaPago}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    {/* Estado del Pago - Ahora disponible en CREATE y EDIT */}
                    <div className="form-group">
                      <label htmlFor="estado">Estado del Pago</label>
                      <select
                        id="estado"
                        name="estado"
                        value={formData.estado || 'pendiente'}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="pagado">Pagado</option>
                        <option value="pendiente">Pendiente</option>
                        <option value="atrasado">Atrasado / No Pagado</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Date and estado for register mode */}
                {modalMode === 'register' && (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="fechaPago">Fecha de Pago</label>
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
                        <label htmlFor="estado">Estado del Pago</label>
                        <select
                          id="estado"
                          name="estado"
                          value={formData.estado || 'pagado'}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="pagado">Pagado</option>
                          <option value="pendiente">Pendiente</option>
                          <option value="atrasado">Atrasado / No Pagado</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label htmlFor="comprobante">URL del Comprobante (opcional)</label>
                  <input
                    type="text"
                    id="comprobante"
                    name="comprobante"
                    value={formData.comprobante}
                    onChange={handleInputChange}
                    placeholder="https://ejemplo.com/comprobante.pdf"
                  />
                  <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    Ingresa una URL al comprobante de pago (imagen o PDF)
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal} disabled={submitting}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Guardando...' : modalMode === 'register' ? 'Registrar Pago' : modalMode === 'edit' ? 'Guardar Cambios' : 'Crear Pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
