import { UserProfileSidebar } from './UserProfileSidebar';
import { Navbar } from './Navbar';
import type { User, ProfilePageType } from '../../types';

interface UserProfileLayoutProps {
  children: React.ReactNode;
  currentProfilePage: ProfilePageType;
  onNavigateProfile: (page: ProfilePageType) => void;
  onToggleSidebar: () => void;
  onGoBack: () => void;
  onLogout?: () => void;
  user?: User | null;
}

export function UserProfileLayout({
  children,
  currentProfilePage,
  onNavigateProfile,
  onGoBack,
  onLogout,
  user,
}: UserProfileLayoutProps) {
  return (
    <div className="app-layout profile-layout">
      <UserProfileSidebar
        currentPage={currentProfilePage}
        onNavigate={onNavigateProfile}
      />
      <div className="main-wrapper profile-main-wrapper">
        <Navbar
          onToggleSidebar={onGoBack}
          onNavigateProfile={onNavigateProfile}
          onLogout={onLogout}
          showBackArrow
          user={user}
        />
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
