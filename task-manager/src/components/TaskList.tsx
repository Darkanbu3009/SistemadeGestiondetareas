import type { Task } from '../types/Task';
import { TaskItem } from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (id: number) => void;
  onDeleteTask: (id: number) => void;
}

export const TaskList = ({ tasks, onToggleComplete, onDeleteTask }: TaskListProps) => {
  if (tasks.length === 0) {
    return (
      <div className="empty-state">
        <p>No hay tareas pendientes. ¡Agrega una nueva tarea para comenzar!</p>
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
        />
      ))}
    </div>
  );
};
