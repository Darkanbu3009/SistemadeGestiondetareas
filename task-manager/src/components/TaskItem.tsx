import type { Task } from '../types/Task';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: number) => void;
  onDeleteTask: (id: number) => void;
}

export const TaskItem = ({ task, onToggleComplete, onDeleteTask }: TaskItemProps) => {
  return (
    <div className={`task-item ${task.completed ? 'completed' : ''}`}>
      <div className="task-content">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggleComplete(task.id)}
          className="task-checkbox"
        />
        <span className="task-title">{task.title}</span>
      </div>
      <button
        onClick={() => onDeleteTask(task.id)}
        className="btn btn-danger"
      >
        Eliminar
      </button>
    </div>
  );
};
