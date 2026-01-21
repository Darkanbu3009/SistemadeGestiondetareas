import { useState, type FormEvent } from 'react';

interface TaskFormProps {
  onAddTask: (title: string) => void;
}

export const TaskForm = ({ onAddTask }: TaskFormProps) => {
  const [title, setTitle] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (title.trim() === '') {
      return;
    }

    onAddTask(title.trim());
    setTitle('');
  };

  return (
    <form onSubmit={handleSubmit} className="task-form">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Escribe una nueva tarea..."
        className="task-input"
      />
      <button type="submit" className="btn btn-primary">
        Agregar Tarea
      </button>
    </form>
  );
};
