import { useState, type FormEvent } from 'react';

interface RegisterProps {
  onRegister: (name: string, email: string, password: string) => void;
}

export const Register = ({ onRegister }: RegisterProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (name.trim() && email.trim() && password.trim()) {
      onRegister(name.trim(), email.trim(), password);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>Crear Cuenta</h2>

      {error && <div className="form-error">{error}</div>}
      
      <div className="form-group">
        <label htmlFor="name">Nombre</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tu nombre"
          required
        />
      </div>

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
          placeholder="Mínimo 6 caracteres"
          required
          minLength={6}
        />
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword">Confirmar Contraseña</label>
        <input
          type="password"
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repite la contraseña"
          required
        />
      </div>

      <button type="submit" className="btn btn-primary btn-block">
        Registrarse
      </button>
    </form>
  );
};
