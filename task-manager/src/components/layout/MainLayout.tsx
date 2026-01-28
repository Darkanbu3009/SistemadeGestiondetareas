import { useState } from 'react';
import { Sidebar } from './Sidebar';
import type { PageType } from './Sidebar';
import { Navbar } from './Navbar';
import type { User } from '../../types';

interface MainLayoutProps {
  children: React.ReactNode;
  currentPage: PageType;
  onNavigate: (page: PageType) => void;
  onLogout: () => void;
  user?: User | null;
}

export function MainLayout({ children, currentPage, onNavigate, onLogout, user }: MainLayoutProps) {
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
        <Navbar onToggleSidebar={toggleSidebar} user={user} />
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export type { PageType };
