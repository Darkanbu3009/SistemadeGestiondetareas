import { useState, useEffect } from 'react';
import type { Task } from './types/Task';
import { TaskForm } from './components/TaskForm';
import { TaskList } from './components/TaskList';
import './App.css';

const API_URL = "https://ominous-space-halibut-55g4p49jrvgc4x4r-8080.app.github.dev/api/tasks";

function App() {
  // PASO 2.2 — Estado SIN mock
  const [tasks, setTasks] = useState<Task[]>([]);

  // PASO 2.2 — Cargar tareas desde backend (GET)
  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => setTasks(data))
      .catch(err => console.error(err));
  }, []);

  // PASO 2.3 — Crear tarea (POST real)
  const handleAddTask = async (title: string) => {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, completed: false }),
    });

    const newTask = await res.json();
    setTasks(prev => [...prev, newTask]);
  };

  // PASO 2.4 — Toggle completar tarea (PUT real)
  const handleToggleComplete = async (id: number) => {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
    });

    const updatedTask = await res.json();
    setTasks(prev =>
      prev.map(t => (t.id === id ? updatedTask : t))
    );
  };

  // PASO 2.5 — Eliminar tarea (DELETE real)
  const handleDeleteTask = async (id: number) => {
    await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const completedCount = tasks.filter(task => task.completed).length;
  const totalCount = tasks.length;

  return (
    <div className="app">
      <div className="container">
        <header className="app-header">
          <h1>Task Manager</h1>
          <p className="subtitle">Gestiona tus tareas de forma simple y efectiva</p>
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
