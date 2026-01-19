// src/pages/Upgrade/index.tsx
import { useState } from "preact/hooks";
import { useAuth } from "../../contexts/AuthContext";
import { PremiumStatusBanner } from "../../components/gc/PremiumStatusBanner";
import { PageWrapper } from "../../components/layout/PageWrapper";
import { createCheckoutSession } from "../../services/stripeService";
import { Toast } from "../../components/common/feedback/Toast";
import "../Home/style.css";

export default function Upgrade() {
  const { isPremium, user } = useAuth();
  const [loadingStripe, setLoadingStripe] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  const handleSubscribePremium = async (priceId: string) => {
    if (!user) return;
    setLoadingStripe(priceId);
    try {
      const url = await createCheckoutSession(priceId);
      window.location.href = url;
    } catch (error) {
      console.error("Erro ao criar checkout session:", error);
      setToastMessage("Erro ao iniciar assinatura. Tente novamente.");
      setShowToast(true);
      setLoadingStripe(null);
    }
  };

  return (
    <PageWrapper
      title="Upgrade para Premium"
      subtitle="Desbloqueie todo o potencial do Guerreiro Concursos"
    >
      <div class="gc-home">
        {/* Banner de Status Premium/Free */}
        <PremiumStatusBanner />

        {/* Planos Grid */}
        <div class="gc-grid-3">
          {/* PRO MENSAL — ESQUERDA */}
          <div class="gc-card gc-edital">
            <h2 class="gc-card-title">Premium Mensal</h2>

            <ul class="gc-list">
              <li>Editais ilimitados</li>
              <li>Processamento avançado</li>
              <li>Mapa tático completo</li>
              <li>Cronograma inteligente</li>
              <li>Suporte prioritário</li>
            </ul>

            <div class="gc-price">R$ 39,90/mês</div>

            {!isPremium && (
              <button
                class="gc-btn-primary"
                onClick={() => handleSubscribePremium("price_1SlaYtPSUiyACBIdcy5SmTqq")}
                disabled={loadingStripe !== null || !user}
              >
                {loadingStripe === "price_1SlaYtPSUiyACBIdcy5SmTqq" ? "Carregando..." : "ASSINAR MENSAL — R$ 39,90"}
              </button>
            )}
          </div>

          {/* FREE — CENTRO */}
          <div class="gc-card gc-edital">
            <h2 class="gc-card-title">Free</h2>

            <ul class="gc-list">
              <li>1 edital</li>
              <li>Processamento básico</li>
              <li>Mapa tático</li>
            </ul>

            <div class="gc-price">R$ 0/mês</div>

            <button class="gc-btn-disabled" disabled={true}>
              PLANO ATUAL
            </button>
          </div>

          {/* PRO ANUAL — DIREITA */}
          <div class="gc-card gc-edital">
            <h2 class="gc-card-title">Premium Anual</h2>
            <span class="gc-badge green">Melhor valor</span>

            <ul class="gc-list">
              <li>Editais ilimitados</li>
              <li>Processamento avançado</li>
              <li>Mapa tático completo</li>
              <li>Cronograma inteligente</li>
              <li>Suporte prioritário</li>
            </ul>

            <div class="gc-price">R$ 399,00/ano</div>

            {!isPremium && (
              <button
                class="gc-btn-primary"
                onClick={() => handleSubscribePremium("price_1SlaeNPSUiyACBIdJEMEVpAp")}
                disabled={loadingStripe !== null || !user}
              >
                {loadingStripe === "price_1SlaeNPSUiyACBIdJEMEVpAp" ? "Carregando..." : "ASSINAR ANUAL — R$ 399,00"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      <Toast
        message={toastMessage || ""}
        show={showToast}
        onClose={() => {
          setShowToast(false);
          setToastMessage(null);
        }}
      />
    </PageWrapper>
  );
}
