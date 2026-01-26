import type { Task } from '../types/Task';
import { TaskItem } from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (id: number) => void;
  onDeleteTask: (id: number) => void;
  onEditTask: (task: Task) => void;
  onUpdateProgress: (id: number, progress: number) => void;
}

export const TaskList = ({ tasks, onToggleComplete, onDeleteTask, onEditTask, onUpdateProgress }: TaskListProps) => {
  if (tasks.length === 0) {
    return (
      <div className="empty-state">
        <p>No hay tareas pendientes. Agrega una nueva tarea para comenzar.</p>
      </div>
    );
  }

  return (
    <div className="task-list">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggleComplete={onToggleComplete}
          onDeleteTask={onDeleteTask}
          onEditTask={onEditTask}
          onUpdateProgress={onUpdateProgress}
        />
      ))}
    </div>
  );
};
