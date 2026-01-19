import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { route } from 'preact-router';

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const SidebarItem = ({ href, label, icon, disabled = false, active = false, onClick }: any) => {
  const handleClick = (e: Event) => {
    e.preventDefault();
    if (disabled) return;
    if (onClick) {
      onClick();
    }
    if (href && href !== '#') {
      route(href);
    }
  };

  return (
    <a 
      href={href} 
      onClick={handleClick}
      class={`gc-nav-item ${active ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
      title={label}
    >
      <span class="gc-nav-icon">{icon}</span>
      <span class="gc-sidebar-label">{label}</span>
    </a>
  );
};

// Fallback Logo SVG if image fails
const FallbackLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#38b6ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M2 17L12 22L22 17" stroke="#38b6ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M2 12L12 17L22 12" stroke="#38b6ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
);

export const Sidebar = ({ isMobileOpen, onMobileClose }: SidebarProps) => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [logoError, setLogoError] = useState(false);

  // Update active state on navigation
  useEffect(() => {
    const handleUrlChange = () => {
      setCurrentPath(window.location.pathname);
    };
    
    // Listen to popstate (back/forward)
    window.addEventListener('popstate', handleUrlChange);
    
    // Monkey patch pushState/replaceState to detect route changes from preact-router
    const originalPushState = history.pushState;
    history.pushState = function(...args) {
      originalPushState.apply(this, args);
      handleUrlChange();
    };

    const originalReplaceState = history.replaceState;
    history.replaceState = function(...args) {
      originalReplaceState.apply(this, args);
      handleUrlChange();
    };

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);

  const isActive = (path: string) => {
    // Caso especial para /app: só ativa se for exatamente /app ou /app/
    if (path === '/app' || path === '/app/') {
      return currentPath === '/app' || currentPath === '/app/';
    }
    // Para outras rotas: pathname === item.path OR pathname.startsWith(item.path + "/")
    return currentPath === path || currentPath.startsWith(path + '/');
  };

  const menuItems = [
    {
      href: '/app',
      label: 'Dashboard',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
    },
    {
      href: '/app/profile/editais',
      label: 'Meus Editais',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
    },
    {
      href: '/app/upload',
      label: 'Novo Edital',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
    },
    {
      href: '#', 
      label: 'Mapa Tático IA',
      disabled: true, // Needs specific Edital ID context
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>
    },
    {
      href: '#',
      label: 'Questões IA',
      disabled: true, // Route not found
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
    },
    {
      href: '/app/flashcards',
      label: 'Flashcards',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
    },
    {
      href: '/app/planos',
      label: 'Meu Plano',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
    },
    {
      href: '/app/profile',
      label: 'Perfil',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
    }
  ];

  return (
    <Fragment>
      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div class="gc-sidebar-overlay" onClick={onMobileClose} />
      )}
      
      <aside class={`gc-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div class="gc-sidebar-header">
          <div class="gc-sidebar-logo">
            {!logoError ? (
              <img 
                src={`${import.meta.env.BASE_URL}logo.svg`} 
                alt="Guerreiro Concursos" 
                style="width:100%; height:100%;" 
                onError={() => setLogoError(true)}
              />
            ) : (
              <FallbackLogo />
            )}
          </div>
          <span class="gc-sidebar-logo-text">Guerreiro Concursos</span>
        </div>
        
        <nav class="gc-sidebar-nav">
          {menuItems.map((item) => (
            <SidebarItem 
              key={item.label} 
              {...item} 
              active={item.href !== '#' && isActive(item.href)}
              onClick={isMobileOpen ? onMobileClose : undefined}
            />
          ))}
        </nav>
      </aside>
    </Fragment>
  );
};
