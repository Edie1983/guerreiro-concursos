// src/components/dev/PanelStripePremiumTest.tsx
// Painel Visual de Teste Stripe Premium (DEV-only)

import { useState, useEffect } from "preact/hooks";
import { useAuth } from "../../contexts/AuthContext";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "../../services/firebase";
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from "preact-feather";
import { Toast } from "../common/feedback/Toast";
import type { UserDoc } from "../../services/userService";
import "./PanelStripePremiumTest.css";

interface UserStripeData {
  uid: string | null;
  isPremium: boolean;
  plan: "free" | "premium";
  subscriptionStatus?: "active" | "canceled" | "past_due" | "incomplete" | "trialing" | "unpaid" | "unknown";
  premiumUntil?: Date | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}

export function PanelStripePremiumTest() {
  // Guard DEV-only e SSR-safe (duplo guard)
  if (typeof window === "undefined") return null;
  if (!import.meta.env.DEV) return null;

  const { user, isPremium, plan, refreshPlan, loadingPlan } = useAuth();
  const [userData, setUserData] = useState<UserStripeData>({
    uid: null,
    isPremium: false,
    plan: "free",
  });
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // Função para buscar dados completos do usuário do Firestore
  const loadUserData = async () => {
    if (!user) {
      setUserData({
        uid: null,
        isPremium: false,
        plan: "free",
      });
      return;
    }

    setLoading(true);
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        setUserData({
          uid: user.uid,
          isPremium: false,
          plan: "free",
        });
        return;
      }

      const data = userSnap.data() as UserDoc;
      const premiumUntil = data.premiumUntil
        ? (data.premiumUntil instanceof Timestamp
            ? data.premiumUntil.toDate()
            : (data.premiumUntil as any).toDate?.() || null)
        : null;

      setUserData({
        uid: user.uid,
        isPremium,
        plan: data.plan || "free",
        subscriptionStatus: data.subscriptionStatus || undefined,
        premiumUntil,
        stripeCustomerId: data.stripeCustomerId || null,
        stripeSubscriptionId: data.stripeSubscriptionId || null,
      });
    } catch (error) {
      console.error("[PanelStripePremiumTest] Erro ao carregar dados:", error);
      setToastMessage("Erro ao carregar dados do usuário");
      setToastType("error");
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  // Carrega dados quando usuário muda ou quando isPremium/plan mudam
  useEffect(() => {
    loadUserData();
  }, [user, isPremium, plan]);

  // Função para recarregar plano
  const handleRefreshPlan = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await refreshPlan();
      // Aguarda um pouco para o refreshPlan atualizar o contexto
      setTimeout(() => {
        loadUserData();
        setToastMessage("Plano recarregado com sucesso!");
        setToastType("success");
        setShowToast(true);
      }, 500);
    } catch (error) {
      console.error("[PanelStripePremiumTest] Erro ao recarregar plano:", error);
      setToastMessage("Erro ao recarregar plano");
      setToastType("error");
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  // Formata data premiumUntil
  const formatPremiumUntil = (date: Date | null | undefined): string => {
    if (!date) return "—";
    try {
      return new Date(date).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Data inválida";
    }
  };

  // Se não há usuário logado
  if (!user) {
    return (
      <div class="gc-panel-stripe-test">
        <div style="background: rgba(15, 30, 45, 0.5); border: 1px solid rgba(56,182,255,0.08); border-radius: 16px; padding: 0.75rem; margin-bottom: 1rem; font-size: 0.9rem; font-weight: 700; color: var(--gc-text-muted); text-align: center;">
          PanelStripePremiumTest OK (sem usuário)
        </div>
        <div class="gc-panel-stripe-test-header">
          <div class="gc-panel-stripe-test-title">🔐 Teste Stripe Premium (DEV)</div>
        </div>
        <div class="gc-panel-stripe-test-unavailable">
          ⚠️ Faça login para visualizar os dados do plano.
        </div>
      </div>
    );
  }

  return (
    <>
      <div class="gc-panel-stripe-test">
        <div style="background: rgba(15, 30, 45, 0.5); border: 1px solid rgba(56,182,255,0.08); border-radius: 16px; padding: 0.75rem; margin-bottom: 1rem; font-size: 0.9rem; font-weight: 700; color: var(--gc-text-muted); text-align: center;">
          PanelStripePremiumTest OK (com usuário: {user.uid})
        </div>
        <div class="gc-panel-stripe-test-header">
          <div class="gc-panel-stripe-test-title">🔐 Teste Stripe Premium (DEV)</div>
          <div class="gc-panel-stripe-test-actions">
            <button
              class="gc-panel-stripe-test-btn"
              onClick={handleRefreshPlan}
              disabled={loading || loadingPlan}
              title="Recarregar dados do plano do Firestore"
            >
              <RefreshCw size={16} />
              {loading || loadingPlan ? "Carregando..." : "Recarregar dados do plano"}
            </button>
          </div>
        </div>

        <div class="gc-panel-stripe-test-grid">
          {/* Checklist Visual */}
          <div class="gc-panel-stripe-test-section gc-panel-stripe-test-section-full">
            <div class="gc-panel-stripe-test-section-title">
              <span>✅</span> Checklist de Validação
            </div>
            <div class="gc-panel-stripe-test-checklist">
              <div class="gc-panel-stripe-test-item">
                <div class="gc-panel-stripe-test-item-label">
                  <span class="gc-panel-stripe-test-icon">
                    {userData.uid ? <CheckCircle size={18} /> : <XCircle size={18} />}
                  </span>
                  UID
                </div>
                <div class="gc-panel-stripe-test-item-value">
                  {userData.uid ? (
                    <code class="gc-panel-stripe-test-code">{userData.uid}</code>
                  ) : (
                    <span class="gc-panel-stripe-test-empty">—</span>
                  )}
                </div>
              </div>

              <div class="gc-panel-stripe-test-item">
                <div class="gc-panel-stripe-test-item-label">
                  <span class="gc-panel-stripe-test-icon">
                    {userData.isPremium ? (
                      <CheckCircle size={18} class="gc-icon-success" />
                    ) : (
                      <XCircle size={18} class="gc-icon-error" />
                    )}
                  </span>
                  isPremium (resultado isUserPremium)
                </div>
                <div class={`gc-panel-stripe-test-item-value ${userData.isPremium ? "gc-value-success" : "gc-value-error"}`}>
                  {userData.isPremium ? "✓ Premium" : "✗ Free"}
                </div>
              </div>

              <div class="gc-panel-stripe-test-item">
                <div class="gc-panel-stripe-test-item-label">
                  <span class="gc-panel-stripe-test-icon">
                    {userData.subscriptionStatus ? <CheckCircle size={18} /> : <AlertCircle size={18} class="gc-icon-warning" />}
                  </span>
                  subscriptionStatus
                </div>
                <div class={`gc-panel-stripe-test-item-value ${
                  userData.subscriptionStatus === "active" 
                    ? "gc-value-success" 
                    : userData.subscriptionStatus 
                    ? "gc-value-warning" 
                    : "gc-value-muted"
                }`}>
                  {userData.subscriptionStatus || "—"}
                </div>
              </div>

              <div class="gc-panel-stripe-test-item">
                <div class="gc-panel-stripe-test-item-label">
                  <span class="gc-panel-stripe-test-icon">
                    {userData.premiumUntil ? <CheckCircle size={18} /> : <XCircle size={18} />}
                  </span>
                  premiumUntil (formatado)
                </div>
                <div class="gc-panel-stripe-test-item-value">
                  {formatPremiumUntil(userData.premiumUntil)}
                </div>
              </div>

              <div class="gc-panel-stripe-test-item">
                <div class="gc-panel-stripe-test-item-label">
                  <span class="gc-panel-stripe-test-icon">
                    {userData.stripeCustomerId ? <CheckCircle size={18} /> : <XCircle size={18} />}
                  </span>
                  stripeCustomerId
                </div>
                <div class="gc-panel-stripe-test-item-value">
                  {userData.stripeCustomerId ? (
                    <code class="gc-panel-stripe-test-code">{userData.stripeCustomerId}</code>
                  ) : (
                    <span class="gc-panel-stripe-test-empty">—</span>
                  )}
                </div>
              </div>

              <div class="gc-panel-stripe-test-item">
                <div class="gc-panel-stripe-test-item-label">
                  <span class="gc-panel-stripe-test-icon">
                    {userData.stripeSubscriptionId ? <CheckCircle size={18} /> : <XCircle size={18} />}
                  </span>
                  stripeSubscriptionId
                </div>
                <div class="gc-panel-stripe-test-item-value">
                  {userData.stripeSubscriptionId ? (
                    <code class="gc-panel-stripe-test-code">{userData.stripeSubscriptionId}</code>
                  ) : (
                    <span class="gc-panel-stripe-test-empty">—</span>
                  )}
                </div>
              </div>

              <div class="gc-panel-stripe-test-item">
                <div class="gc-panel-stripe-test-item-label">
                  <span class="gc-panel-stripe-test-icon">
                    <CheckCircle size={18} />
                  </span>
                  plan (campo)
                </div>
                <div class={`gc-panel-stripe-test-item-value ${
                  userData.plan === "premium" ? "gc-value-success" : "gc-value-muted"
                }`}>
                  {userData.plan}
                </div>
              </div>
            </div>
          </div>

          {/* Resumo */}
          <div class="gc-panel-stripe-test-section">
            <div class="gc-panel-stripe-test-section-title">
              <span>📊</span> Resumo
            </div>
            <div class="gc-panel-stripe-test-stats">
              <div class="gc-panel-stripe-test-stat">
                <div class="gc-panel-stripe-test-stat-label">Status Geral</div>
                <div class={`gc-panel-stripe-test-stat-value ${
                  userData.isPremium ? "gc-value-success" : "gc-value-error"
                }`}>
                  {userData.isPremium ? "Premium Ativo" : "Free"}
                </div>
              </div>
              <div class="gc-panel-stripe-test-stat">
                <div class="gc-panel-stripe-test-stat-label">Stripe Configurado</div>
                <div class={`gc-panel-stripe-test-stat-value ${
                  userData.stripeCustomerId && userData.stripeSubscriptionId 
                    ? "gc-value-success" 
                    : "gc-value-warning"
                }`}>
                  {userData.stripeCustomerId && userData.stripeSubscriptionId ? "✓ Sim" : "✗ Não"}
                </div>
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
    </>
  );
}

