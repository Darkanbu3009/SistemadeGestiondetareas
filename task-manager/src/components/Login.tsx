import { useState, type FormEvent } from 'react';

interface LoginProps {
  onLogin: (email: string, password: string) => void;
  onSwitchToRegister: () => void;
}

export const Login = ({ onLogin, onSwitchToRegister }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (email.trim() && password.trim()) {
      onLogin(email.trim(), password);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-form-section">
        <div className="auth-form-container">
          <div className="auth-logo">
            <img src="/zelvoria-logo.svg" alt="Zelvoria" className="logo-image" />
            <p className="logo-tagline">Gestion inteligente de rentas</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <h2 className="auth-title">Iniciar sesion</h2>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <div className="input-with-icon">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 6L12 13L2 6" />
                </svg>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Tu email"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Contrasena</label>
              <div className="input-with-icon">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contrasena"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block">
              Ingresar
            </button>

            <div className="auth-footer">
              <button type="button" className="link-button">
                Olvidaste tu contrasena?
              </button>
              <button type="button" onClick={onSwitchToRegister} className="link-button link-primary">
                Crear cuenta
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="auth-image-section">
        <img src="/auth-building.jpg" alt="Modern building" className="auth-image" />
      </div>
    </div>
  );
};
