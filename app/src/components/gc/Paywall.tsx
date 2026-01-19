// src/components/gc/Paywall.tsx
import { route } from "preact-router";
import { useEffect } from "preact/hooks";
import { useAuth } from "../../contexts/AuthContext";
import { Star, Lock } from "preact-feather";
import "./Paywall.css";

type PaywallProps = {
  children: any;
  fallback?: any;
};

/**
 * Componente Paywall - Redireciona para /app/planos se usuário não for premium
 * Valida premiumUntil e subscriptionStatus através do AuthContext
 */
export function Paywall({ children, fallback }: PaywallProps) {
  const { isPremium, loadingPlan, loadingProfile } = useAuth();

  useEffect(() => {
    // Redireciona para /app/planos se não for premium e não estiver carregando
    const isLoading = loadingPlan || loadingProfile;
    if (!isLoading && !isPremium) {
      route("/app/planos", true);
    }
  }, [isPremium, loadingPlan, loadingProfile]);

  // Mostra loading enquanto carrega informações do perfil
  if (loadingPlan || loadingProfile) {
    return (
      <div class="paywall-loading">
        <div>Carregando...</div>
      </div>
    );
  }

  // Se for premium, renderiza o conteúdo
  if (isPremium) {
    return <>{children}</>;
  }

  // Se tiver fallback customizado, renderiza
  if (fallback) {
    return <>{fallback}</>;
  }

  // Retorna null enquanto redireciona
  return null;
}


