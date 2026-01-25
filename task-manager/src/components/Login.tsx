import { useState, type FormEvent } from 'react';

interface LoginProps {
  onLogin: (email: string, password: string) => void;
}

export const Login = ({ onLogin }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (email.trim() && password.trim()) {
      onLogin(email.trim(), password);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>Iniciar Sesión</h2>
      
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">Contraseña</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
      </div>

      <button type="submit" className="btn btn-primary btn-block">
        Iniciar Sesión
      </button>
    </form>
  );
};
