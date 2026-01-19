// src/components/gc/PremiumStatusBanner.tsx
import { route } from "preact-router";
import { Star } from "preact-feather";
import { useAuth } from "../../contexts/AuthContext";
import "./PremiumStatusBanner.css";

export function PremiumStatusBanner() {
  const { isPremium, premiumUntil, profile, loadingProfile } = useAuth();

  if (loadingProfile) {
    return null; // Não mostra nada enquanto carrega
  }

  // Banner para usuários Premium
  if (isPremium && premiumUntil) {
    const premiumDate = premiumUntil instanceof Date ? premiumUntil : new Date(premiumUntil);
    const formattedDate = premiumDate.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    return (
      <div class="gc-premium-status-banner gc-premium-status-banner-active">
        <div class="gc-premium-status-content">
          <Star size={20} class="gc-premium-status-icon" />
          <div class="gc-premium-status-text">
            <div class="gc-premium-status-title">PREMIUM ATIVO</div>
            <div class="gc-premium-status-subtitle">Válido até {formattedDate}</div>
          </div>
          <button
            class="gc-premium-status-button"
            onClick={() => route("/app/premium-status", true)}
            title="Ver detalhes da assinatura"
          >
            Gerenciar
          </button>
        </div>
      </div>
    );
  }

  // Banner para usuários Free
  if (!isPremium) {
    return (
      <div class="gc-premium-status-banner gc-premium-status-banner-free">
        <div class="gc-premium-status-content">
          <Star size={20} class="gc-premium-status-icon" />
          <div class="gc-premium-status-text">
            <div class="gc-premium-status-title">Você está no plano gratuito</div>
            <div class="gc-premium-status-subtitle">Desbloqueie recursos exclusivos Premium</div>
          </div>
          <button
            class="gc-premium-status-button gc-premium-status-button-primary"
            onClick={() => route("/app/upgrade", true)}
          >
            Fazer Upgrade
          </button>
        </div>
      </div>
    );
  }

  return null;
}

