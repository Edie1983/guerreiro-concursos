// src/pages/Processamento/index.tsx
import { useEffect, useMemo, useState, useCallback, useRef } from "preact/hooks";
import { route } from "preact-router";
import { CheckCircle, Circle, AlertCircle } from "preact-feather";
import { processarEditalMock } from "../../mocks/processarEditalMock";
import { useEditalStore } from "../../stores/editalStore";
import { buildGcUxDecision, type GcUxDecision } from "../../gc/uxPolicy";
import { GcUxGate } from "../../components/gc/GcUxGate";
import { getGcTestDiagnosticoFromUrl } from "../../gc/dev/gcTestMode";
import { trackDecision, trackAction } from "../../gc/dev/gcTelemetry";
import { PageWrapper } from "../../components/layout/PageWrapper";
import "./style.css";

export default function Processamento() {
  const pendingUpload = useEditalStore((s) => s.pendingUpload);
  const clearPendingUpload = useEditalStore((s) => s.clearPendingUpload);
  const salvarEditalProcessado = useEditalStore((s) => s.salvarEditalProcessado);

  const [status, setStatus] = useState<
    "idle" | "extracting" | "processing" | "saving" | "error" | "awaiting_action"
  >("idle");
  const [erro, setErro] = useState<string | null>(null);
  const [uxDecision, setUxDecision] = useState<GcUxDecision | null>(null);
  const [editalProcessado, setEditalProcessado] = useState<any>(null);

  // PASSO U: Guard de execução para impedir retry duplo e corridas
  const emExecucaoRef = useRef<boolean>(false);

  const fileName = useMemo(() => pendingUpload?.fileName ?? "edital.pdf", [pendingUpload]);

  // PASSO T: Função reutilizável para processar o edital
  const executarProcessamento = useCallback(async () => {
    // PASSO U: Guard de execução - impede retry duplo e corridas
    if (emExecucaoRef.current) return;
    emExecucaoRef.current = true;

    try {
      if (!pendingUpload?.file) {
        route("/app/upload", true);
        return;
      }

      setErro(null);

      setStatus("processing");
      const edital = await processarEditalMock({ file: pendingUpload.file, fileName: pendingUpload.fileName });

      // PASSO O: Modo de teste DEV-only (querystring ?gc_test=alta|media|baixa)
      let diagnosticoParaTeste = (edital.debugInfo as any)?.diagnosticoPdf;
      const testDiag = getGcTestDiagnosticoFromUrl();
      if (testDiag) {
        diagnosticoParaTeste = testDiag;
      }

      // PASSO I: Verifica política de UX antes de salvar
      if (diagnosticoParaTeste) {
        const decision = buildGcUxDecision(diagnosticoParaTeste);
        
        if (decision) {
          // PASSO K: Intercepta apenas se BLOCK ou CONFIRM (ALTA e MÉDIA)
          // BAIXA (mode INFO) não bloqueia - será exibida em DetalhesEdital
          if (decision.mode === "BLOCK" || decision.mode === "CONFIRM") {
            // PASSO W.1: Telemetria DEV-only (apenas BLOCK/CONFIRM, INFO é rastreado em DetalhesEdital)
            trackDecision({
              decision,
              key: decision.key,
              source: "processamento",
            });

            setEditalProcessado(edital);
            setUxDecision(decision);
            setStatus("awaiting_action"); // PASSO V: Status específico para modal aguardando ação
            // PASSO U: finally libera o guard automaticamente
            return; // Não salva nem redirect - aguarda ação do usuário
          }
          // Se mode === "INFO" (BAIXA), continua normalmente (salva e redirect)
          // O banner será exibido em DetalhesEdital (telemetria será rastreada lá)
        }
      }

      // Se chegou aqui (sem decisão), salva e redirect normalmente
      setStatus("saving");
      const firestoreId = await salvarEditalProcessado(edital);
      clearPendingUpload();
      setUxDecision(null);
      setEditalProcessado(null);
      route(`/app/edital/${firestoreId}`, true);
    } catch (e: any) {
      setStatus("error");
      setErro(e?.message ? String(e.message) : "Falha ao processar o PDF.");
    } finally {
      // PASSO U: Libera guard de execução
      emExecucaoRef.current = false;
    }
  }, [pendingUpload, salvarEditalProcessado, clearPendingUpload]);

  // Handlers para ações do GcUxGate
  const handleUploadOther = () => {
    // PASSO W: Telemetria DEV-only
    trackAction({
      action: "UPLOAD_OTHER",
      mode: uxDecision?.mode,
      source: "processamento",
    });

    setUxDecision(null);
    setEditalProcessado(null);
    clearPendingUpload();
    route("/app/upload", true);
  };

  const handleRetry = async () => {
    // PASSO W: Telemetria DEV-only
    trackAction({
      action: "RETRY",
      mode: uxDecision?.mode,
      source: "processamento",
    });

    // PASSO U: Guard já impede execução simultânea, mas transformamos em async para clareza
    // PASSO T: Limpa estados e reexecuta processamento in-place (sem reload)
    setUxDecision(null);
    setEditalProcessado(null);
    setErro(null);
    await executarProcessamento();
  };

  const handleContinue = async () => {
    // PASSO W: Telemetria DEV-only
    trackAction({
      action: "CONTINUE",
      mode: uxDecision?.mode,
      source: "processamento",
    });

    if (editalProcessado) {
      // Salva e redirect
      setStatus("saving");
      try {
        const firestoreId = await salvarEditalProcessado(editalProcessado);
        clearPendingUpload();
        setUxDecision(null);
        setEditalProcessado(null);
        route(`/app/edital/${firestoreId}`, true);
      } catch (error: any) {
        setStatus("error");
        setErro(error?.message || "Erro ao salvar edital");
      }
    } else {
      // Se não tem edital processado, apenas fecha o modal/banner
      setUxDecision(null);
    }
  };

  // PASSO T: Executa processamento ao montar componente (substitui useEffect inline)
  useEffect(() => {
    executarProcessamento();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusLabels = {
    idle: "Iniciando...",
    extracting: "Extraindo texto...",
    processing: "Analisando conteúdo...",
    saving: "Salvando no app...",
    error: "Erro",
    awaiting_action: "Aguardando sua ação...",
  };

  return (
    <PageWrapper
      title="Processando seu edital"
      subtitle={`Arquivo: ${fileName} • ${statusLabels[status]}`}
    >
      <div class="gc-processamento-page">
        {/* GcUxGate - Modal/Banner conforme política de UX (PASSO I) */}
      {uxDecision && (() => {
        // PASSO V: isBusy quando está processando ou salvando
        const isBusy = status === "processing" || status === "saving";
        
        // PASSO M: Props específicas por mode (união discriminada)
        if (uxDecision.mode === "BLOCK") {
          return (
            <GcUxGate
              decision={uxDecision as GcUxDecision & { mode: "BLOCK" }}
              isBusy={isBusy}
              onUploadOther={handleUploadOther}
              onRetry={handleRetry}
            />
          );
        } else if (uxDecision.mode === "CONFIRM") {
          return (
            <GcUxGate
              decision={uxDecision as GcUxDecision & { mode: "CONFIRM" }}
              isBusy={isBusy}
              onContinue={handleContinue}
              onUploadOther={handleUploadOther}
            />
          );
        }
        return null; // INFO não deve aparecer aqui (PASSO K)
      })()}

      {/* Main Content */}
      <div class="gc-content animate-slide-up">
        <div class="gc-card gc-process-card">
          {/* Steps */}
          <div class="gc-steps">
            <Step done={status !== "idle"} current={status === "idle"} label="Iniciar processamento" />
            <Step
              done={status === "saving" || status === "error"}
              current={status === "processing"}
              label="Processar PDF"
            />
            <Step
              done={status === "error" ? false : status === "saving"}
              current={status === "saving"}
              label="Salvar no sistema"
            />
          </div>

          {/* Error State */}
          {status === "error" && (
            <div class="gc-error-section">
              <div class="gc-error-message">
                <AlertCircle size={20} />
                <div>
                  <div class="gc-error-title">Erro no processamento</div>
                  <div class="gc-error-text">{erro ?? "Erro desconhecido."}</div>
                </div>
              </div>
              <button class="gc-btn-primary" onClick={() => route("/app/upload", true)}>
                Voltar para Upload
              </button>
            </div>
          )}

          {/* Info */}
          {status !== "error" && (
            <div class="gc-info-note">
              <div class="gc-info-text">
                Dica: se esse PDF for "escaneado" (imagem), ele pode vir sem texto. Aí precisa OCR (depois a gente faz).
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </PageWrapper>
  );
}

function Step(props: { done: boolean; current: boolean; label: string }) {
  return (
    <div class="gc-step">
      <div class={`gc-step-icon ${props.done ? "done" : props.current ? "current" : "pending"}`}>
        {props.done ? <CheckCircle size={18} /> : <Circle size={18} />}
      </div>
      <div class={`gc-step-label ${props.done ? "done" : props.current ? "current" : "pending"}`}>
        {props.label}
      </div>
    </div>
  );
}
