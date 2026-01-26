import type { Task } from '../types/Task';

interface User {
  id: number;
  name: string;
  email: string;
}

interface DashboardProps {
  user: User;
  tasks: Task[];
  onNavigateToTasks: () => void;
  onLogout: () => void;
}

export const Dashboard = ({ user, tasks, onNavigateToTasks, onLogout }: DashboardProps) => {
  const completedTasks = tasks.filter(task => task.completed);
  const pendingTasks = tasks.filter(task => !task.completed);
  const totalProgress = tasks.length > 0
    ? Math.round(tasks.reduce((acc, task) => acc + task.progress, 0) / tasks.length)
    : 0;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="welcome-section">
          <h2>Bienvenido, {user.name}</h2>
          <p className="user-email">{user.email}</p>
        </div>
        <button onClick={onLogout} className="btn btn-logout">
          Cerrar Sesion
        </button>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-number">{tasks.length}</div>
          <div className="stat-label">Total Tareas</div>
        </div>
        <div className="stat-card completed">
          <div className="stat-number">{completedTasks.length}</div>
          <div className="stat-label">Completadas</div>
        </div>
        <div className="stat-card pending">
          <div className="stat-number">{pendingTasks.length}</div>
          <div className="stat-label">Pendientes</div>
        </div>
        <div className="stat-card progress">
          <div className="stat-number">{totalProgress}%</div>
          <div className="stat-label">Progreso General</div>
        </div>
      </div>

      <div className="dashboard-progress-section">
        <h3>Progreso General</h3>
        <div className="overall-progress-bar">
          <div
            className="overall-progress-fill"
            style={{ width: `${totalProgress}%` }}
          />
        </div>
        <p className="progress-text">{totalProgress}% completado</p>
      </div>

      <div className="dashboard-tasks-preview">
        <div className="section-header">
          <h3>Tus Tareas Recientes</h3>
          <button onClick={onNavigateToTasks} className="btn btn-primary">
            Ver Todas las Tareas
          </button>
        </div>

        {tasks.length === 0 ? (
          <div className="empty-dashboard">
            <p>No tienes tareas todavia. Crea tu primera tarea para comenzar.</p>
            <button onClick={onNavigateToTasks} className="btn btn-primary">
              Crear Tarea
            </button>
          </div>
        ) : (
          <div className="task-preview-list">
            {tasks.slice(0, 5).map(task => (
              <div key={task.id} className={`task-preview-item ${task.completed ? 'completed' : ''}`}>
                <div className="task-preview-info">
                  <span className={`task-status-indicator ${task.completed ? 'completed' : 'pending'}`} />
                  <span className="task-preview-title">{task.title}</span>
                </div>
                <div className="task-preview-progress">
                  <div className="mini-progress-bar">
                    <div
                      className="mini-progress-fill"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                  <span className="progress-percentage">{task.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
