import { useState, type FormEvent } from 'react';

interface RegisterProps {
  onRegister: (name: string, email: string, password: string) => void;
  onSwitchToLogin: () => void;
}

export const Register = ({ onRegister, onSwitchToLogin }: RegisterProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contrasenas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres');
      return;
    }

    if (name.trim() && email.trim() && password.trim()) {
      onRegister(name.trim(), email.trim(), password);
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
            <h2 className="auth-title">Crea tu cuenta</h2>

            {error && <div className="form-error">{error}</div>}

            <div className="form-group">
              <label htmlFor="name">Nombre completo</label>
              <div className="input-with-icon">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre y apellido"
                  required
                />
              </div>
            </div>

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
                  placeholder="Crear una contrasena"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmar contrasena</label>
              <div className="input-with-icon">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repetir contrasena"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block">
              Crear cuenta
            </button>

            <div className="auth-footer-center">
              <span>Ya tienes una cuenta?</span>
              <button type="button" onClick={onSwitchToLogin} className="link-button link-primary">
                Iniciar sesion
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
