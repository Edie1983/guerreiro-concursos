import { h, ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import { Sidebar } from '../layout/Sidebar';
import { Topbar } from '../layout/Topbar';
import '../../styles/layout.css';

interface AppLayoutProps {
  children: ComponentChildren;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const closeMobileSidebar = () => {
    setIsMobileOpen(false);
  };

  return (
    <div class="gc-app-shell">
      <Sidebar 
        isMobileOpen={isMobileOpen} 
        onMobileClose={closeMobileSidebar} 
      />
      
      <div class="gc-app-main">
        <Topbar onToggleMobileSidebar={toggleMobileSidebar} />
        
        <div class="gc-app-content">
          {children}
        </div>
      </div>
    </div>
  );
};
