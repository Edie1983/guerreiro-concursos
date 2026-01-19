// src/components/gc/GcUxGate.tsx
// Componente UI para exibir modais/banners conforme política de UX (PASSO I)

import { useState } from "preact/hooks";
import type { GcUxDecision, GcUxAction } from "../../gc/uxPolicy";
import "./GcUxGate.css";

// PASSO M: União discriminada baseada em decision.mode
// PASSO V: isBusy opcional para desabilitar botões durante processamento/salvamento
type GateBase = { decision: GcUxDecision; isBusy?: boolean };
type GateInfo = GateBase & {
  decision: GcUxDecision & { mode: "INFO" };
  onDismiss?: () => void;
};
type GateBlock = GateBase & {
  decision: GcUxDecision & { mode: "BLOCK" };
  onUploadOther: () => void;
  onRetry: () => void;
};
type GateConfirm = GateBase & {
  decision: GcUxDecision & { mode: "CONFIRM" };
  onContinue: () => void;
  onUploadOther: () => void;
};

export type Props = GateInfo | GateBlock | GateConfirm;

export function GcUxGate(props: Props) {
  const { decision, isBusy = false } = props;
  const [dismissed, setDismissed] = useState(false);

  // Se foi dispensado, não renderiza
  if (dismissed) return null;

  // PASSO M: Mode INFO: Banner leve com CTA único (onDismiss)
  if (decision.mode === "INFO") {
    const { onDismiss } = props as GateInfo;
    const handleDismiss = () => {
      if (isBusy) return; // PASSO V: Impede ação durante processamento
      setDismissed(true);
      if (onDismiss) {
        onDismiss();
      }
    };

    return (
      <div class="gc-ux-gate-banner">
        <div class="gc-ux-gate-banner-content">
          <div class="gc-ux-gate-banner-icon">ℹ️</div>
          <div class="gc-ux-gate-banner-text">
            <div class="gc-ux-gate-banner-title">{decision.title}</div>
            <div class="gc-ux-gate-banner-message">{decision.message}</div>
          </div>
          <button class="gc-ux-gate-banner-close" disabled={isBusy} onClick={handleDismiss}>
            {decision.primary.label}
          </button>
        </div>
      </div>
    );
  }

  // PASSO M: Mode BLOCK: Modal bloqueante
  if (decision.mode === "BLOCK") {
    const { onUploadOther, onRetry } = props as GateBlock;
    const handleAction = (action: GcUxAction) => {
      if (isBusy) return; // PASSO V: Impede ação durante processamento
      if (action === "UPLOAD_OTHER") {
        onUploadOther();
      } else if (action === "RETRY") {
        onRetry();
      }
    };

    return (
      <div class="gc-ux-gate-overlay">
        <div class="gc-ux-gate-modal">
          <div class="gc-ux-gate-modal-header">
            <div class={`gc-ux-gate-modal-icon gc-ux-gate-modal-icon-${decision.severity.toLowerCase()}`}>
              {decision.severity === "ALTA" ? "❌" : "⚠️"}
            </div>
            <div class="gc-ux-gate-modal-title">{decision.title}</div>
          </div>

          <div class="gc-ux-gate-modal-body">
            <div class="gc-ux-gate-modal-message">{decision.message}</div>

            {/* Outros alertas (máximo 2) */}
            {decision.otherAlerts && decision.otherAlerts.length > 0 && (
              <div class="gc-ux-gate-modal-other-alerts">
                <div class="gc-ux-gate-modal-other-alerts-title">Outros alertas:</div>
                {decision.otherAlerts.map((alert, idx) => (
                  <div key={idx} class="gc-ux-gate-modal-other-alert-item">
                    <strong>{alert.title}:</strong> {alert.message}
                  </div>
                ))}
              </div>
            )}

            {/* Dicas para ALTA */}
            <div class="gc-ux-gate-modal-tips">
              <div class="gc-ux-gate-modal-tips-title">Como resolver:</div>
              <ul class="gc-ux-gate-modal-tips-list">
                <li>Prefira "PDF com texto selecionável".</li>
                <li>Se tiver, baixe uma versão "Digital" no site da banca.</li>
                <li>Evite foto/scan e arquivos muito comprimidos.</li>
              </ul>
            </div>
          </div>

          <div class="gc-ux-gate-modal-actions">
            <button
              class="gc-ux-gate-modal-btn gc-ux-gate-modal-btn-primary"
              disabled={isBusy}
              onClick={() => handleAction(decision.primary.action)}
            >
              {decision.primary.label}
            </button>
            {decision.secondary && (
              <button
                class="gc-ux-gate-modal-btn gc-ux-gate-modal-btn-secondary"
                disabled={isBusy}
                onClick={() => handleAction(decision.secondary!.action)}
              >
                {decision.secondary.label}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // PASSO M: Mode CONFIRM: Modal de confirmação
  const { onContinue, onUploadOther } = props as GateConfirm;
  const handleAction = (action: GcUxAction) => {
    if (isBusy) return; // PASSO V: Impede ação durante processamento
    if (action === "UPLOAD_OTHER") {
      onUploadOther();
    } else {
      onContinue();
    }
  };

  return (
    <div class="gc-ux-gate-overlay">
      <div class="gc-ux-gate-modal">
        <div class="gc-ux-gate-modal-header">
          <div class={`gc-ux-gate-modal-icon gc-ux-gate-modal-icon-${decision.severity.toLowerCase()}`}>
            {decision.severity === "ALTA" ? "❌" : "⚠️"}
          </div>
          <div class="gc-ux-gate-modal-title">{decision.title}</div>
        </div>

        <div class="gc-ux-gate-modal-body">
          <div class="gc-ux-gate-modal-message">{decision.message}</div>

          {/* Outros alertas (máximo 2) */}
          {decision.otherAlerts && decision.otherAlerts.length > 0 && (
            <div class="gc-ux-gate-modal-other-alerts">
              <div class="gc-ux-gate-modal-other-alerts-title">Outros alertas:</div>
              {decision.otherAlerts.map((alert, idx) => (
                <div key={idx} class="gc-ux-gate-modal-other-alert-item">
                  <strong>{alert.title}:</strong> {alert.message}
                </div>
              ))}
            </div>
          )}
        </div>

        <div class="gc-ux-gate-modal-actions">
            <button
              class="gc-ux-gate-modal-btn gc-ux-gate-modal-btn-primary"
              disabled={isBusy}
              onClick={() => handleAction(decision.primary.action)}
            >
              {decision.primary.label}
            </button>
            {decision.secondary && (
              <button
                class="gc-ux-gate-modal-btn gc-ux-gate-modal-btn-secondary"
                disabled={isBusy}
                onClick={() => handleAction(decision.secondary!.action)}
              >
                {decision.secondary.label}
              </button>
            )}
        </div>
      </div>
    </div>
  );
}

