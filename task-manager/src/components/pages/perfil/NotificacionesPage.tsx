export function NotificacionesPage() {
  return (
    <div className="profile-page">
      <div className="profile-page-header">
        <h1>Notificaciones</h1>
        <p className="profile-page-subtitle">Gestiona tus notificaciones</p>
      </div>

      <div className="profile-card profile-empty-card">
        <div className="profile-empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <h3>Próximamente</h3>
          <p>Esta sección estará disponible pronto.</p>
        </div>
      </div>
    </div>
  );
}
