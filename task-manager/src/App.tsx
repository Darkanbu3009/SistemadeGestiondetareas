import { useState, useEffect } from 'react';
import { MainLayout } from './components/layout';
import type { PageType } from './components/layout';
import { DashboardPage, PropiedadesPage, InquilinosPage, PagosPage, ContratosPage } from './components/pages';
import { Login } from './components/Login';
import { Register } from './components/Register';
import type { User } from './types';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || "/api";

function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [showRegister, setShowRegister] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');

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
  };

  const handleNavigate = (page: PageType) => {
    setCurrentPage(page);
  };

  // Show login/register if not authenticated
  if (!token || !user) {
    return (
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
    );
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Cargando...</p>
      </div>
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
    <MainLayout
      currentPage={currentPage}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
      user={user}
    >
      {renderPage()}
    </MainLayout>
  );
}

export default App;
