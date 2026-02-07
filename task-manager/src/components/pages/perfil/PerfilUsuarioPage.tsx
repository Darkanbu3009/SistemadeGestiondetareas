import { useState, useEffect } from 'react';
import { getProfile, updateProfile, removeAvatar, changePassword, getPreferences, updatePreferences, deleteAccount } from '../../../services/userProfileApi';
import type { UserProfileData } from '../../../types';

export function PerfilUsuarioPage() {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile form
  const [name, setName] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Preferences
  const [notificacionesCorreo, setNotificacionesCorreo] = useState(true);
  const [idioma, setIdioma] = useState('es');
  const [zonaHoraria, setZonaHoraria] = useState('UTC-06:00');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileRes, prefRes] = await Promise.all([getProfile(), getPreferences()]);
      const p = profileRes.data;
      setProfile(p);
      setName(p.name || '');
      setApellido(p.apellido || '');
      setEmail(p.email || '');
      setTelefono(p.telefono || '');

      const pref = prefRes.data;
      setNotificacionesCorreo(pref.notificacionesCorreo);
      setIdioma(pref.idioma);
      setZonaHoraria(pref.zonaHoraria);
    } catch {
      setMessage({ type: 'error', text: 'Error al cargar datos del perfil' });
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await updateProfile({ name, apellido, telefono });
      setProfile(res.data);
      // Update localStorage user
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        userData.name = res.data.name;
        userData.apellido = res.data.apellido;
        userData.telefono = res.data.telefono;
        localStorage.setItem('user', JSON.stringify(userData));
      }
      showMessage('success', 'Perfil actualizado correctamente');
    } catch {
      showMessage('error', 'Error al actualizar el perfil');
    } finally {
      setSaving(false);
    }
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

  const handleRemoveAvatar = async () => {
    try {
      await removeAvatar();
      setProfile(prev => prev ? { ...prev, avatar: undefined } : null);
      showMessage('success', 'Foto de perfil eliminada');
    } catch {
      showMessage('error', 'Error al eliminar la foto');
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar tu cuenta? Esta acción es permanente.')) {
      return;
    }
    try {
      await deleteAccount();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.reload();
    } catch {
      showMessage('error', 'Error al eliminar la cuenta');
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
        <h1>Perfil de Usuario</h1>
        <p className="profile-page-subtitle">Gestión de tu información</p>
      </div>

      <div className="profile-grid">
        {/* User Info Section */}
        <div className="profile-card profile-info-card">
          <div className="profile-card-header">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <h2>Información del usuario</h2>
          </div>
          <div className="profile-form">
            <div className="profile-form-row">
              <div className="profile-form-group">
                <label>Nombre</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                />
              </div>
              <div className="profile-form-group">
                <label>Apellido</label>
                <input
                  type="text"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  placeholder="Tu apellido"
                />
              </div>
            </div>
            <div className="profile-form-group">
              <label>Correo electrónico</label>
              <input
                type="email"
                value={email}
                disabled
                className="input-disabled"
              />
            </div>
            <div className="profile-form-group">
              <label>Teléfono</label>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Añadir número de teléfono"
              />
            </div>
            <button className="btn btn-primary" onClick={handleSaveProfile} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>

        {/* Visual Profile */}
        <div className="profile-card profile-visual-card">
          <div className="profile-card-header">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <h2>Perfil visual</h2>
          </div>
          <div className="profile-visual-content">
            <div className="profile-avatar-large">
              {profile?.avatar ? (
                <img src={profile.avatar} alt={profile.name} />
              ) : (
                <div className="avatar-placeholder-large">
                  {profile?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <button className="avatar-edit-btn" aria-label="Cambiar foto">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21,15 16,10 5,21" />
                </svg>
              </button>
            </div>
            <h3 className="profile-visual-name">{profile?.name} {profile?.apellido}</h3>
            <span className="profile-role-badge">{profile?.role || 'Admin'}</span>
            <div className="profile-visual-actions">
              <button className="btn btn-outline">Cambiar foto</button>
              <button className="btn btn-outline btn-danger-outline" onClick={handleRemoveAvatar}>
                Eliminar foto
              </button>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="profile-card">
          <div className="profile-card-header">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <h2>Seguridad</h2>
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
              <label>Confirmar contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder=""
              />
            </div>
            <button className="btn btn-primary" onClick={handleChangePassword} disabled={saving}>
              Actualizar contraseña
            </button>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="profile-card">
          <div className="profile-card-header">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <h2>Preferencias</h2>
          </div>
          <div className="profile-form">
            <div className="profile-pref-row">
              <div className="profile-pref-info">
                <span>Notificaciones por correo</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notificacionesCorreo}
                  onChange={(e) => {
                    setNotificacionesCorreo(e.target.checked);
                    updatePreferences({ notificacionesCorreo: e.target.checked });
                  }}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="profile-form-row">
              <div className="profile-form-group">
                <label>Idioma</label>
                <select
                  value={idioma}
                  onChange={(e) => {
                    setIdioma(e.target.value);
                    updatePreferences({ idioma: e.target.value });
                  }}
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div className="profile-form-group">
                <label>Zona horaria</label>
                <select
                  value={zonaHoraria}
                  onChange={(e) => {
                    setZonaHoraria(e.target.value);
                    updatePreferences({ zonaHoraria: e.target.value });
                  }}
                >
                  <option value="UTC-06:00">UTC-06:00 Ciudad de México</option>
                  <option value="UTC-05:00">UTC-05:00 Bogotá</option>
                  <option value="UTC-04:00">UTC-04:00 Santiago</option>
                  <option value="UTC-03:00">UTC-03:00 Buenos Aires</option>
                  <option value="UTC+00:00">UTC+00:00 Londres</option>
                  <option value="UTC+01:00">UTC+01:00 Madrid</option>
                </select>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="profile-danger-zone">
              <div className="profile-danger-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <h3>Zona de riesgo</h3>
              </div>
              <p>Eliminar tu cuenta es una acción permanente.</p>
              <button className="btn btn-danger" onClick={handleDeleteAccount}>
                Eliminar cuenta
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
