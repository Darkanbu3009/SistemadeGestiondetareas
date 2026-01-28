import { useState } from 'react';
import type { Contrato, ContratoFormData } from '../../types';

// Mock data
const mockContratos: Contrato[] = [
  {
    id: 1,
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
      rentaMensual: 4150,
      estado: 'ocupada',
      createdAt: '',
      updatedAt: '',
    },
    fechaInicio: '2024-11-26',
    fechaFin: '2024-11-29',
    rentaMensual: 4150,
    estado: 'activo',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 2,
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
      direccion: 'Av. Porlex ve 13dn 223, Ser, Jern',
      ciudad: 'FR',
      pais: 'Puerto Rico',
      tipo: 'casa',
      rentaMensual: 3350,
      estado: 'ocupada',
      createdAt: '',
      updatedAt: '',
    },
    fechaInicio: '2024-08-13',
    fechaFin: '2025-08-13',
    rentaMensual: 3350,
    estado: 'por_vencer',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 3,
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
      nombre: 'Loft Central',
      direccion: 'Avensas Nefonmo 123',
      ciudad: 'Buenos Aires',
      pais: 'Argentina',
      tipo: 'apartamento',
      rentaMensual: 1200,
      estado: 'ocupada',
      createdAt: '',
      updatedAt: '',
    },
    fechaInicio: '2024-05-20',
    fechaFin: '2024-04-20',
    rentaMensual: 1200,
    estado: 'activo',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 4,
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
      direccion: 'Asenada 193, COML',
      ciudad: 'Medico',
      pais: 'Mexico',
      tipo: 'apartamento',
      rentaMensual: 650,
      estado: 'ocupada',
      createdAt: '',
      updatedAt: '',
    },
    fechaInicio: '2024-05-29',
    fechaFin: '2024-04-10',
    rentaMensual: 650,
    estado: 'activo',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 5,
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
      direccion: 'Rda Augustn, 795, Sorfoats',
      ciudad: 'Ssaal',
      pais: 'Brasil',
      tipo: 'apartamento',
      rentaMensual: 950,
      estado: 'ocupada',
      createdAt: '',
      updatedAt: '',
    },
    fechaInicio: '2023-03-23',
    fechaFin: '2024-03-22',
    rentaMensual: 950,
    estado: 'finalizado',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 6,
    inquilinoId: 6,
    inquilino: {
      id: 6,
      nombre: 'Joan',
      apellido: 'Riez',
      email: 'joan@email.com',
      telefono: '+56 9 8765 4321',
      documento: '77889900',
      avatar: 'https://randomuser.me/api/portraits/men/4.jpg',
      createdAt: '',
      updatedAt: '',
    },
    propiedadId: 6,
    propiedad: {
      id: 6,
      nombre: 'Condominio La Paz',
      direccion: 'Cato Andes 126',
      ciudad: 'Santiago',
      pais: 'Chile',
      tipo: 'apartamento',
      rentaMensual: 950,
      estado: 'ocupada',
      createdAt: '',
      updatedAt: '',
    },
    fechaInicio: '2024-05-23',
    fechaFin: '2024-05-13',
    rentaMensual: 950,
    estado: 'finalizado',
    createdAt: '',
    updatedAt: '',
  },
];

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
  const [contratos, setContratos] = useState<Contrato[]>(mockContratos);
  const [showModal, setShowModal] = useState(false);
  const [editingContrato, setEditingContrato] = useState<Contrato | null>(null);
  const [formData, setFormData] = useState<ContratoFormData>(emptyFormData);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('');

  const stats: ContratoStats = {
    activos: contratos.filter((c) => c.estado === 'activo').length,
    porVencer: contratos.filter((c) => c.estado === 'por_vencer').length,
    finalizados: contratos.filter((c) => c.estado === 'finalizado').length,
    sinFirmar: contratos.filter((c) => c.estado === 'sin_firmar').length,
  };

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingContrato) {
      // Update existing
      setContratos((prev) =>
        prev.map((c) =>
          c.id === editingContrato.id
            ? { ...c, ...formData, updatedAt: new Date().toISOString() }
            : c
        )
      );
    } else {
      // Create new
      const newContrato: Contrato = {
        id: Date.now(),
        ...formData,
        estado: 'activo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setContratos((prev) => [...prev, newContrato]);
    }

    handleCloseModal();
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Estas seguro de eliminar este contrato?')) {
      setContratos((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const handleUploadPdf = (contratoId: number) => {
    // In production, this would open a file picker and upload to server
    const pdfUrl = prompt('Ingrese la URL del PDF:');
    if (pdfUrl) {
      setContratos((prev) =>
        prev.map((c) =>
          c.id === contratoId
            ? { ...c, pdfUrl, updatedAt: new Date().toISOString() }
            : c
        )
      );
    }
  };

  const filteredContratos = contratos.filter((c) => {
    const matchesSearch =
      `${c.inquilino?.nombre} ${c.inquilino?.apellido}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.propiedad?.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = !filterEstado || c.estado === filterEstado;
    return matchesSearch && matchesFilter;
  });

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

  return (
    <div className="contratos-page">
      <div className="page-header">
        <h1 className="page-title">Contratos</h1>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <span>+</span> Anadir contrato
        </button>
      </div>

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
            onChange={(e) => setFilterEstado(e.target.value)}
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
              <th>Inicio</th>
              <th>Fin</th>
              <th>Renta</th>
              <th>Estado</th>
              <th>Documento</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredContratos.map((contrato) => (
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
                        {contrato.inquilino?.nombre} {contrato.inquilino?.apellido}
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
      </div>

      {/* Pagination */}
      <div className="table-pagination">
        <span className="pagination-info">1-{filteredContratos.length} de 13</span>
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
                    <label htmlFor="inquilinoId">Inquilino</label>
                    <select
                      id="inquilinoId"
                      name="inquilinoId"
                      value={formData.inquilinoId}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Seleccionar inquilino</option>
                      {mockContratos.map((c) => (
                        <option key={c.inquilinoId} value={c.inquilinoId}>
                          {c.inquilino?.nombre} {c.inquilino?.apellido}
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
                      {mockContratos.map((c) => (
                        <option key={c.propiedadId} value={c.propiedadId}>
                          {c.propiedad?.nombre}
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
                  <label htmlFor="pdfUpload">Documento del contrato (PDF)</label>
                  <input
                    type="file"
                    id="pdfUpload"
                    name="pdfUpload"
                    accept=".pdf"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingContrato ? 'Guardar cambios' : 'Anadir contrato'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
