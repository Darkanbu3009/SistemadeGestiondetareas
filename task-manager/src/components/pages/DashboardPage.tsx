import { useState, useEffect, useCallback } from 'react';
import type { DashboardStats, Pago, Propiedad } from '../../types';
import {
  getDashboardStats,
  getRentasPendientes,
  getPropiedadesDestacadas,
} from '../../services/dashboardService';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts';

export function DashboardPage() {
  const { t } = useLanguage();
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

  // Month/Year filter
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return now.getMonth() + 1;
  });
  const [selectedYear, setSelectedYear] = useState(() => {
    const now = new Date();
    return now.getFullYear();
  });

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

  // Generate month options
  const getMonthOptions = () => {
    const months = [
      t('mes.enero'), t('mes.febrero'), t('mes.marzo'), t('mes.abril'),
      t('mes.mayo'), t('mes.junio'), t('mes.julio'), t('mes.agosto'),
      t('mes.septiembre'), t('mes.octubre'), t('mes.noviembre'), t('mes.diciembre')
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

  // Filter rentasPendientes by selected month/year
  const filteredRentasPendientes = rentasPendientes.filter((pago) => {
    const fechaVencimiento = pago.fechaVencimiento ? new Date(pago.fechaVencimiento) : null;
    if (!fechaVencimiento) return true;
    return fechaVencimiento.getMonth() + 1 === selectedMonth && fechaVencimiento.getFullYear() === selectedYear;
  });

  // Calculate filtered stats
  const filteredPendingAmount = filteredRentasPendientes.reduce((sum, p) => sum + (p.monto || 0), 0);

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="page-header">
          <h1 className="page-title">{t('dash.titulo')}</h1>
        </div>
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          <svg
            width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }}
          >
            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" strokeOpacity="1" />
          </svg>
          <p>{t('dash.cargando')}</p>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1 className="page-title">{t('dash.titulo')}</h1>
        <select
          className="filter-select"
          value={`${selectedMonth}-${selectedYear}`}
          onChange={handleMonthChange}
          style={{
            padding: '8px 16px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '0.95rem',
            color: '#1e293b',
            background: 'white',
            cursor: 'pointer',
            minWidth: '160px',
          }}
        >
          {getMonthOptions().map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
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
            <span className="stat-label">{t('dash.ingresosMes')}</span>
            <span className="stat-icon-badge stat-icon-green">
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
            <span className="stat-label">{t('dash.rentasPendientes')}</span>
            <span className="stat-icon-badge stat-icon-orange">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12,6 12,12 16,14" />
              </svg>
            </span>
          </div>
          <div className="stat-content">
            <span className="stat-value">${(filteredPendingAmount || stats.rentasPendientes).toLocaleString()}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">{t('dash.totalPropiedades')}</span>
            <span className="stat-icon-badge stat-icon-pink">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9,22 9,12 15,12 15,22" />
              </svg>
            </span>
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalPropiedades}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">{t('dash.inquilinosActivos')}</span>
            <span className="stat-icon-badge stat-icon-blue">
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

      {/* Charts Section */}
      <div className="dashboard-charts-grid">
        {/* Bar Chart - Inquilinos Activos */}
        <section className="content-section chart-section">
          <h2 className="section-title">{t('dash.chartInquilinos')}</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  {
                    name: t('dash.inquilinosAlDia'),
                    value: stats.inquilinosActivos - stats.morosos,
                  },
                  {
                    name: t('dash.inquilinosMorosos'),
                    value: stats.morosos,
                  },
                ]}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'var(--text-secondary)', fontSize: 13 }}
                  axisLine={{ stroke: 'var(--border-color)' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: 'var(--text-secondary)', fontSize: 13 }}
                  axisLine={{ stroke: 'var(--border-color)' }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                  labelStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={60}>
                  <Cell fill="#3b82f6" />
                  <Cell fill="#f59e0b" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Pie Chart - Ingresos vs Rentas Pendientes */}
        <section className="content-section chart-section">
          <h2 className="section-title">{t('dash.chartIngresos')}</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    {
                      name: t('dash.ingresosCobrados'),
                      value: stats.ingresosMes,
                    },
                    {
                      name: t('dash.rentasPendientesChart'),
                      value: stats.rentasPendientes,
                    },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  labelLine={true}
                >
                  <Cell fill="#3b82f6" />
                  <Cell fill="#f59e0b" />
                </Pie>
                <Tooltip
                  formatter={(value) => `$${Number(value).toLocaleString()}`}
                  contentStyle={{
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  formatter={(value: string) => (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Rentas Pendientes Table */}
      <section className="content-section">
        <h2 className="section-title">{t('dash.rentasPendientesTitle')}</h2>

        <div className="table-container">
          {filteredRentasPendientes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" style={{ marginBottom: '0.75rem' }}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <p>{t('dash.sinRentas')}</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th></th>
                  <th>{t('dash.renta')}</th>
                  <th>{t('dash.diasAtrasada')}</th>
                  <th>{t('dash.acciones')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredRentasPendientes.map((pago) => (
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
                        {t('dash.enviarRecordatorio')}
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
        <h2 className="section-title">{t('dash.propiedadesDestacadas')}</h2>

        {propiedadesDestacadas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" style={{ marginBottom: '0.75rem' }}>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9,22 9,12 15,12 15,22" />
            </svg>
            <p>{t('dash.sinPropiedades')}</p>
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
                  <span className="property-badge disponible">{t('dash.disponible')}</span>
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
