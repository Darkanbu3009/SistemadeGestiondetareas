import { useState, useEffect } from 'react';
import type { Task } from './types/Task';
import { TaskForm } from './components/TaskForm';
import { TaskList } from './components/TaskList';
import { Dashboard } from './components/Dashboard';
import { Login } from './components/Login';
import { Register } from './components/Register';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || "/api";

interface User {
  id: number;
  name: string;
  email: string;
}

type Page = 'dashboard' | 'tasks';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [showRegister, setShowRegister] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [editingTask, setEditingTask] = useState<Task | null>(null);

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
    setTasks([]);
    setLoading(false);
    setCurrentPage('dashboard');
    setEditingTask(null);
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
      setError('Error de conexion');
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
      setError('Error de conexion');
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
      setError('Error de conexion');
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
  };

  const handleSaveEdit = async (id: number, title: string, progress: number) => {
    try {
      const res = await fetch(`${API_URL}/tasks/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, progress }),
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
      setEditingTask(null);
      setError(null);
    } catch (err) {
      setError('Error de conexion');
    }
  };

  const handleUpdateProgress = async (id: number, progress: number) => {
    try {
      const res = await fetch(`${API_URL}/tasks/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ progress }),
      });

      if (res.status === 401) {
        handleLogout();
        return;
      }

      if (!res.ok) {
        setError('Error al actualizar progreso');
        return;
      }

      const updatedTask = await res.json();
      setTasks(prev => prev.map(task => task.id === id ? updatedTask : task));
      setError(null);
    } catch (err) {
      setError('Error de conexion');
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
              <div className="error-message">{error}</div>
            )}

            {showRegister ? (
              <>
                <Register onRegister={handleRegister} />
                <p className="auth-switch">
                  Ya tienes cuenta?{' '}
                  <button onClick={() => setShowRegister(false)} className="link-button">
                    Iniciar Sesion
                  </button>
                </p>
              </>
            ) : (
              <>
                <Login onLogin={handleLogin} />
                <p className="auth-switch">
                  No tienes cuenta?{' '}
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

  if (loading) {
    return <p style={{ textAlign: 'center', marginTop: '2rem' }}>Cargando...</p>;
  }

  const completedCount = tasks.filter(task => task.completed).length;
  const totalCount = tasks.length;

  // Render Dashboard
  if (currentPage === 'dashboard') {
    return (
      <div className="app">
        <div className="container dashboard-container">
          <header className="app-header">
            <h1>Task Manager</h1>
            <p className="subtitle">Panel de Control</p>
          </header>
          <main className="app-main">
            {error && (
              <div className="error-message">{error}</div>
            )}
            <Dashboard
              user={user}
              tasks={tasks}
              onNavigateToTasks={() => setCurrentPage('tasks')}
              onLogout={handleLogout}
            />
          </main>
        </div>
      </div>
    );
  }

  // Render Tasks Page
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
            <button onClick={() => setCurrentPage('dashboard')} className="btn btn-nav">
              Dashboard
            </button>
            <button onClick={handleLogout} className="btn btn-logout">
              Cerrar Sesion
            </button>
          </div>
        </header>

        <main className="app-main">
          {error && (
            <div className="error-message">{error}</div>
          )}

          <TaskForm
            onAddTask={handleAddTask}
            onSaveEdit={handleSaveEdit}
            editingTask={editingTask}
            onCancelEdit={handleCancelEdit}
          />
          <TaskList
            tasks={tasks}
            onToggleComplete={handleToggleComplete}
            onDeleteTask={handleDeleteTask}
            onEditTask={handleEditTask}
            onUpdateProgress={handleUpdateProgress}
          />
        </main>
      </div>
    </div>
  );
}

export default App;
