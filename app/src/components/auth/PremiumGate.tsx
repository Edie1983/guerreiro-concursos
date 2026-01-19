// src/components/auth/PremiumGate.tsx
import { route } from "preact-router";
import { useAuth } from "../../contexts/AuthContext";
import { Star, Lock } from "preact-feather";
import "./PremiumGate.css";

type PremiumGateProps = {
  children?: any;
  fallback?: any;
  featureName: string;
};

export function PremiumGate({ children, fallback, featureName }: PremiumGateProps) {
  const { isPremium, loadingPlan } = useAuth();

  if (loadingPlan) {
    return (
      <div class="premium-gate-loading">
        <div>Carregando...</div>
      </div>
    );
  }

  if (isPremium) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div class="premium-gate-card">
      <div class="premium-gate-icon">
        <Star size={32} />
      </div>
      <div class="premium-gate-title">Recurso Premium</div>
      <div class="premium-gate-description">
        {featureName} está disponível apenas no plano Premium.
      </div>
      <button
        class="premium-gate-button"
        onClick={() => route("/app/planos", true)}
      >
        Quero ser Premium
      </button>
    </div>
  );
}

