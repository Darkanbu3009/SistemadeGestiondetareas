import { useState, useEffect } from 'react';
import { getPreferences, updatePreferences } from '../../../services/userProfileApi';
export function PreferenciasPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [idioma, setIdioma] = useState('es');
  const [zonaHoraria, setZonaHoraria] = useState('UTC-06:00');
  const [notificacionesCorreo, setNotificacionesCorreo] = useState(true);
  const [notificacionesSistema, setNotificacionesSistema] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const res = await getPreferences();
      const pref = res.data;
      setIdioma(pref.idioma);
      setZonaHoraria(pref.zonaHoraria);
      setNotificacionesCorreo(pref.notificacionesCorreo);
      setNotificacionesSistema(pref.notificacionesSistema);
    } catch {
      setMessage({ type: 'error', text: 'Error al cargar preferencias' });
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePreferences({
        idioma,
        zonaHoraria,
        notificacionesCorreo,
        notificacionesSistema,
      });
      showMessage('success', 'Preferencias guardadas correctamente');
    } catch {
      showMessage('error', 'Error al guardar preferencias');
    } finally {
      setSaving(false);
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
        <h1>Preferencias</h1>
        <p className="profile-page-subtitle">Personaliza tu experiencia</p>
      </div>

      {/* Language */}
      <div className="profile-card">
        <div className="profile-card-header">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <h2>Idioma</h2>
        </div>
        <div className="profile-form">
          <div className="profile-form-group">
            <label>Idioma</label>
            <select value={idioma} onChange={(e) => setIdioma(e.target.value)}>
              <option value="es">Español</option>
              <option value="en">English</option>
              <option value="pt">Português</option>
            </select>
          </div>
        </div>
      </div>

      {/* Timezone */}
      <div className="profile-card">
        <div className="profile-card-header">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12,6 12,12 16,14" />
          </svg>
          <h2>Zona horaria</h2>
        </div>
        <p className="profile-card-description">Horarios y eventos serán mostrados en esta zona horaria</p>
        <div className="profile-form">
          <div className="profile-form-group">
            <label>Zona horaria</label>
            <select value={zonaHoraria} onChange={(e) => setZonaHoraria(e.target.value)}>
              <option value="UTC-06:00">UTC-06:00 Ciudad de México</option>
              <option value="UTC-05:00">UTC-05:00 Bogotá</option>
              <option value="UTC-04:00">UTC-04:00 Santiago</option>
              <option value="UTC-03:00">UTC-03:00 Buenos Aires</option>
              <option value="UTC+00:00">UTC+00:00 Londres</option>
              <option value="UTC+01:00">UTC+01:00 Madrid</option>
            </select>
            <p className="form-help-text">Horarios y eventos serán mostrados en esta zona horaria.</p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="profile-card">
        <div className="profile-card-header">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          <h2>Elementos por pagina</h2>
        </div>
        <div className="profile-form">
          <div className="profile-pref-row">
            <div className="profile-pref-info">
              <div className="profile-pref-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div>
                <span className="pref-label">Mensajes de inquilinos</span>
                <p className="pref-description">Todos los elementos recibirán un nuevo mensaje de tus registros o recordatorios.</p>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notificacionesCorreo}
                onChange={(e) => setNotificacionesCorreo(e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="profile-pref-row">
            <div className="profile-pref-info">
              <div className="profile-pref-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div>
                <span className="pref-label">Alertas del sistema</span>
                <p className="pref-description">Avisos claves datos contados con el elemento de seguridad.</p>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notificacionesSistema}
                onChange={(e) => setNotificacionesSistema(e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      <div className="profile-save-footer">
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}
