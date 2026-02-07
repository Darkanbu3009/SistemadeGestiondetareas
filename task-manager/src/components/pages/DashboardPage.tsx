import { useState, useEffect, useCallback } from 'react';
import type { DashboardStats, Pago, Propiedad } from '../../types';
import {
  getDashboardStats,
  getRentasPendientes,
  getPropiedadesDestacadas,
} from '../../services/dashboardService';

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    ingresosMes: 0,
    ingresosVariacion: 0,
    rentasPendientes: 0,
    totalPropiedades: 0,
    inquilinosActivos: 0,
    morosos: 0,
  });
  const [rentasPendientes, setRentasPendientes] = useState<Pago[]>([]);
  const [propiedadesDestacadas, setPropiedadesDestacadas] = useState<Propiedad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, rentasData, propiedadesData] = await Promise.all([
        getDashboardStats(),
        getRentasPendientes(),
        getPropiedadesDestacadas(),
      ]);
      setStats(statsData);
      setRentasPendientes(rentasData);
      setPropiedadesDestacadas(propiedadesData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleEnviarRecordatorio = (pagoId: number) => {
    console.log('Enviando recordatorio para pago:', pagoId);
    alert('Recordatorio enviado');
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
        </div>
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          <svg
            width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }}
          >
            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" strokeOpacity="1" />
          </svg>
          <p>Cargando datos del dashboard...</p>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
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
            onClick={() => { setError(null); fetchDashboardData(); }}
            style={{
              marginLeft: '1rem', cursor: 'pointer', background: 'none',
              border: 'none', fontSize: '14px', color: '#dc2626', textDecoration: 'underline',
            }}
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
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
            {stats.ingresosVariacion !== 0 && (
              <span className={`stat-change ${stats.ingresosVariacion >= 0 ? 'positive' : 'negative'}`}>
                {stats.ingresosVariacion >= 0 ? '+' : ''}{stats.ingresosVariacion}%
              </span>
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

        <div className="table-container">
          {rentasPendientes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" style={{ marginBottom: '0.75rem' }}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <p>No hay rentas pendientes o atrasadas. ¡Todo al día!</p>
            </div>
          ) : (
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
                {rentasPendientes.map((pago) => (
                  <tr key={pago.id}>
                    <td>
                      <div className="tenant-cell">
                        {pago.inquilino?.avatar ? (
                          <img
                            src={pago.inquilino.avatar}
                            alt={`${pago.inquilino?.nombre || ''} ${pago.inquilino?.apellido || ''}`}
                            className="tenant-avatar"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              const next = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                              if (next) next.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className="tenant-avatar-fallback"
                          style={{
                            width: 40, height: 40, minWidth: 40,
                            backgroundColor: '#e5e7eb', borderRadius: '50%',
                            display: pago.inquilino?.avatar ? 'none' : 'flex',
                            alignItems: 'center', justifyContent: 'center', color: '#9ca3af',
                          }}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        </div>
                        <div className="tenant-info">
                          <span className="tenant-name">
                            {pago.inquilino?.nombre || 'Sin nombre'} {pago.inquilino?.apellido || ''}
                          </span>
                          <span className="tenant-address">
                            {pago.propiedad?.direccion || ''}
                            {pago.propiedad?.ciudad ? `, ${pago.propiedad.ciudad}` : ''}
                            {pago.propiedad?.pais ? `, ${pago.propiedad.pais}` : ''}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="rent-amount">
                        ${(pago.monto || 0).toLocaleString()}
                        <span className="rent-indicator"></span>
                      </div>
                    </td>
                    <td>
                      <span className="days-late">
                        {pago.diasAtrasado || 0} dias atrasada
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => handleEnviarRecordatorio(pago.id)}
                      >
                        Enviar recordatorio
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Propiedades Destacadas */}
      <section className="content-section">
        <h2 className="section-title">Propiedades destacadas</h2>

        {propiedadesDestacadas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" style={{ marginBottom: '0.75rem' }}>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9,22 9,12 15,12 15,22" />
            </svg>
            <p>No hay propiedades disponibles actualmente.</p>
          </div>
        ) : (
          <div className="properties-grid">
            {propiedadesDestacadas.map((propiedad) => (
              <div key={propiedad.id} className="property-card">
                <div className="property-image">
                  {propiedad.imagen ? (
                    <img
                      src={propiedad.imagen}
                      alt={propiedad.nombre}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%', backgroundColor: '#f3f4f6',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af',
                    }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21,15 16,10 5,21" />
                      </svg>
                    </div>
                  )}
                  <span className="property-badge disponible">Disponible</span>
                </div>
                <div className="property-info">
                  <h3 className="property-name">{propiedad.nombre}</h3>
                  <p className="property-address">
                    {propiedad.direccion}, {propiedad.ciudad}
                    {propiedad.pais ? `, ${propiedad.pais}` : ''}
                  </p>
                  <p className="property-price">${(propiedad.rentaMensual || 0).toLocaleString()}/mes</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
