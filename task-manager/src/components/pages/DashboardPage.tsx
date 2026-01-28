import { useState } from 'react';
import type { DashboardStats, RentaPendiente, Propiedad } from '../../types';

// Mock data for demonstration
const mockStats: DashboardStats = {
  ingresosMes: 4250,
  ingresosVariacion: 25.3,
  rentasPendientes: 1550,
  totalPropiedades: 9,
  inquilinosActivos: 6,
  morosos: 3,
};

const mockRentasPendientes: RentaPendiente[] = [
  {
    id: 1,
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
    renta: 800,
    diasAtrasada: 5,
  },
  {
    id: 2,
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
    renta: 650,
    diasAtrasada: 4,
  },
  {
    id: 3,
    inquilino: {
      id: 3,
      nombre: 'Martin',
      apellido: 'Ruiz',
      email: 'martin@email.com',
      telefono: '+1 787 234 5678',
      documento: '11223344',
      avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
      createdAt: '',
      updatedAt: '',
    },
    propiedad: {
      id: 3,
      nombre: 'Loft Central',
      direccion: '123 Av. Reforma',
      ciudad: 'CDMX',
      pais: 'Mexico',
      tipo: 'apartamento',
      rentaMensual: 450,
      estado: 'ocupada',
      createdAt: '',
      updatedAt: '',
    },
    renta: 450,
    diasAtrasada: 3,
  },
];

const mockPropiedadesDestacadas: Propiedad[] = [
  {
    id: 1,
    nombre: 'Departamento Moderno',
    direccion: 'Rua Augusta 789',
    ciudad: 'Sao Paulo',
    pais: 'Brasil',
    tipo: 'apartamento',
    rentaMensual: 650,
    estado: 'disponible',
    imagen: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=300&h=200&fit=crop',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 2,
    nombre: 'PH Villa Colonial',
    direccion: 'San Juan, 723',
    ciudad: 'Urter Rinco',
    pais: 'Puerto Rico',
    tipo: 'casa',
    rentaMensual: 725,
    estado: 'disponible',
    imagen: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=300&h=200&fit=crop',
    createdAt: '',
    updatedAt: '',
  },
];

export function DashboardPage() {
  const [stats] = useState<DashboardStats>(mockStats);
  const [rentasPendientes] = useState<RentaPendiente[]>(mockRentasPendientes);
  const [propiedadesDestacadas] = useState<Propiedad[]>(mockPropiedadesDestacadas);

  const handleEnviarRecordatorio = (rentaId: number) => {
    console.log('Enviando recordatorio para renta:', rentaId);
    // In production, call API to send reminder
    alert('Recordatorio enviado');
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
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
            <span className="stat-label">Total de propiedades</span>
            <span className="stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </span>
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalPropiedades}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Inquilinos activos</span>
            <span className="stat-icon users">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            </span>
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.inquilinosActivos}</span>
          </div>
        </div>
      </div>

      {/* Rentas Pendientes Table */}
      <section className="content-section">
        <h2 className="section-title">Rentas pendientes</h2>

        <div className="table-filters">
          <div className="filter-group">
            <select className="filter-select">
              <option value="">Spartien</option>
            </select>
            <select className="filter-select">
              <option value="">Estado</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th></th>
                <th>Renta</th>
                <th>Dias atrasada</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rentasPendientes.map((renta) => (
                <tr key={renta.id}>
                  <td>
                    <div className="tenant-cell">
                      <img
                        src={renta.inquilino.avatar || '/default-avatar.png'}
                        alt={renta.inquilino.nombre}
                        className="tenant-avatar"
                      />
                      <div className="tenant-info">
                        <span className="tenant-name">
                          {renta.inquilino.nombre} {renta.inquilino.apellido}
                        </span>
                        <span className="tenant-address">
                          {renta.propiedad.direccion}, {renta.propiedad.ciudad}, {renta.propiedad.pais}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="rent-amount">
                      ${renta.renta.toLocaleString()}
                      <span className="rent-indicator"></span>
                    </div>
                  </td>
                  <td>
                    <span className="days-late">{renta.diasAtrasada} dias atrasada</span>
                  </td>
                  <td>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleEnviarRecordatorio(renta.id)}
                    >
                      Enviar recordatorio
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Propiedades Destacadas */}
      <section className="content-section">
        <h2 className="section-title">Propiedades destacadas</h2>

        <div className="properties-grid">
          {propiedadesDestacadas.map((propiedad) => (
            <div key={propiedad.id} className="property-card">
              <div className="property-image">
                <img src={propiedad.imagen} alt={propiedad.nombre} />
                <span className="property-badge disponible">Disponible</span>
              </div>
              <div className="property-info">
                <h3 className="property-name">{propiedad.nombre}</h3>
                <p className="property-address">
                  {propiedad.direccion}, {propiedad.ciudad}, {propiedad.pais}
                </p>
                <p className="property-price">${propiedad.rentaMensual}/meses</p>
              </div>
            </div>
          ))}
        </div>

        <div className="pagination-dots">
          <span className="dot active"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
      </section>
    </div>
  );
}
