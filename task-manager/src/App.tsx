import { useState, useEffect } from 'react';
import type { Task } from './types/Task';
import { TaskForm } from './components/TaskForm';
import { TaskList } from './components/TaskList';
import { Login } from './components/Login';
import { Register } from './components/Register';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || "/api";

interface User {
  id: number;
  name: string;
  email: string;
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [showRegister, setShowRegister] = useState(false);

  // Check if user is logged in on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    } else {
      setLoading(false);
    }
  }, []);

  // Load tasks when user is authenticated
  useEffect(() => {
    if (token && user) {
      loadTasks();
    }
  }, [token, user]);

  const loadTasks = async () => {
    try {
      const res = await fetch(`${API_URL}/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.status === 401) {
        handleLogout();
        return;
      }

      if (!res.ok) {
        throw new Error(`Error ${res.status}`);
      }

      const data = await res.json();
      setTasks(data);
      setError(null);
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError('Error al cargar tareas');
    } finally {
      setLoading(false);
    }
  };

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
        setError(data.message || 'Error al iniciar sesión');
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({ id: data.id, name: data.name, email: data.email }));
      setToken(data.token);
      setUser({ id: data.id, name: data.name, email: data.email });
    } catch (err) {
      setError('Error de conexión');
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
    } catch (err) {
      setError('Error de conexión');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setTasks([]);
    setLoading(false);
  };

  const handleAddTask = async (title: string) => {
    try {
      const res = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });

      if (res.status === 401) {
        handleLogout();
        return;
      }

      if (!res.ok) {
        setError('Error al crear tarea');
        return;
      }

      const newTask = await res.json();
      setTasks(prev => [newTask, ...prev]);
      setError(null);
    } catch (err) {
      setError('Error de conexión');
    }
  };

  const handleToggleComplete = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.status === 401) {
        handleLogout();
        return;
      }

      if (!res.ok) {
        setError('Error al actualizar tarea');
        return;
      }

      const updatedTask = await res.json();
      setTasks(prev => prev.map(task => task.id === id ? updatedTask : task));
      setError(null);
    } catch (err) {
      setError('Error de conexión');
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/tasks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.status === 401) {
        handleLogout();
        return;
      }

      if (!res.ok) {
        setError('Error al eliminar tarea');
        return;
      }

      setTasks(prev => prev.filter(task => task.id !== id));
      setError(null);
    } catch (err) {
      setError('Error de conexión');
    }
  };

  // Show login/register if not authenticated
  if (!token || !user) {
    return (
      <div className="app">
        <div className="container auth-container">
          <header className="app-header">
            <h1>Task Manager</h1>
            <p className="subtitle">Gestiona tus tareas de forma simple y efectiva</p>
          </header>

          <main className="app-main">
            {error && (
              <div className="error-message">⚠️ {error}</div>
            )}

            {showRegister ? (
              <>
                <Register onRegister={handleRegister} />
                <p className="auth-switch">
                  ¿Ya tienes cuenta?{' '}
                  <button onClick={() => setShowRegister(false)} className="link-button">
                    Iniciar Sesión
                  </button>
                </p>
              </>
            ) : (
              <>
                <Login onLogin={handleLogin} />
                <p className="auth-switch">
                  ¿No tienes cuenta?{' '}
                  <button onClick={() => setShowRegister(true)} className="link-button">
                    Registrarse
                  </button>
                </p>
              </>
            )}
          </main>
        </div>
      </div>
    );
  }

  const completedCount = tasks.filter(task => task.completed).length;
  const totalCount = tasks.length;

  if (loading) {
    return <p style={{ textAlign: 'center', marginTop: '2rem' }}>Cargando...</p>;
  }

  return (
    <div className="app">
      <div className="container">
        <header className="app-header">
          <h1>Task Manager</h1>
          <p className="subtitle">Hola, {user.name}!</p>
          <div className="header-actions">
            <div className="stats">
              <span>{completedCount} de {totalCount} completadas</span>
            </div>
            <button onClick={handleLogout} className="btn btn-logout">
              Cerrar Sesión
            </button>
          </div>
        </header>

        <main className="app-main">
          {error && (
            <div className="error-message">⚠️ {error}</div>
          )}

          <TaskForm onAddTask={handleAddTask} />
          <TaskList
            tasks={tasks}
            onToggleComplete={handleToggleComplete}
            onDeleteTask={handleDeleteTask}
          />
        </main>
      </div>
    </div>
  );
}

export default App;