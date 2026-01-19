import { useState, useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { User, FileText, Star, LogOut, TrendingUp, Book } from 'preact-feather';
import { useAuth } from '../../../contexts/AuthContext';
import './style.css';

interface TopBarProps {
  title: string;
  showBackButton?: boolean;
}

export function TopBar({ title, showBackButton = true }: TopBarProps) {
  const { user, profile, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.gc-topbar-menu-wrapper')) {
        setShowMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showMenu]);

  const handleLogout = async () => {
    if (confirm('Tem certeza que deseja sair?')) {
      await logout();
      route('/app/login', true);
    }
  };

  const getAvatarUrl = () => {
    if (user?.photoURL) return user.photoURL;
    if (profile?.photoURL) return profile.photoURL;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      profile?.displayName || user?.displayName || user?.email || 'U'
    )}&background=6366f1&color=fff&size=64`;
  };

  if (!user) {
    return (
      <header className="bg-surface-dark p-4 flex items-center sticky top-0 z-10 shadow-md">
        {showBackButton && (
          <button 
            onClick={() => history.back()}
            className="text-primary-light mr-4 p-2 rounded-full hover:bg-primary transition-colors"
            style={{ minWidth: '44px', minHeight: '44px' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <h1 className="text-xl font-bold text-text-primary">{title}</h1>
        <div className="flex-grow"></div>
        <button 
          onClick={() => route('/app/upload')} 
          className="bg-primary hover:bg-primary-light text-white font-bold py-2 px-4 rounded-lg"
          style={{ minWidth: '44px', minHeight: '44px' }}
        >
          +
        </button>
      </header>
    );
  }

  return (
    <header className="bg-surface-dark p-4 flex items-center sticky top-0 z-10 shadow-md">
      {showBackButton && (
        <button 
          onClick={() => history.back()}
          className="text-primary-light mr-4 p-2 rounded-full hover:bg-primary transition-colors"
          style={{ minWidth: '44px', minHeight: '44px' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      <h1 className="text-xl font-bold text-text-primary">{title}</h1>
      <div className="flex-grow"></div>
      <button 
        onClick={() => route('/app/upload')} 
        className="bg-primary hover:bg-primary-light text-white font-bold py-2 px-4 rounded-lg mr-2"
        style={{ minWidth: '44px', minHeight: '44px' }}
      >
        +
      </button>
      <div className="gc-topbar-menu-wrapper">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="gc-topbar-avatar-btn"
          title="Menu do usuário"
        >
          <img
            src={getAvatarUrl()}
            alt="Avatar"
            className="gc-topbar-avatar"
          />
        </button>
        {showMenu && (
          <div className="gc-topbar-menu">
            <button
              className="gc-topbar-menu-item"
              onClick={() => {
                setShowMenu(false);
                route('/app/profile', true);
              }}
            >
              <User size={18} />
              Meu Perfil
            </button>
            <button
              className="gc-topbar-menu-item"
              onClick={() => {
                setShowMenu(false);
                route('/app/profile/editais', true);
              }}
            >
              <FileText size={18} />
              Meus Editais
            </button>
            <button
              className="gc-topbar-menu-item"
              onClick={() => {
                setShowMenu(false);
                route('/app/premium-status', true);
              }}
            >
              <Star size={18} />
              Status Premium
            </button>
            <button
              className="gc-topbar-menu-item"
              onClick={() => {
                setShowMenu(false);
                route('/app/analytics', true);
              }}
            >
              <TrendingUp size={18} />
              Minha Evolução
            </button>
            <button
              className="gc-topbar-menu-item"
              onClick={() => {
                setShowMenu(false);
                route('/app/flashcards', true);
              }}
            >
              <Book size={18} />
              Flashcards
            </button>
            <div className="gc-topbar-menu-divider"></div>
            <button
              className="gc-topbar-menu-item gc-topbar-menu-item-danger"
              onClick={() => {
                setShowMenu(false);
                handleLogout();
              }}
            >
              <LogOut size={18} />
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  );
}