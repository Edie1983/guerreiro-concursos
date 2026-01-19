// src/pages/PremiumStatus/index.tsx
import { useState, useEffect } from "preact/hooks";
import { route } from "preact-router";
import { Star, Calendar, CreditCard, AlertCircle, CheckCircle } from "preact-feather";
import { useAuth } from "../../contexts/AuthContext";
import { createBillingPortalSession } from "../../services/stripeService";
import { Toast } from "../../components/common/feedback/Toast";
import { PageWrapper } from "../../components/layout/PageWrapper";
import { PremiumStatusBanner } from "../../components/gc/PremiumStatusBanner";
import "../Home/style.css";

export default function PremiumStatus() {
  const { user, profile, isPremium, premiumUntil, subscriptionStatus, refreshProfile } = useAuth();
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [expired, setExpired] = useState(false);

  // Verifica se a assinatura expirou
  useEffect(() => {
    if (premiumUntil) {
      const premiumDate = premiumUntil instanceof Date ? premiumUntil : new Date(premiumUntil);
      const now = new Date();
      if (premiumDate <= now && subscriptionStatus !== "active") {
        setExpired(true);
      }
    }
  }, [premiumUntil, subscriptionStatus]);

  // Recarrega perfil periodicamente para verificar expiração
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      await refreshProfile();
    }, 60000); // A cada 1 minuto

    return () => clearInterval(interval);
  }, [user, refreshProfile]);

  // Redireciona se expirou
  useEffect(() => {
    if (expired && !isPremium) {
      const timer = setTimeout(() => {
        route("/app/upgrade", true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [expired, isPremium]);

  const handleManageSubscription = async () => {
    if (!user) {
      route("/app/login", true);
      return;
    }

    setLoadingPortal(true);
    try {
      const url = await createBillingPortalSession();
      window.location.href = url;
    } catch (error: any) {
      console.error("Erro ao abrir portal de assinatura:", error);
      setToastMessage("Erro ao abrir portal de assinatura. Tente novamente.");
      setShowToast(true);
      setLoadingPortal(false);
    }
  };

  const getStatusLabel = (status?: string): string => {
    switch (status) {
      case "active":
        return "Ativa";
      case "canceled":
        return "Cancelada";
      case "past_due":
        return "Pagamento Atrasado";
      case "incomplete":
        return "Incompleta";
      case "trialing":
        return "Período de Teste";
      case "unpaid":
        return "Não Paga";
      case "unknown":
        return "Desconhecido";
      default:
        return "Gratuito";
    }
  };

  const getStatusIcon = (status?: string) => {
    if (status === "active") {
      return <CheckCircle size={16} style="color: #30E88A;" />;
    }
    if (status === "past_due" || status === "unpaid") {
      return <AlertCircle size={16} style="color: #ef4444;" />;
    }
    return <AlertCircle size={16} style="color: var(--gc-text-muted);" />;
  };

  const premiumDate = premiumUntil
    ? (premiumUntil instanceof Date ? premiumUntil : new Date(premiumUntil))
    : null;

  const formattedDate = premiumDate
    ? premiumDate.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  return (
    <PageWrapper
      title="Status da Assinatura"
      subtitle="Gerencie sua assinatura Premium"
    >
      <div class="gc-home">
        {/* Banner de Status Premium/Free */}
        <PremiumStatusBanner />

        {/* List */}
        <div class="gc-list">
          {/* Aviso de expiração */}
          {expired && (
            <div class="gc-card gc-edital" style="border-color: rgba(239, 68, 68, 0.5); background: rgba(239, 68, 68, 0.05);">
              <div class="gc-edital-row">
                <div class="gc-edital-title" style="display: flex; align-items: center; gap: 8px;">
                  <AlertCircle size={18} style="color: #ef4444;" />
                  Sua assinatura expirou
                </div>
              </div>
              <div class="gc-edital-meta">
                <div class="gc-edital-info">
                  Você será redirecionado para a página de upgrade em alguns segundos...
                </div>
              </div>
            </div>
          )}

          {/* Card de Status */}
          <div class="gc-card gc-edital">
            <div class="gc-edital-row">
              <div class="gc-edital-title" style="display: flex; align-items: center; gap: 8px;">
                {isPremium ? (
                  <Star size={18} style="color: var(--gc-primary);" />
                ) : (
                  <Star size={18} style="color: var(--gc-text-dim);" />
                )}
                {isPremium ? "Plano Premium" : "Plano Gratuito"}
              </div>
            </div>

            <div class="gc-edital-meta">
              <div class="gc-edital-info">
                <span>{profile?.email || user?.email || "—"}</span>
              </div>
              <div class="gc-edital-info" style="display: flex; align-items: center; gap: 8px;">
                <Calendar size={14} />
                <span>Status: {getStatusIcon(subscriptionStatus)} {getStatusLabel(subscriptionStatus)}</span>
              </div>
              {premiumDate && (
                <div class="gc-edital-info" style="display: flex; align-items: center; gap: 8px;">
                  <Star size={14} />
                  <span>Válido até: {formattedDate}</span>
                </div>
              )}
              {profile?.createdAt && (
                <div class="gc-edital-info" style="display: flex; align-items: center; gap: 8px;">
                  <Calendar size={14} />
                  <span>Conta criada em: {new Date(profile.createdAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}</span>
                </div>
              )}
            </div>

            {/* Botões */}
            {isPremium && subscriptionStatus === "active" && (
              <div class="gc-edital-meta" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.08);">
                <button
                  style="background: var(--gc-primary); color: #00131b; border: none; padding: 10px 16px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;"
                  onClick={handleManageSubscription}
                  disabled={loadingPortal}
                >
                  <CreditCard size={16} />
                  {loadingPortal ? "Carregando..." : "Gerenciar Assinatura"}
                </button>
              </div>
            )}

            {!isPremium && (
              <div class="gc-edital-meta" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.08);">
                <button
                  style="background: var(--gc-primary); color: #00131b; border: none; padding: 10px 16px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;"
                  onClick={() => route("/app/upgrade", true)}
                >
                  <Star size={16} />
                  Fazer Upgrade
                </button>
              </div>
            )}
          </div>

          {/* Benefícios Premium */}
          <div class="gc-card gc-edital">
            <div class="gc-edital-row">
              <div class="gc-edital-title">Benefícios Premium</div>
            </div>

            <div class="gc-edital-meta">
              <div class="gc-edital-info" style="display: flex; align-items: center; gap: 8px;">
                <CheckCircle size={14} style="color: #30E88A; flex-shrink: 0;" />
                <span>Editais ilimitados</span>
              </div>
              <div class="gc-edital-info" style="display: flex; align-items: center; gap: 8px;">
                <CheckCircle size={14} style="color: #30E88A; flex-shrink: 0;" />
                <span>Mapa Tático completo</span>
              </div>
              <div class="gc-edital-info" style="display: flex; align-items: center; gap: 8px;">
                <CheckCircle size={14} style="color: #30E88A; flex-shrink: 0;" />
                <span>Cronograma Inteligente</span>
              </div>
              <div class="gc-edital-info" style="display: flex; align-items: center; gap: 8px;">
                <CheckCircle size={14} style="color: #30E88A; flex-shrink: 0;" />
                <span>Flashcards de revisão</span>
              </div>
              <div class="gc-edital-info" style="display: flex; align-items: center; gap: 8px;">
                <CheckCircle size={14} style="color: #30E88A; flex-shrink: 0;" />
                <span>Questões inéditas</span>
              </div>
              <div class="gc-edital-info" style="display: flex; align-items: center; gap: 8px;">
                <CheckCircle size={14} style="color: #30E88A; flex-shrink: 0;" />
                <span>Análise de desempenho</span>
              </div>
            </div>
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
