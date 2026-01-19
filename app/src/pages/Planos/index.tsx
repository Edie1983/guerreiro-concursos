// src/pages/Planos/index.tsx
import { useState, useEffect } from "preact/hooks";
import { useAuth } from "../../contexts/AuthContext";
import { createCheckoutSession } from "../../services/stripeService";
import { Toast } from "../../components/common/feedback/Toast";
import { PageWrapper } from "../../components/layout/PageWrapper";
import "../Home/style.css";

// Constantes de preços do Stripe
const PRICE_MENSAL = "price_1SlaYtPSUiyACBIdcy5SmTqq";
const PRICE_ANUAL = "price_1SlaeNPSUiyACBIdJEMEVpAp";

export default function Planos() {
  const { user, refreshPlan } = useAuth();
  const [loadingStripe, setLoadingStripe] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  // Verifica status do retorno do Stripe e atualiza plano
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    
    if (status === "success" && user) {
      setToastMessage("Assinatura ativada com sucesso!");
      setShowToast(true);
      
      setTimeout(() => {
        refreshPlan();
        const url = new URL(window.location.href);
        url.searchParams.delete("status");
        url.searchParams.delete("session_id");
        window.history.replaceState({}, "", url.toString());
      }, 2000);
    } else if (status === "cancel" && user) {
      setToastMessage("Pagamento cancelado, nenhum valor foi cobrado.");
      setShowToast(true);
      
      const url = new URL(window.location.href);
      url.searchParams.delete("status");
      url.searchParams.delete("session_id");
      window.history.replaceState({}, "", url.toString());
    }
  }, [user, refreshPlan]);

  const handleSubscribe = async (priceId: string) => {
    if (!user) return;
    setLoadingStripe(priceId);
    try {
      const url = await createCheckoutSession(priceId);
      window.location.href = url;
    } catch (error) {
      console.error("Erro ao criar checkout session:", error);
      alert("Erro ao iniciar assinatura. Tente novamente.");
      setLoadingStripe(null);
    }
  };

  return (
    <PageWrapper
      title="Planos disponíveis"
      subtitle="Escolha o plano ideal para os seus estudos"
    >
      <div class="gc-home">
        <div class="gc-grid-3">

          {/* PRO MENSAL — ESQUERDA */}
          <div class="gc-card gc-edital">
            <h2>Premium Mensal</h2>
            <p class="gc-price">R$ 39,90/mês</p>
            <ul class="gc-list">
              <li>Editais ilimitados</li>
              <li>Processamento avançado</li>
              <li>Mapa tático completo</li>
              <li>Cronograma inteligente</li>
              <li>Suporte prioritário</li>
            </ul>
            <button 
              class="gc-btn-primary" 
              onClick={() => handleSubscribe(PRICE_MENSAL)}
              disabled={loadingStripe !== null || !user}
            >
              {loadingStripe === PRICE_MENSAL ? "Carregando..." : "Assinar Mensal"}
            </button>
          </div>

          {/* FREE — CENTRO */}
          <div class="gc-card gc-edital">
            <h2>Free</h2>
            <p class="gc-price">R$ 0/mês</p>
            <ul class="gc-list">
              <li>1 edital</li>
              <li>Processamento básico</li>
              <li>Mapa tático básico</li>
            </ul>
            <button class="gc-btn-disabled" disabled>
              Plano Atual
            </button>
          </div>

          {/* PRO ANUAL — DIREITA */}
          <div class="gc-card gc-edital">
            <div class="gc-badge">Melhor valor</div>
            <h2>Premium Anual</h2>
            <p class="gc-price">R$ 399,00/ano</p>
            <ul class="gc-list">
              <li>Editais ilimitados</li>
              <li>Processamento avançado</li>
              <li>Mapa tático completo</li>
              <li>Cronograma inteligente</li>
              <li>Suporte prioritário</li>
            </ul>
            <button 
              class="gc-btn-primary" 
              onClick={() => handleSubscribe(PRICE_ANUAL)}
              disabled={loadingStripe !== null || !user}
            >
              {loadingStripe === PRICE_ANUAL ? "Carregando..." : "Assinar Anual"}
            </button>
          </div>

        </div>
      </div>

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
