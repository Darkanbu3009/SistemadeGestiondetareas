import { useState, useEffect } from 'react';
import type { Task } from './types/Task';
import { TaskForm } from './components/TaskForm';
import { TaskList } from './components/TaskList';
import './App.css';

// ✅ URL correcta del backend en Codespaces
const API_URL =
  "https://ominous-space-halibut-55g4p49jrvgc4x4r-8080.app.github.dev/api/tasks";

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ GET — cargar tareas desde backend
  useEffect(() => {
    fetch(API_URL)
      .then(res => {
        if (!res.ok) {
          throw new Error("Error al cargar tareas");
        }
        return res.json();
      })
      .then(data => setTasks(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // ✅ POST — crear tarea (SOLO title)
  const handleAddTask = async (title: string) => {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    });

    if (!res.ok) {
      console.error("Error al crear tarea");
      return;
    }

    const newTask = await res.json();
    setTasks(prev => [...prev, newTask]);
  };

  // ✅ PUT — toggle completed
  const handleToggleComplete = async (id: number) => {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
    });

    if (!res.ok) {
      console.error("Error al actualizar tarea");
      return;
    }

    const updatedTask = await res.json();
    setTasks(prev =>
      prev.map(task =>
        task.id === id ? updatedTask : task
      )
    );
  };

  // ✅ DELETE — eliminar tarea
  const handleDeleteTask = async (id: number) => {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      console.error("Error al eliminar tarea");
      return;
    }

    setTasks(prev => prev.filter(task => task.id !== id));
  };

  const completedCount = tasks.filter(task => task.completed).length;
  const totalCount = tasks.length;

  if (loading) {
    return <p style={{ textAlign: "center" }}>Cargando tareas...</p>;
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
