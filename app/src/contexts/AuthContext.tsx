import { createContext, type ComponentChildren } from 'preact';
import { useContext, useState, useEffect } from 'preact/hooks';
import { auth } from '../services/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  type User as FirebaseUser
} from 'firebase/auth';
import { createUserProfile, getUserProfile, ensureUserDoc, getUserPlan, updateUserProfile, updateDiasAtivos, updateHistoricoAtividade, type UserPlan, type UserProfile } from '../services/userService';
import { triggerAbrirApp, triggerStreak3Dias } from '../services/gamificacaoService';

export type AnalyticsData = {
  editaisProcessados: number;
  disciplinasVistas: number;
  semanasCriadas: number;
  diasAtivos: number;
  lastActivity: Date | null;
};

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  profile: UserProfile | null;
  loadingProfile: boolean;
  isTester: boolean;
  plan: UserPlan;
  loadingPlan: boolean;
  isPremium: boolean;
  subscriptionStatus?: "active" | "canceled" | "past_due" | "incomplete" | "trialing" | "unpaid" | "unknown";
  premiumUntil?: Date | null;
  analytics: AnalyticsData | null;
  gamificacao: {
    pontos: number;
    nivel: number;
    progressaoNivel: number;
    medalhas: string[];
  } | null;
  refreshProfile: () => Promise<void>;
  refreshPlan: () => Promise<void>;
  updateProfile: (data: { displayName?: string; photoURL?: string }) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  // Função utilitária para verificar se usuário é premium (exposta para uso externo)
  isPremiumUser: () => boolean;
}

interface AuthProviderProps {
  children: ComponentChildren;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Função utilitária para determinar se um usuário é premium
 * Regra definitiva: Premium = (subscriptionStatus === 'active' OR premiumUntil > now)
 */
function isUserPremium(
  plan: UserPlan,
  subscriptionStatus?: "active" | "canceled" | "past_due" | "incomplete" | "trialing" | "unpaid" | "unknown",
  premiumUntil?: Date | null,
  isTester?: boolean
): boolean {
  // Testers sempre têm acesso premium total, sem mexer em billing
  if (isTester) {
    return true;
  }

  const now = new Date();

  // Se subscriptionStatus é 'active', é premium
  if (subscriptionStatus === "active") {
    return true;
  }

  // Se premiumUntil existe e é maior que agora, é premium
  if (premiumUntil) {
    // Garante que premiumUntil é uma Date válida
    const premiumDate = premiumUntil instanceof Date ? premiumUntil : new Date(premiumUntil);
    if (!isNaN(premiumDate.getTime()) && premiumDate > now) {
      return true;
    }
  }

  // Caso contrário, não é premium
  return false;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [isTester, setIsTester] = useState(false);
  const [plan, setPlan] = useState<UserPlan>("free");
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<"active" | "canceled" | "past_due" | "incomplete" | "trialing" | "unpaid" | "unknown" | undefined>(undefined);
  const [premiumUntil, setPremiumUntil] = useState<Date | null | undefined>(undefined);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [gamificacao, setGamificacao] = useState<{
    pontos: number;
    nivel: number;
    progressaoNivel: number;
    medalhas: string[];
  } | null>(null);

  // Função para carregar perfil completo do usuário
  const loadProfile = async (uid: string, email?: string) => {
    setLoadingProfile(true);
    try {
      // Garante que o documento do usuário existe
      await ensureUserDoc(uid, email);
      
      // Busca perfil completo
      const userProfile = await getUserProfile(uid);
      
      if (userProfile) {
        setProfile(userProfile);
        setPlan(userProfile.plan);
        setIsTester(Boolean(userProfile.isTester));
        setSubscriptionStatus(userProfile.subscriptionStatus === "free" ? undefined : userProfile.subscriptionStatus);
        setPremiumUntil(userProfile.premiumUntil);
        
        // Usa função utilitária para calcular isPremium
        const premiumValid = isUserPremium(
          userProfile.plan,
          userProfile.subscriptionStatus === "free" ? undefined : userProfile.subscriptionStatus,
          userProfile.premiumUntil,
          userProfile.isTester
        );
        
        setIsPremium(premiumValid);

        // Atualiza analytics
        setAnalytics({
          editaisProcessados: userProfile.editaisProcessados || 0,
          disciplinasVistas: userProfile.disciplinasVistas || 0,
          semanasCriadas: userProfile.semanasCriadas || 0,
          diasAtivos: userProfile.diasAtivos || 0,
          lastActivity: userProfile.lastActivity || null,
        });

        // Atualiza gamificação
        setGamificacao({
          pontos: userProfile.pontos || 0,
          nivel: userProfile.nivel || 1,
          progressaoNivel: userProfile.progressaoNivel || 0,
          medalhas: userProfile.medalhas || [],
        });
      } else {
        // Se não encontrou perfil, cria um novo
        if (email) {
          await createUserProfile(uid, email);
          // Tenta carregar novamente
          const newProfile = await getUserProfile(uid);
          if (newProfile) {
            setProfile(newProfile);
            setPlan(newProfile.plan);
            setIsTester(Boolean(newProfile.isTester));
            setSubscriptionStatus(undefined);
            setPremiumUntil(null);
            setIsPremium(false);
            // Atualiza analytics para novo perfil
            setAnalytics({
              editaisProcessados: newProfile.editaisProcessados || 0,
              disciplinasVistas: newProfile.disciplinasVistas || 0,
              semanasCriadas: newProfile.semanasCriadas || 0,
              diasAtivos: newProfile.diasAtivos || 0,
              lastActivity: newProfile.lastActivity || null,
            });

            // Atualiza gamificação para novo perfil
            setGamificacao({
              pontos: newProfile.pontos || 0,
              nivel: newProfile.nivel || 1,
              progressaoNivel: newProfile.progressaoNivel || 0,
              medalhas: newProfile.medalhas || [],
            });
          }
        } else {
          setProfile(null);
          setPlan("free");
          setIsTester(false);
          setSubscriptionStatus(undefined);
          setPremiumUntil(undefined);
          setIsPremium(false);
        }
      }
    } catch (error) {
      console.error("[GC/Auth] Erro ao carregar perfil do usuário:", error);
      setProfile(null);
      setPlan("free");
      setIsPremium(false);
    } finally {
      setLoadingProfile(false);
    }
  };

  // Função para carregar informações do plano (mantida para compatibilidade)
  const loadPlan = async (uid: string, email?: string) => {
    setLoadingPlan(true);
    try {
      // Garante que o documento do usuário existe
      await ensureUserDoc(uid, email);
      
      // Busca informações do plano
      const planInfo = await getUserPlan(uid);
      
      if (planInfo) {
        setPlan(planInfo.plan);
        setIsTester(Boolean(planInfo.isTester));
        setSubscriptionStatus(planInfo.subscriptionStatus);
        setPremiumUntil(planInfo.premiumUntil);
        
        // Usa função utilitária para calcular isPremium
        const premiumValid = isUserPremium(
          planInfo.plan,
          planInfo.subscriptionStatus,
          planInfo.premiumUntil,
          planInfo.isTester
        );
        
        setIsPremium(premiumValid);
      } else {
        setPlan("free");
        setIsTester(false);
        setSubscriptionStatus(undefined);
        setPremiumUntil(undefined);
        setIsPremium(false);
      }
    } catch (error) {
      console.error("Erro ao carregar plano do usuário:", error);
      setPlan("free");
      setIsTester(false);
      setIsPremium(false);
    } finally {
      setLoadingPlan(false);
    }
  };

  // Função para atualizar perfil completo
  const refreshProfile = async () => {
    if (!user) return;
    await loadProfile(user.uid, user.email || undefined);
  };

  // Função para atualizar plano sem reload (mantida para compatibilidade)
  const refreshPlan = async () => {
    if (!user) return;
    await loadPlan(user.uid, user.email || undefined);
  };

  // Função para atualizar perfil do usuário
  const updateProfile = async (data: { displayName?: string; photoURL?: string }) => {
    if (!user) throw new Error("Usuário não autenticado");
    await updateUserProfile(user.uid, data);
    await refreshProfile();
  };

  // Sincroniza displayName e photoURL do Firebase Auth com Firestore
  useEffect(() => {
    if (user && profile) {
      const needsUpdate = 
        (user.displayName !== profile.displayName) || 
        (user.photoURL !== profile.photoURL);
      
      if (needsUpdate) {
        updateUserProfile(user.uid, {
          displayName: user.displayName || undefined,
          photoURL: user.photoURL || undefined,
        }).catch(console.error);
      }
    }
  }, [user, profile]);

  // Atualiza lastActivity periodicamente (a cada 5 minutos quando o usuário está logado)
  useEffect(() => {
    if (!user || !profile) return;

    const updateActivity = async () => {
      const now = new Date();
      try {
        await updateUserProfile(user.uid, {
          lastActivity: now,
        });

        // Atualiza histórico de atividade
        await updateHistoricoAtividade(user.uid);

        // Calcula e atualiza dias ativos (streak)
        if (profile.createdAt) {
          const diasAnteriores = profile.diasAtivos || 0;
          await updateDiasAtivos(user.uid, now, profile.createdAt);
          
          // Verifica se completou streak de 3 dias
          const profileAtualizado = await getUserProfile(user.uid);
          if (profileAtualizado && profileAtualizado.diasAtivos === 3 && diasAnteriores < 3) {
            await triggerStreak3Dias(user.uid);
          }
        }

        // Atualiza analytics local
        setAnalytics(prev => prev ? {
          ...prev,
          lastActivity: now,
        } : null);
      } catch (error) {
        console.error("[GC/Auth] Erro ao atualizar atividade:", error);
      }
    };

    // Atualiza imediatamente
    updateActivity();

    // Atualiza a cada 5 minutos
    const interval = setInterval(updateActivity, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, profile]);

  // Carrega perfil completo quando o usuário muda
  useEffect(() => {
    if (user) {
      loadProfile(user.uid, user.email || undefined);
      // Trigger: Usuário abriu o app
      triggerAbrirApp(user.uid).catch((error) => {
        console.error("[GC/Auth] Erro ao conceder pontos por abrir app:", error);
      });
    } else {
      // Reset quando usuário desloga
      setProfile(null);
      setPlan("free");
      setIsTester(false);
      setIsPremium(false);
      setSubscriptionStatus(undefined);
      setPremiumUntil(undefined);
      setAnalytics(null);
      setGamificacao(null);
      setLoadingProfile(false);
      setLoadingPlan(false);
    }
  }, [user]);

  // Verifica expiração de premium periodicamente
  useEffect(() => {
    if (!user || !premiumUntil) return;

    const checkExpiration = () => {
      const premiumDate = premiumUntil instanceof Date ? premiumUntil : new Date(premiumUntil);
      const now = new Date();
      
      // Se expirou e não está ativo, recarrega perfil
      if (premiumDate <= now && subscriptionStatus !== "active") {
        console.log("[GC/Auth] Premium expirado, recarregando perfil...");
        refreshProfile();
      }
    };

    // Verifica imediatamente
    checkExpiration();

    // Verifica a cada minuto
    const interval = setInterval(checkExpiration, 60000);

    return () => clearInterval(interval);
  }, [user, premiumUntil, subscriptionStatus, refreshProfile]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    await signInWithEmailAndPassword(auth, email, password);
    // O onAuthStateChanged vai atualizar o user automaticamente
  };

  const loginWithGoogle = async (): Promise<void> => {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    // Cria perfil se não existir
    const email = userCredential.user.email;
    if (email) {
      await createUserProfile(userCredential.user.uid, email);
    }
    // O onAuthStateChanged vai atualizar o user automaticamente
  };

  const register = async (email: string, password: string): Promise<void> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Cria perfil do usuário
    await createUserProfile(userCredential.user.uid, email);
    // O onAuthStateChanged vai atualizar o user automaticamente
  };

  const logout = async (): Promise<void> => {
    await signOut(auth);
    // O onAuthStateChanged vai atualizar o user automaticamente
  };

  // Função utilitária exposta para verificar premium status
  const isPremiumUser = (): boolean => {
    return isUserPremium(plan, subscriptionStatus, premiumUntil, isTester);
  };

  const value = {
    user,
    loading,
    profile,
    loadingProfile,
    isTester,
    plan,
    loadingPlan,
    isPremium,
    subscriptionStatus,
    premiumUntil,
    analytics,
    gamificacao,
    refreshProfile,
    refreshPlan,
    updateProfile,
    login,
    loginWithGoogle,
    register,
    logout,
    isPremiumUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
