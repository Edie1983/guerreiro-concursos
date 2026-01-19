import { useState, useEffect } from 'preact/hooks';
import { useAuth } from '../../contexts/AuthContext';
import { route } from 'preact-router';
import { Toast } from '../../components/common/feedback/Toast';
import { PageWrapper } from '../../components/layout/PageWrapper';
import './style.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const { login, loginWithGoogle, user, loading } = useAuth();

  // Navega automaticamente quando o usuário loga com sucesso
  useEffect(() => {
    if (!loading && user) {
      route('/app/', true);
    }
  }, [user, loading]);

  const handleLogin = async (e: Event) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      // A navegação será feita pelo useEffect acima quando o user for atualizado
    } catch (error: unknown) {
      console.error('Erro no login:', error);
      let errorMessage = 'Erro ao fazer login. Tente novamente.';
      
      // Type guard para erros do Firebase Auth
      if (error && typeof error === 'object' && 'code' in error) {
        const authError = error as { code: string; message?: string };
        if (authError.code === 'auth/user-not-found') {
          errorMessage = 'Usuário não encontrado. Verifique o email.';
        } else if (authError.code === 'auth/wrong-password') {
          errorMessage = 'Senha incorreta. Tente novamente.';
        } else if (authError.code === 'auth/invalid-email') {
          errorMessage = 'Email inválido. Verifique o formato.';
        } else if (authError.code === 'auth/user-disabled') {
          errorMessage = 'Esta conta foi desabilitada.';
        } else if (authError.code === 'auth/too-many-requests') {
          errorMessage = 'Muitas tentativas. Tente novamente mais tarde.';
        } else if (authError.message) {
          errorMessage = authError.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoadingGoogle(true);

    try {
      await loginWithGoogle();
      // A navegação será feita pelo useEffect acima quando o user for atualizado
    } catch (error: unknown) {
      console.error('Erro no login com Google:', error);
      let errorMessage = 'Erro ao fazer login com Google. Tente novamente.';
      
      // Type guard para erros do Firebase Auth
      if (error && typeof error === 'object' && 'code' in error) {
        const authError = error as { code: string; message?: string };
        if (authError.code === 'auth/popup-closed-by-user') {
          errorMessage = 'Login cancelado.';
        } else if (authError.code === 'auth/popup-blocked') {
          errorMessage = 'Popup bloqueado. Permita popups para este site.';
        } else if (authError.code === 'auth/account-exists-with-different-credential') {
          errorMessage = 'Já existe uma conta com este email usando outro método de login.';
        } else if (authError.message) {
          errorMessage = authError.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setShowToast(true);
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  return (
    <PageWrapper>
      <div class="login-layout">
        <div class="login-left">
          <img 
            src={`${import.meta.env.BASE_URL}logo.svg`}
            alt="Guerreiro Concursos"
            class="login-left-logo"
          />
          <h1 class="login-headline">Pare de Adivinhar e Comece a Acertar</h1>
          <p class="login-subheadline">Chegou a Sua Hora Guerreiro(a)!</p>
        </div>
        <div class="login-right">
          <div class="card-premium auth-card">
            <h1 class="auth-title">Login</h1>
            <form onSubmit={handleLogin} class="auth-form">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
                class="auth-input"
                disabled={isLoading}
                required
              />
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
                class="auth-input"
                disabled={isLoading}
                required
              />
              {error && !showToast && (
                <div class="auth-error" style="color: red; font-size: 0.875rem; margin-top: 0.5rem;">
                  {error}
                </div>
              )}
              <button 
                type="submit" 
                class="auth-button"
                disabled={isLoading || isLoadingGoogle}
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </button>
              <div class="auth-divider">
                <span>ou</span>
              </div>
              <button 
                type="button"
                onClick={handleGoogleLogin}
                class="auth-button-google"
                disabled={isLoading || isLoadingGoogle}
              >
                {!isLoadingGoogle && (
                  <svg class="google-icon" width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.96-2.184l-2.908-2.258c-.806.54-1.837.86-3.052.86-2.347 0-4.33-1.585-5.04-3.716H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                    <path fill="#FBBC05" d="M3.96 10.714c-.18-.54-.282-1.117-.282-1.714s.102-1.174.282-1.714V4.954H.957C.348 6.174 0 7.55 0 9s.348 2.826.957 4.046l3.003-2.332z"/>
                    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.954L3.96 7.286C4.67 5.155 6.653 3.58 9 3.58z"/>
                  </svg>
                )}
                {isLoadingGoogle ? 'Entrando...' : 'Entrar com Google'}
              </button>
              <p class="auth-link">
                Não tem uma conta? <a href="#" onClick={(e) => { e.preventDefault(); route("/app/register", true); }}>Registre-se</a>
              </p>
            </form>
          </div>
        </div>
      </div>
      <Toast
        message={error || ''}
        show={showToast}
        onClose={() => setShowToast(false)}
      />
    </PageWrapper>
  );
}