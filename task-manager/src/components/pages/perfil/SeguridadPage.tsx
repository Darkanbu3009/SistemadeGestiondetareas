import { useState, useEffect } from 'react';
import { changePassword, getSessions, closeSession, closeAllSessions } from '../../../services/userProfileApi';
import type { UserSession } from '../../../types';

export function SeguridadPage() {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const res = await getSessions();
      setSessions(res.data);
    } catch {
      // Sessions might be empty on first load
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      showMessage('error', 'Las contraseñas no coinciden');
      return;
    }
    if (newPassword.length < 8) {
      showMessage('error', 'La contraseña debe tener al menos 8 caracteres');
      return;
    }
    setSaving(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showMessage('success', 'Contraseña actualizada correctamente');
    } catch {
      showMessage('error', 'Error al cambiar la contraseña. Verifica tu contraseña actual.');
    } finally {
      setSaving(false);
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

  const formatSessionDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="profile-page">
      {message && (
        <div className={`profile-toast ${message.type === 'success' ? 'profile-toast-success' : 'profile-toast-error'}`}>
          {message.text}
        </div>
      )}

      <div className="profile-page-header">
        <h1>Seguridad</h1>
        <p className="profile-page-subtitle">Protege tu cuenta y sesión</p>
      </div>

      {/* Change Password */}
      <div className="profile-card">
        <div className="profile-card-header">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <h2>Cambiar contraseña</h2>
        </div>
        <div className="profile-form">
          <div className="profile-form-group">
            <label>Contraseña actual</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
            />
          </div>
          <div className="profile-form-group">
            <label>Nueva contraseña</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          <div className="profile-form-group">
            <label>Confirmar nueva contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={handleChangePassword} disabled={saving}>
            {saving ? 'Actualizando...' : 'Actualizar contraseña'}
          </button>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="profile-card">
        <div className="profile-card-header">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12,6 12,12 16,14" />
          </svg>
          <h2>Actividad reciente</h2>
        </div>

        {loading ? (
          <div className="loading-spinner"></div>
        ) : sessions.length === 0 ? (
          <p className="profile-empty-text">No hay sesiones registradas</p>
        ) : (
          <div className="sessions-list">
            {sessions.map((session) => (
              <div key={session.id} className="session-item">
                <div className="session-status">
                  <span className={`session-dot ${session.activa ? 'session-dot-active' : 'session-dot-inactive'}`}></span>
                  <div className="session-info">
                    <span className="session-date">{formatSessionDate(session.fechaInicio)}</span>
                    <span className="session-location">{session.ciudad || session.ubicacion || 'Ubicación desconocida'}</span>
                  </div>
                </div>
                <div className="session-details">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 6v16a1 1 0 0 0 1 1h20a1 1 0 0 0 1-1V6" />
                    <path d="M1 6l11 7 11-7" />
                  </svg>
                  <span>{session.ubicacion || 'Desconocido'}</span>
                </div>
                <div className="session-type">
                  <span>Sesión actual</span>
                </div>
                <div className="session-actions">
                  {session.activa && (
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleCloseSession(session.id)}
                    >
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
            <button className="btn btn-danger btn-sm" onClick={handleCloseAllSessions}>
              Cerrar todas las sesiones
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
