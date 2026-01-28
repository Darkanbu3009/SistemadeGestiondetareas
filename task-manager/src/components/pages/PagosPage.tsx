import { useState } from 'react';
import type { Pago, PagoFormData } from '../../types';

// Mock data
const mockPagos: Pago[] = [
  {
    id: 1,
    inquilinoId: 4,
    inquilino: {
      id: 4,
      nombre: 'Martin',
      apellido: 'Ruiz',
      email: 'martin@email.com',
      telefono: '+1 787 234 5678',
      documento: '11223344',
      avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
      createdAt: '',
      updatedAt: '',
    },
    propiedadId: 4,
    propiedad: {
      id: 4,
      nombre: 'PH Villa Colonial',
      direccion: 'Avenida, Ponce de 123',
      ciudad: 'San Juan',
      pais: 'PR',
      tipo: 'casa',
      rentaMensual: 450,
      estado: 'ocupada',
      createdAt: '',
      updatedAt: '',
    },
    monto: 450,
    estado: 'atrasado',
    fechaVencimiento: '2024-04-20',
    diasAtrasado: 5,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 2,
    inquilinoId: 3,
    inquilino: {
      id: 3,
      nombre: 'Laura',
      apellido: 'Sanchez',
      email: 'laura@email.com',
      telefono: '+52 55 8765 4321',
      documento: '55667788',
      avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
      createdAt: '',
      updatedAt: '',
    },
    propiedadId: 3,
    propiedad: {
      id: 3,
      nombre: 'Loft Central',
      direccion: '123 Av. Refonma',
      ciudad: 'CDMX',
      pais: 'Mexico',
      tipo: 'apartamento',
      rentaMensual: 1200,
      estado: 'ocupada',
      createdAt: '',
      updatedAt: '',
    },
    monto: 1200,
    estado: 'pagado',
    fechaVencimiento: '2024-04-12',
    fechaPago: '2024-04-12',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 3,
    inquilinoId: 5,
    inquilino: {
      id: 5,
      nombre: 'Gabriela',
      apellido: 'Torres',
      email: 'gabriela@email.com',
      telefono: '+55 11 9876 5432',
      documento: '99887766',
      avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
      createdAt: '',
      updatedAt: '',
    },
    propiedadId: 5,
    propiedad: {
      id: 5,
      nombre: 'Departamento Moderno',
      direccion: 'Rua Augusta 799',
      ciudad: 'Sao Paulo',
      pais: 'Brasil',
      tipo: 'apartamento',
      rentaMensual: 650,
      estado: 'ocupada',
      createdAt: '',
      updatedAt: '',
    },
    monto: 650,
    estado: 'pagado',
    fechaVencimiento: '2024-04-10',
    fechaPago: '2024-04-10',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 4,
    inquilinoId: 2,
    inquilino: {
      id: 2,
      nombre: 'Alejandro',
      apellido: 'Garcia',
      email: 'alejandro@email.com',
      telefono: '+54 11 5678 9012',
      documento: '98765432',
      avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
      createdAt: '',
      updatedAt: '',
    },
    propiedadId: 2,
    propiedad: {
      id: 2,
      nombre: 'Casa en Palermo',
      direccion: 'Calle Serrano 463',
      ciudad: 'Buenos Aires',
      pais: 'Argentina',
      tipo: 'casa',
      rentaMensual: 950,
      estado: 'ocupada',
      createdAt: '',
      updatedAt: '',
    },
    monto: 950,
    estado: 'pendiente',
    fechaVencimiento: '2024-05-05',
    diasAtrasado: 5,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 5,
    inquilinoId: 1,
    inquilino: {
      id: 1,
      nombre: 'Jose',
      apellido: 'Perez',
      email: 'jose@email.com',
      telefono: '+56 9 1234 5678',
      documento: '12345678-9',
      avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
      createdAt: '',
      updatedAt: '',
    },
    propiedadId: 1,
    propiedad: {
      id: 1,
      nombre: 'Apartment 3A',
      direccion: 'Av. Las Condes 123',
      ciudad: 'Santiago',
      pais: 'Chile',
      tipo: 'apartamento',
      rentaMensual: 800,
      estado: 'ocupada',
      createdAt: '',
      updatedAt: '',
    },
    monto: 800,
    estado: 'pendiente',
    fechaVencimiento: '2024-05-10',
    diasAtrasado: 10,
    createdAt: '',
    updatedAt: '',
  },
];

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
  const [pagos, setPagos] = useState<Pago[]>(mockPagos);
  const [showModal, setShowModal] = useState(false);
  const [selectedPago, setSelectedPago] = useState<Pago | null>(null);
  const [formData, setFormData] = useState<PagoFormData>(emptyFormData);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState('Abril 2024');

  const stats: PagosStats = {
    ingresosMes: 4250,
    ingresosVariacion: 25.3,
    rentasPendientes: 1550,
    morosos: 3,
  };

  const handleOpenModal = (pago?: Pago) => {
    if (pago) {
      setSelectedPago(pago);
      setFormData({
        inquilinoId: pago.inquilinoId,
        propiedadId: pago.propiedadId,
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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedPago) {
      // Register payment for existing pago
      setPagos((prev) =>
        prev.map((p) =>
          p.id === selectedPago.id
            ? {
                ...p,
                estado: 'pagado',
                fechaPago: formData.fechaPago,
                diasAtrasado: undefined
              }
            : p
        )
      );
    } else {
      // Create new payment record
      const newPago: Pago = {
        id: Date.now(),
        inquilinoId: formData.inquilinoId,
        propiedadId: formData.propiedadId,
        monto: formData.monto,
        estado: 'pagado',
        fechaVencimiento: formData.fechaPago,
        fechaPago: formData.fechaPago,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setPagos((prev) => [...prev, newPago]);
    }

    handleCloseModal();
  };

  const filteredPagos = pagos.filter((p) => {
    const matchesSearch =
      `${p.inquilino?.nombre} ${p.inquilino?.apellido}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.propiedad?.nombre.toLowerCase().includes(searchTerm.toLowerCase());
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

      {/* Stats Cards */}
      <div className="stats-grid stats-4">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Ingresos del mes</span>
          </div>
          <div className="stat-content">
            <span className="stat-value">${stats.ingresosMes.toLocaleString()}</span>
            <span className="stat-change positive">+{stats.ingresosVariacion}%</span>
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
            <span className="morosos-badge">{stats.morosos}</span>
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
            <option value="Abril 2024">Abril 2024</option>
            <option value="Marzo 2024">Marzo 2024</option>
            <option value="Febrero 2024">Febrero 2024</option>
            <option value="Enero 2024">Enero 2024</option>
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
            {filteredPagos.map((pago) => (
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
                  {pago.diasAtrasado && pago.estado !== 'pagado' && (
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
                        <button className="btn btn-outline btn-sm">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21,15 16,10 5,21" />
                          </svg>
                          Ver
                        </button>
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
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="table-pagination">
        <span className="pagination-info">1-{filteredPagos.length} de 28</span>
        <div className="pagination-controls">
          <button className="pagination-btn" disabled>&lt;</button>
          <button className="pagination-btn active">1</button>
          <button className="pagination-btn">2</button>
          <button className="pagination-btn">3</button>
          <button className="pagination-btn">4</button>
          <button className="pagination-btn">&gt;</button>
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
                        {mockPagos.map((p) => (
                          <option key={p.inquilinoId} value={p.inquilinoId}>
                            {p.inquilino?.nombre} {p.inquilino?.apellido}
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
