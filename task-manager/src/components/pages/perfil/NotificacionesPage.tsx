import { useState, useEffect } from 'react';
import { getPreferences, updatePreferences, getSessions, closeSession, closeAllSessions } from '../../../services/userProfileApi';
import type { UserSession } from '../../../types';

export function NotificacionesPage() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Notification preferences
  const [recordatoriosPagos, setRecordatoriosPagos] = useState(true);
  const [avisosVencimiento, setAvisosVencimiento] = useState(true);
  const [confirmacionesReservacion, setConfirmacionesReservacion] = useState(true);
  const [resumenMensual, setResumenMensual] = useState(true);

  // Sessions for account activity
  const [sessions, setSessions] = useState<UserSession[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prefRes, sessionsRes] = await Promise.all([getPreferences(), getSessions()]);
      const pref = prefRes.data;
      setRecordatoriosPagos(pref.recordatoriosPagos);
      setAvisosVencimiento(pref.avisosVencimiento);
      setConfirmacionesReservacion(pref.confirmacionesReservacion);
      setResumenMensual(pref.resumenMensual);
      setSessions(sessionsRes.data);
    } catch {
      // First load might have empty data
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleToggle = async (field: string, value: boolean) => {
    try {
      await updatePreferences({ [field]: value });
    } catch {
      showMessage('error', 'Error al actualizar preferencia');
    }
  };

  const handleCloseSession = async (sessionId: number) => {
    try {
      await closeSession(sessionId);
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, activa: false } : s));
      showMessage('success', 'Sesión cerrada');
    } catch {
      showMessage('error', 'Error al cerrar la sesión');
    }
  };

  const handleCloseAllSessions = async () => {
    try {
      await closeAllSessions();
      setSessions(prev => prev.map(s => ({ ...s, activa: false })));
      showMessage('success', 'Todas las sesiones han sido cerradas');
    } catch {
      showMessage('error', 'Error al cerrar las sesiones');
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading-spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {message && (
        <div className={`profile-toast ${message.type === 'success' ? 'profile-toast-success' : 'profile-toast-error'}`}>
          {message.text}
        </div>
      )}

      <div className="profile-page-header">
        <h1>Notificaciones</h1>
        <p className="profile-page-subtitle">Administra las alertas y avisos</p>
      </div>

      {/* Avisos por correo */}
      <div className="profile-card">
        <div className="profile-card-header">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <h2>Avisos por correo</h2>
        </div>
        <p className="notif-section-desc">Elige qué avisos quieres recibir en tu correo electrónico</p>

        <div className="notif-list">
          {/* Recordatorios de pagos */}
          <div className="notif-item">
            <div className="notif-item-left">
              <div className="notif-item-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
              </div>
              <div>
                <span className="notif-item-title">Recordatorios de pagos</span>
                <p className="notif-item-desc">Recibirás un aviso cuando se acerque la fecha de cobro.</p>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={recordatoriosPagos}
                onChange={(e) => {
                  setRecordatoriosPagos(e.target.checked);
                  handleToggle('recordatoriosPagos', e.target.checked);
                }}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {/* Avisos de vencimiento */}
          <div className="notif-item">
            <div className="notif-item-left">
              <div className="notif-item-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12,6 12,12 16,14" />
                </svg>
              </div>
              <div>
                <span className="notif-item-title">Avisos de vencimiento</span>
                <p className="notif-item-desc">Recibirás alertas de contratos próximos a vencer.</p>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={avisosVencimiento}
                onChange={(e) => {
                  setAvisosVencimiento(e.target.checked);
                  handleToggle('avisosVencimiento', e.target.checked);
                }}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {/* Confirmaciones de reservación */}
          <div className="notif-item">
            <div className="notif-item-left">
              <div className="notif-item-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22,4 12,14.01 9,11.01" />
                </svg>
              </div>
              <div>
                <span className="notif-item-title">Confirmaciones de reservación</span>
                <p className="notif-item-desc">Recibirás nuevas confirmaciones y actualizaciones.</p>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={confirmacionesReservacion}
                onChange={(e) => {
                  setConfirmacionesReservacion(e.target.checked);
                  handleToggle('confirmacionesReservacion', e.target.checked);
                }}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {/* Resumen mensual */}
          <div className="notif-item">
            <div className="notif-item-left">
              <div className="notif-item-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div>
                <span className="notif-item-title">Resumen mensual</span>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={resumenMensual}
                onChange={(e) => {
                  setResumenMensual(e.target.checked);
                  handleToggle('resumenMensual', e.target.checked);
                }}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      {/* Actividad de cuenta */}
      <div className="profile-card">
        <div className="profile-card-header">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          <h2>Actividad de cuenta</h2>
        </div>

        {sessions.length === 0 ? (
          <p className="profile-empty-text">No hay sesiones registradas</p>
        ) : (
          <div className="notif-sessions-list">
            {sessions.map((session) => (
              <div key={session.id} className="notif-session-item">
                <div className="notif-session-left">
                  <div className="notif-item-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                  </div>
                  <div>
                    <span className="notif-item-title">Inicio de sesión en nuevos dispositivos</span>
                    <p className="notif-item-desc">
                      {session.ubicacion || session.ciudad || 'Ubicación desconocida'}
                    </p>
                  </div>
                </div>
                <div className="notif-session-right">
                  <div className="notif-session-location">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 6v16a1 1 0 0 0 1 1h20a1 1 0 0 0 1-1V6" />
                      <path d="M1 6l11 7 11-7" />
                    </svg>
                    <span>{session.ciudad || session.ubicacion || 'Desconocido'}</span>
                  </div>
                  <span className="notif-session-type">Sesión actual</span>
                </div>
                <div className="notif-session-actions">
                  {session.activa && (
                    <button className="btn btn-outline btn-sm" onClick={() => handleCloseSession(session.id)}>
                      Cerrar sesión
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {sessions.length > 0 && (
          <div className="sessions-footer">
            <div className="sessions-warning">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12,6 12,12 16,14" />
              </svg>
              <span>¿Sesiones sospechosas? <a href="#" onClick={(e) => { e.preventDefault(); handleCloseAllSessions(); }}>Cerrar todas las demás sesiones</a></span>
            </div>
            <button className="btn btn-danger-outline btn-sm" onClick={handleCloseAllSessions}>
              Cerrar todas las sesiones
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
