import { useState, useEffect, type FormEvent } from 'react';
import type { Task } from '../types/Task';

interface TaskFormProps {
  onAddTask: (title: string) => void;
  onSaveEdit: (id: number, title: string, progress: number) => void;
  editingTask: Task | null;
  onCancelEdit: () => void;
}

export const TaskForm = ({ onAddTask, onSaveEdit, editingTask, onCancelEdit }: TaskFormProps) => {
  const [title, setTitle] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setProgress(editingTask.progress);
    } else {
      setTitle('');
      setProgress(0);
    }
  }, [editingTask]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (title.trim() === '') {
      return;
    }

    if (editingTask) {
      onSaveEdit(editingTask.id, title.trim(), progress);
    } else {
      onAddTask(title.trim());
    }
    setTitle('');
    setProgress(0);
  };

  const handleCancel = () => {
    setTitle('');
    setProgress(0);
    onCancelEdit();
  };

  return (
    <form onSubmit={handleSubmit} className="task-form">
      <div className="task-form-inputs">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={editingTask ? "Editar tarea..." : "Escribe una nueva tarea..."}
          className="task-input"
        />
        {editingTask && (
          <div className="edit-progress-container">
            <label htmlFor="edit-progress">Progreso: {progress}%</label>
            <input
              id="edit-progress"
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(parseInt(e.target.value, 10))}
              className="progress-slider edit-slider"
            />
          </div>
        )}
      </div>
      <div className="task-form-buttons">
        <button type="submit" className="btn btn-primary">
          {editingTask ? 'Guardar Cambios' : 'Agregar Tarea'}
        </button>
        {editingTask && (
          <button type="button" onClick={handleCancel} className="btn btn-secondary">
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
};
