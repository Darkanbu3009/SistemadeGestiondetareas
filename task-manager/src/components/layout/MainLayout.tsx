import { useState } from 'react';
import { Sidebar } from './Sidebar';
import type { PageType } from './Sidebar';
import { Navbar } from './Navbar';
import type { User, ProfilePageType } from '../../types';

interface MainLayoutProps {
  children: React.ReactNode;
  currentPage: PageType;
  onNavigate: (page: PageType) => void;
  onLogout: () => void;
  onNavigateProfile?: (page: ProfilePageType) => void;
  user?: User | null;
}

export function MainLayout({ children, currentPage, onNavigate, onLogout, onNavigateProfile, user }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className={`app-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        onLogout={onLogout}
        collapsed={sidebarCollapsed}
        user={user}
      />
      <div className="main-wrapper">
        <Navbar
          onToggleSidebar={toggleSidebar}
          onNavigateProfile={onNavigateProfile}
          onLogout={onLogout}
          user={user}
        />
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export type { PageType };
