export function HistorialPage() {
  return (
    <div className="profile-page">
      <div className="profile-page-header">
        <h1>Historial</h1>
        <p className="profile-page-subtitle">Registro de actividad</p>
      </div>

      <div className="profile-card profile-empty-card">
        <div className="profile-empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12,6 12,12 16,14" />
          </svg>
          <h3>Próximamente</h3>
          <p>Esta sección estará disponible pronto.</p>
        </div>
      </div>
    </div>
  );
}
