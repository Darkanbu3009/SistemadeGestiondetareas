import { useState } from 'react';
import type { Inquilino, InquilinoFormData } from '../../types';

// Mock data
const mockInquilinos: Inquilino[] = [
  {
    id: 1,
    nombre: 'Jose',
    apellido: 'Perez',
    email: 'jose.perez@email.com',
    telefono: '+56 9 1234 5678',
    documento: '12345678-9',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
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
    contratoEstado: 'activo',
    contratoFin: '2024-10-10',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 2,
    nombre: 'Alejandro',
    apellido: 'Garcia',
    email: 'alejandro.garcia@email.com',
    telefono: '+54 11 5678 9012',
    documento: '98765432',
    avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
    propiedadId: 2,
    propiedad: {
      id: 2,
      nombre: 'Casa en Palermo',
      direccion: 'Calle Serrano 463',
      ciudad: 'Buenos Aires',
      pais: 'Argentina',
      tipo: 'casa',
      rentaMensual: 650,
      estado: 'ocupada',
      createdAt: '',
      updatedAt: '',
    },
    contratoEstado: 'activo',
    contratoFin: '2024-05-15',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 3,
    nombre: 'Laura',
    apellido: 'Sanchez',
    email: 'laura.sanchez@email.com',
    telefono: '+52 55 8765 4321',
    documento: '55667788',
    avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
    propiedadId: 3,
    propiedad: {
      id: 3,
      nombre: 'Loft Central',
      direccion: '123 Av. Reforma',
      ciudad: 'CDMX',
      pais: 'Mexico',
      tipo: 'apartamento',
      rentaMensual: 1200,
      estado: 'ocupada',
      createdAt: '',
      updatedAt: '',
    },
    contratoEstado: 'activo',
    contratoFin: '2024-06-27',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 4,
    nombre: 'Martin',
    apellido: 'Ruiz',
    email: 'martin.ruiz@email.com',
    telefono: '+1 787 234 5678',
    documento: '11223344',
    avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
    propiedadId: 4,
    propiedad: {
      id: 4,
      nombre: 'PH Villa Colonial',
      direccion: 'Ave Austral, Ponce de Let',
      ciudad: 'Rico',
      pais: 'Puerto Rico',
      tipo: 'casa',
      rentaMensual: 725,
      estado: 'ocupada',
      createdAt: '',
      updatedAt: '',
    },
    contratoEstado: 'finalizado',
    contratoFin: '2024-02-22',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 5,
    nombre: 'Gabriela',
    apellido: 'Torres',
    email: 'gabriela.torres@email.com',
    telefono: '+55 11 9876 5432',
    documento: '99887766',
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
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
    contratoEstado: 'sin_contrato',
    createdAt: '',
    updatedAt: '',
  },
];

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
  const [inquilinos, setInquilinos] = useState<Inquilino[]>(mockInquilinos);
  const [showModal, setShowModal] = useState(false);
  const [editingInquilino, setEditingInquilino] = useState<Inquilino | null>(null);
  const [formData, setFormData] = useState<InquilinoFormData>(emptyFormData);
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingInquilino) {
      // Update existing
      setInquilinos((prev) =>
        prev.map((i) =>
          i.id === editingInquilino.id
            ? { ...i, ...formData }
            : i
        )
      );
    } else {
      // Create new
      const newInquilino: Inquilino = {
        id: Date.now(),
        ...formData,
        contratoEstado: 'sin_contrato',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setInquilinos((prev) => [...prev, newInquilino]);
    }

    handleCloseModal();
  };

  const handleContactar = (inquilino: Inquilino) => {
    window.location.href = `mailto:${inquilino.email}`;
  };

  const filteredInquilinos = inquilinos.filter((i) =>
    `${i.nombre} ${i.apellido}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="inquilinos-page">
      <div className="page-header">
        <h1 className="page-title">Inquilinos</h1>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <span>+</span> Agregar inquilino
        </button>
      </div>

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
            {filteredInquilinos.map((inquilino) => (
              <tr key={inquilino.id}>
                <td>
                  <div className="tenant-cell">
                    <img
                      src={inquilino.avatar || '/default-avatar.png'}
                      alt={inquilino.nombre}
                      className="tenant-avatar"
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
                  {inquilino.contratoEstado === 'sin_contrato' ? (
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
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="table-pagination">
        <span className="pagination-info">1-{filteredInquilinos.length} de {filteredInquilinos.length}</span>
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
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingInquilino ? 'Guardar cambios' : 'Agregar inquilino'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
