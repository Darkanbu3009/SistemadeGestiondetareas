import type { Task } from '../types/Task';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: number) => void;
  onDeleteTask: (id: number) => void;
  onEditTask: (task: Task) => void;
  onUpdateProgress: (id: number, progress: number) => void;
}

export const TaskItem = ({ task, onToggleComplete, onDeleteTask, onEditTask, onUpdateProgress }: TaskItemProps) => {
  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseInt(e.target.value, 10);
    onUpdateProgress(task.id, newProgress);
  };

  return (
    <div className={`task-item ${task.completed ? 'completed' : ''}`}>
      <div className="task-main">
        <div className="task-content">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => onToggleComplete(task.id)}
            className="task-checkbox"
          />
          <span className="task-title">{task.title}</span>
        </div>
        <div className="task-actions">
          <button
            onClick={() => onEditTask(task)}
            className="btn btn-edit"
          >
            Editar
          </button>
          <button
            onClick={() => onDeleteTask(task.id)}
            className="btn btn-danger"
          >
            Eliminar
          </button>
        </div>
      </div>
      <div className="task-progress-section">
        <div className="progress-bar-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${task.progress}%` }}
            />
          </div>
          <span className="progress-label">{task.progress}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={task.progress}
          onChange={handleProgressChange}
          className="progress-slider"
          disabled={task.completed}
        />
      </div>
    </div>
  );
};
