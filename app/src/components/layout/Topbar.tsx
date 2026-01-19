import { h } from 'preact';
import { useAuth } from '../../contexts/AuthContext';

interface TopbarProps {
  onToggleMobileSidebar: () => void;
}

export const Topbar = ({ onToggleMobileSidebar }: TopbarProps) => {
  const { user, profile, logout, isTester } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const displayName = profile?.displayName || user?.displayName || 'Aluno';
  const photoURL = profile?.photoURL || user?.photoURL;
  
  // Logic for initials (1 or 2 chars)
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(displayName);

  return (
    <header class="gc-topbar">
      <div class="gc-topbar-left">
        <button class="gc-hamburger" onClick={onToggleMobileSidebar} aria-label="Menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        {isTester && (
          <div class="gc-topbar-tester" title="Acesso liberado para testes fechados">
            <span class="gc-topbar-tester-dot" aria-hidden="true"></span>
            <span class="gc-topbar-tester-text">Testes fechados ativos</span>
          </div>
        )}
      </div>

      <div class="gc-topbar-right">
        <div class="gc-user-profile">
          <div class="gc-avatar">
            {photoURL ? (
              <img 
                src={photoURL} 
                alt={displayName} 
                onError={(e: any) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerText = initials;
                }} 
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <span class="gc-user-name">{displayName}</span>
        </div>
        
        <div class="gc-topbar-divider"></div>

        <button class="gc-btn-logout" onClick={handleLogout} title="Sair da conta">
          Sair
        </button>
      </div>
    </header>
  );
};
