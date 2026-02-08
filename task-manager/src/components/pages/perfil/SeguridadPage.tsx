import { useState, useEffect } from 'react';
import { changePassword, getSessions, closeSession, closeAllSessions } from '../../../services/userProfileApi';
import { useLanguage } from '../../../i18n/LanguageContext';
import type { UserSession } from '../../../types';

export function SeguridadPage() {
  const { t } = useLanguage();
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
      showMessage('error', t('seguridad.noCoinciden'));
      return;
    }
    if (newPassword.length < 8) {
      showMessage('error', t('seguridad.minimo8'));
      return;
    }
    setSaving(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showMessage('success', t('seguridad.passwordActualizada'));
    } catch {
      showMessage('error', t('seguridad.errorPassword'));
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSession = async (sessionId: number) => {
    try {
      await closeSession(sessionId);
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, activa: false } : s));
      showMessage('success', t('seguridad.sesionCerrada'));
    } catch {
      showMessage('error', t('seguridad.errorCerrar'));
    }
  };

  const handleCloseAllSessions = async () => {
    try {
      await closeAllSessions();
      setSessions(prev => prev.map(s => ({ ...s, activa: false })));
      showMessage('success', t('seguridad.todasCerradas'));
    } catch {
      showMessage('error', t('seguridad.errorCerrar'));
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
        <h1>{t('seguridad.titulo')}</h1>
        <p className="profile-page-subtitle">{t('seguridad.subtitulo')}</p>
      </div>

      {/* Change Password */}
      <div className="profile-card">
        <div className="profile-card-header">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <h2>{t('seguridad.cambiarPassword')}</h2>
        </div>
        <div className="profile-form">
          <div className="profile-form-group">
            <label>{t('seguridad.passwordActual')}</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder={t('seguridad.placeholderPassword')}
            />
          </div>
          <div className="profile-form-group">
            <label>{t('seguridad.nuevaPassword')}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t('seguridad.minCaracteres')}
            />
          </div>
          <div className="profile-form-group">
            <label>{t('seguridad.confirmarPassword')}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={handleChangePassword} disabled={saving}>
            {saving ? 'Actualizando...' : t('seguridad.actualizar')}
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
          <h2>{t('seguridad.actividadReciente')}</h2>
        </div>

        {loading ? (
          <div className="loading-spinner"></div>
        ) : sessions.length === 0 ? (
          <p className="profile-empty-text">{t('seguridad.sinSesiones')}</p>
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
                  <span>{t('seguridad.sesionActual')}</span>
                </div>
                <div className="session-actions">
                  {session.activa && (
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleCloseSession(session.id)}
                    >
                      {t('seguridad.cerrarSesion')}
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
              <span>{t('seguridad.sesionesSospechosas')} <a href="#" onClick={(e) => { e.preventDefault(); handleCloseAllSessions(); }}>{t('seguridad.cerrarTodas')}</a></span>
            </div>
            <button className="btn btn-danger btn-sm" onClick={handleCloseAllSessions}>
              {t('seguridad.cerrarTodasBtn')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
