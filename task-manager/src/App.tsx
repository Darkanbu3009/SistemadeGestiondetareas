import { useState, useEffect } from 'react';
import type { Task } from './types/Task';
import { TaskForm } from './components/TaskForm';
import { TaskList } from './components/TaskList';
import './App.css';

// ✅ URL del backend en Codespaces
const API_URL =
  "https://ominous-space-halibut-55g4p49jrvgc4x4r-8080.app.github.dev/api/tasks";

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ GET — cargar tareas desde backend
  useEffect(() => {
    fetch(API_URL, {
      method: "GET",
      credentials: "include",  // ← IMPORTANTE para CORS con credenciales
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        console.log("Tareas cargadas:", data);
        setTasks(data);
        setError(null);
      })
      .catch(err => {
        console.error("Error al cargar tareas:", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  // ✅ POST — crear tarea
  const handleAddTask = async (title: string) => {
    try {
      console.log("Creando tarea:", title);
      
      const res = await fetch(API_URL, {
        method: "POST",
        credentials: "include",  // ← IMPORTANTE para CORS con credenciales
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
      });

      console.log("Respuesta POST status:", res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error en respuesta:", errorText);
        setError(`Error al crear tarea: ${res.status}`);
        return;
      }

      const newTask = await res.json();
      console.log("Tarea creada:", newTask);
      setTasks(prev => [...prev, newTask]);
      setError(null);
    } catch (err) {
      console.error("Error al crear tarea:", err);
      setError("Error de conexión al crear tarea");
    }
  };

  // ✅ PUT — toggle completed
  const handleToggleComplete = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        credentials: "include",  // ← IMPORTANTE para CORS con credenciales
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        console.error("Error al actualizar tarea:", res.status);
        setError(`Error al actualizar tarea: ${res.status}`);
        return;
      }

      const updatedTask = await res.json();
      console.log("Tarea actualizada:", updatedTask);
      setTasks(prev =>
        prev.map(task =>
          task.id === id ? updatedTask : task
        )
      );
      setError(null);
    } catch (err) {
      console.error("Error al actualizar tarea:", err);
      setError("Error de conexión al actualizar tarea");
    }
  };

  // ✅ DELETE — eliminar tarea
  const handleDeleteTask = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        credentials: "include",  // ← IMPORTANTE para CORS con credenciales
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        console.error("Error al eliminar tarea:", res.status);
        setError(`Error al eliminar tarea: ${res.status}`);
        return;
      }

      console.log("Tarea eliminada:", id);
      setTasks(prev => prev.filter(task => task.id !== id));
      setError(null);
    } catch (err) {
      console.error("Error al eliminar tarea:", err);
      setError("Error de conexión al eliminar tarea");
    }
  };

  const completedCount = tasks.filter(task => task.completed).length;
  const totalCount = tasks.length;

  if (loading) {
    return <p style={{ textAlign: "center", marginTop: "2rem" }}>Cargando tareas...</p>;
  }

  return (
    <div className="app">
      <div className="container">
        <header className="app-header">
          <h1>Task Manager</h1>
          <p className="subtitle">
            Gestiona tus tareas de forma simple y efectiva
          </p>
          <div className="stats">
            <span>{completedCount} de {totalCount} completadas</span>
          </div>
        </header>

        <main className="app-main">
          {error && (
            <div style={{
              background: "#fee2e2",
              border: "1px solid #ef4444",
              color: "#dc2626",
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              marginBottom: "1rem",
              fontSize: "0.9rem"
            }}>
              ⚠️ {error}
            </div>
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