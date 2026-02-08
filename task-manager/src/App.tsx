import { useState, useEffect } from 'react';
import { MainLayout } from './components/layout';
import type { PageType } from './components/layout';
import { UserProfileLayout } from './components/layout';
import { DashboardPage, PropiedadesPage, InquilinosPage, PagosPage, ContratosPage } from './components/pages';
import { PerfilUsuarioPage, SeguridadPage, NotificacionesPage, PreferenciasPage, SuscripcionPage, HistorialPage } from './components/pages/perfil';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { LanguageProvider } from './i18n/LanguageContext';
import type { User, ProfilePageType } from './types';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || "/api";

function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [showRegister, setShowRegister] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [showProfile, setShowProfile] = useState(false);
  const [currentProfilePage, setCurrentProfilePage] = useState<ProfilePageType>('perfil');

  // Check if user is logged in on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = async (email: string, password: string) => {
    try {
      setError(null);
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Error al iniciar sesion');
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({ id: data.id, name: data.name, email: data.email }));
      setToken(data.token);
      setUser({ id: data.id, name: data.name, email: data.email });
      setCurrentPage('dashboard');
    } catch (err) {
      setError('Error de conexion');
    }
  };

  const handleRegister = async (name: string, email: string, password: string) => {
    try {
      setError(null);
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Error al registrarse');
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({ id: data.id, name: data.name, email: data.email }));
      setToken(data.token);
      setUser({ id: data.id, name: data.name, email: data.email });
      setCurrentPage('dashboard');
    } catch (err) {
      setError('Error de conexion');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setCurrentPage('dashboard');
    setShowProfile(false);
  };

  const handleNavigate = (page: PageType) => {
    setCurrentPage(page);
    setShowProfile(false);
  };

  const handleNavigateToProfile = (page: ProfilePageType) => {
    setShowProfile(true);
    setCurrentProfilePage(page);
  };

  const handleGoBackToDashboard = () => {
    setShowProfile(false);
  };

  const handleNavigateProfile = (page: ProfilePageType) => {
    setCurrentProfilePage(page);
  };

  // Show login/register if not authenticated
  if (!token || !user) {
    return (
      <LanguageProvider>
        <div className="auth-wrapper">
          {error && (
            <div className="auth-error-toast">{error}</div>
          )}

          {showRegister ? (
            <Register
              onRegister={handleRegister}
              onSwitchToLogin={() => setShowRegister(false)}
            />
          ) : (
            <Login
              onLogin={handleLogin}
              onSwitchToRegister={() => setShowRegister(true)}
            />
          )}
        </div>
      </LanguageProvider>
    );
  }

  if (loading) {
    return (
      <LanguageProvider>
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>Cargando...</p>
        </div>
      </LanguageProvider>
    );
  }

  // Render profile page
  const renderProfilePage = () => {
    switch (currentProfilePage) {
      case 'perfil':
        return <PerfilUsuarioPage />;
      case 'seguridad':
        return <SeguridadPage />;
      case 'notificaciones':
        return <NotificacionesPage />;
      case 'preferencias':
        return <PreferenciasPage />;
      case 'suscripcion':
        return <SuscripcionPage />;
      case 'historial':
        return <HistorialPage />;
      default:
        return <PerfilUsuarioPage />;
    }
  };

  // Show profile section
  if (showProfile) {
    return (
      <LanguageProvider>
        <UserProfileLayout
          currentProfilePage={currentProfilePage}
          onNavigateProfile={handleNavigateProfile}
          onToggleSidebar={() => {}}
          onGoBack={handleGoBackToDashboard}
          onLogout={handleLogout}
          user={user}
        >
          {renderProfilePage()}
        </UserProfileLayout>
      </LanguageProvider>
    );
  }

  // Render page content based on current page
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'propiedades':
        return <PropiedadesPage />;
      case 'inquilinos':
        return <InquilinosPage />;
      case 'pagos':
        return <PagosPage />;
      case 'contratos':
        return <ContratosPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <LanguageProvider>
      <MainLayout
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        onNavigateProfile={handleNavigateToProfile}
        user={user}
      >
        {renderPage()}
      </MainLayout>
    </LanguageProvider>
  );
}

export default App;
