import { UserProfileSidebar } from './UserProfileSidebar';
import type { User, ProfilePageType } from '../../types';

interface UserProfileLayoutProps {
  children: React.ReactNode;
  currentProfilePage: ProfilePageType;
  onNavigateProfile: (page: ProfilePageType) => void;
  onToggleSidebar: () => void;
  onGoBack: () => void;
  user?: User | null;
}

export function UserProfileLayout({
  children,
  currentProfilePage,
  onNavigateProfile,
  onGoBack,
  user,
}: UserProfileLayoutProps) {
  return (
    <div className="app-layout profile-layout">
      <UserProfileSidebar
        currentPage={currentProfilePage}
        onNavigate={onNavigateProfile}
      />
      <div className="main-wrapper profile-main-wrapper">
        <header className="navbar">
          <div className="navbar-left">
            <button className="hamburger-btn" onClick={onGoBack} aria-label="Volver al dashboard" title="Volver al dashboard">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12,19 5,12 12,5" />
              </svg>
            </button>
          </div>

          <div className="navbar-right">
            <button className="navbar-icon-btn" aria-label="Messages">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </button>

            <button className="navbar-icon-btn" aria-label="Notifications">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="notification-badge"></span>
            </button>

            <div className="user-menu">
              <div className="user-avatar">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} />
                ) : (
                  <div className="avatar-placeholder">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
