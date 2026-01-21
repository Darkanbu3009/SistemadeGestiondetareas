import { useState } from 'react';
import type { Task } from './types/Task';
import { TaskForm } from './components/TaskForm';
import { TaskList } from './components/TaskList';
import './App.css';

// Datos mockeados iniciales
const INITIAL_TASKS: Task[] = [
  { id: 1, title: 'Aprender React', completed: false },
  { id: 2, title: 'Configurar TypeScript', completed: true },
  { id: 3, title: 'Crear componentes reutilizables', completed: false },
];

function App() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);

  // Genera un ID único basado en el timestamp y el array actual
  const generateId = (): number => {
    return tasks.length > 0
      ? Math.max(...tasks.map(t => t.id)) + 1
      : 1;
  };

  const handleAddTask = (title: string) => {
    const newTask: Task = {
      id: generateId(),
      title,
      completed: false,
    };
    setTasks([...tasks, newTask]);
  };

  const handleToggleComplete = (id: number) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const handleDeleteTask = (id: number) => {
    setTasks(tasks.filter(task => task.id !== id));
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
