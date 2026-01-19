// src/pages/DetalhesEdital/index.tsx
import type { ComponentChildren } from "preact";
import { route } from "preact-router";
import { useMemo, useState, useEffect } from "preact/hooks";
import { ArrowLeft, Upload, Map, BookOpen, FileText, ChevronDown, Lock } from "preact-feather";
import { useEditalStore } from "../../stores/editalStore";
import { useAuth } from "../../contexts/AuthContext";
import { PanelDiagnosticoPdf } from "../../components/dev/PanelDiagnosticoPdf";
import { PanelTelemetryGc } from "../../components/dev/PanelTelemetryGc";
import { buildGcUxDecision, type GcUxDecision } from "../../gc/uxPolicy";
import { GcUxGate } from "../../components/gc/GcUxGate";
import { trackDecision, trackAction } from "../../gc/dev/gcTelemetry";
import { PageWrapper } from "../../components/layout/PageWrapper";
import "./style.css";

type Props = {
  id?: string;
};

export default function DetalhesEdital(props: Props) {
  const id = props.id ?? "";
  const { user, isPremium } = useAuth();
  const getEditalById = useEditalStore((s) => s.getEditalById);
  const getEditalByIdAsync = useEditalStore((s) => s.getEditalByIdAsync);
  const loading = useEditalStore((s) => s.loading);
  const [editalLocal, setEditalLocal] = useState<any>(null);
  const [loadingEdital, setLoadingEdital] = useState(false);

  // Tenta cache local primeiro
  const editalCache = useMemo(() => (id ? getEditalById(id) : null), [id, getEditalById]);

  // Se não encontrou no cache e tem user, carrega do Firestore
  useEffect(() => {
    if (id && user && !editalCache && !loadingEdital && !editalLocal) {
      setLoadingEdital(true);
      getEditalByIdAsync(user.uid, id)
        .then((edital) => {
          if (edital) {
            setEditalLocal(edital);
          }
        })
        .catch((error) => {
          console.error("Erro ao carregar edital:", error);
        })
        .finally(() => {
          setLoadingEdital(false);
        });
    }
  }, [id, user, editalCache, loadingEdital, editalLocal, getEditalByIdAsync]);

  const edital = editalCache || editalLocal;

  // PASSO K: Banner INFO (severidade BAIXA) - não bloqueia, apenas informa
  const uxDecisionInfo = useMemo<GcUxDecision | null>(() => {
    if (!edital?.debugInfo?.diagnosticoPdf) return null;
    const decision = buildGcUxDecision(edital.debugInfo.diagnosticoPdf);
    // Renderiza apenas se mode === "INFO" (BAIXA)
    return decision && decision.mode === "INFO" ? decision : null;
  }, [edital?.debugInfo?.diagnosticoPdf]);

  // PASSO N: Banner INFO aparece apenas UMA vez por edital (sessionStorage)
  const storageKey = `gc:uxinfo:dismissed:${id}`;
  const [dismissedInfo, setDismissedInfo] = useState<boolean>(() => {
    // SSR-safe: só acessa sessionStorage no cliente
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(storageKey) === "1";
  });

  // PASSO W.1: Telemetria DEV-only (conta apenas quando for renderizar, INFO só é rastreado aqui)
  useEffect(() => {
    if (uxDecisionInfo && !dismissedInfo) {
      trackDecision({
        decision: uxDecisionInfo,
        key: uxDecisionInfo.key,
        source: "detalhes",
      });
    }
  }, [uxDecisionInfo, dismissedInfo]);

  const handleInfoDismiss = () => {
    // PASSO W: Telemetria DEV-only
    trackAction({
      action: "DISMISS",
      mode: "INFO",
      source: "detalhes",
    });

    setDismissedInfo(true);
    // PASSO N: Registrar no sessionStorage para não mostrar novamente nesta sessão
    if (typeof window !== "undefined") {
      sessionStorage.setItem(storageKey, "1");
    }
  };

  if (!id) {
    return (
      <PageWrapper title="Detalhes do Edital" subtitle="Visão geral do concurso">
        <EmptyState
          title="ID do edital não veio na rota"
          desc="Volte e processe um edital novamente."
          primaryLabel="Ir para Upload"
          onPrimary={() => route("/app/upload", true)}
        />
      </PageWrapper>
    );
  }

  if (loadingEdital || loading) {
    return (
      <PageWrapper title="Detalhes do Edital" subtitle="Visão geral do concurso">
        <EmptyState
          title="Carregando..."
          desc="Buscando informações do edital..."
          primaryLabel="Aguardando..."
          onPrimary={() => {}}
        />
      </PageWrapper>
    );
  }

  if (!edital) {
    return (
      <PageWrapper title="Detalhes do Edital" subtitle="Visão geral do concurso">
        <EmptyState
          title="Edital não encontrado"
          desc="Esse edital não foi encontrado. Pode ter sido deletado ou você não tem permissão para acessá-lo."
          primaryLabel="Ir para Upload"
          onPrimary={() => route("/app/upload", true)}
          secondaryLabel="Voltar"
          onSecondary={() => route("/app/", true)}
        />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title={edital.titulo}
      subtitle={`Criado em: ${new Date(edital.criadoEmISO).toLocaleString()}`}
    >
      <div class="gc-detalhes-page">
        {/* PASSO K: Banner INFO (BAIXA) - não bloqueia, apenas informa */}
        {uxDecisionInfo && !dismissedInfo && uxDecisionInfo.mode === "INFO" && (
          <GcUxGate decision={uxDecisionInfo as GcUxDecision & { mode: "INFO" }} onDismiss={handleInfoDismiss} />
        )}

        {/* Main Content */}
        <div class="gc-content animate-slide-up">
        {/* Info Cards */}
        <div class="gc-info-grid">
          <div class="gc-card gc-info-card">
            <div class="gc-info-label">Órgão</div>
            <div class="gc-info-value">{edital.orgao}</div>
          </div>
          <div class="gc-card gc-info-card">
            <div class="gc-info-label">Banca</div>
            <div class="gc-info-value">{edital.banca}</div>
          </div>
          <div class="gc-card gc-info-card">
            <div class="gc-info-label">Cargo</div>
            <div class="gc-info-value">{edital.cargo}</div>
          </div>
        </div>

        {/* Disciplinas */}
        <div class="gc-card gc-disciplinas-card">
          <div class="gc-section-header">
            <div class="gc-section-title">Disciplinas e Conteúdos</div>
            <div class="gc-section-subtitle">
              Processado automaticamente (mock por enquanto)
            </div>
          </div>

          <div class="gc-disciplinas-list">
            {edital.disciplinas.map((d: { nome: string; conteudos: string[] }) => (
              <div key={d.nome} class="gc-disciplina-item">
                <div class="gc-disciplina-header">
                  <div class="gc-disciplina-name">{d.nome}</div>
                  <div class="gc-disciplina-count">{d.conteudos.length} tópico(s)</div>
                </div>

                <div class="gc-conteudos-grid">
                  {d.conteudos.map((c: string) => (
                    <div key={c} class="gc-conteudo-tag">
                      {c}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Cards */}
        <div class="gc-actions-grid">
          <ActionCard
            icon={<Map size={24} />}
            title="Mapa Tático"
            desc="Quebra por disciplinas, peso e prioridade"
            label="Abrir Mapa Tático"
            onClick={() => route(`/app/edital/${id}/mapa`, true)}
            isPremium={true}
            isUserPremium={isPremium}
          />
          <ActionCard
            icon={<BookOpen size={24} />}
            title="Flashcards"
            desc="Gerar e revisar cards por conteúdo"
            label="Abrir Flashcards"
            onClick={() => alert("Flashcards: vamos ligar essa rota no próximo passo.")}
            isPremium={true}
            isUserPremium={isPremium}
          />
          <ActionCard
            icon={<FileText size={24} />}
            title="Questões"
            desc="Treino de questões por tópico e desempenho"
            label="Abrir Questões"
            onClick={() => alert("Questões: vamos ligar essa rota no próximo passo.")}
            isPremium={true}
            isUserPremium={isPremium}
          />
        </div>

        {/* Debug Panel (apenas em dev) */}
        {typeof window !== "undefined" && import.meta.env.DEV && edital.debugInfo && (
          <div class="gc-card gc-debug-panel">
            <div class="gc-debug-title">Painel Debug Parser</div>
            <div class="gc-debug-grid">
              <div class="gc-debug-item">
                <div class="gc-debug-label">ANEXO II encontrado</div>
                <div class={`gc-debug-value ${edital.debugInfo.anexoEncontrado ? "success" : "error"}`}>
                  {edital.debugInfo.anexoEncontrado ? "✓ Sim" : "✗ Não"}
                </div>
              </div>
              {edital.debugInfo.anexoEncontrado && (
                <>
                  <div class="gc-debug-item">
                    <div class="gc-debug-label">ANEXO II tamanho</div>
                    <div class="gc-debug-value">{edital.debugInfo.anexoChars.toLocaleString()} chars</div>
                  </div>
                  <div class="gc-debug-item">
                    <div class="gc-debug-label">ANEXO II índices</div>
                    <div class="gc-debug-value">
                      [{edital.debugInfo.anexoStart}, {edital.debugInfo.anexoEnd}]
                    </div>
                  </div>
                  {edital.debugInfo.anexoSnippet && (
                    <div class="gc-debug-item gc-debug-item-full">
                      <div class="gc-debug-label">ANEXO II snippet (início)</div>
                      <div class="gc-debug-snippet">{edital.debugInfo.anexoSnippet}...</div>
                    </div>
                  )}
                </>
              )}
              <div class="gc-debug-item">
                <div class="gc-debug-label">Disciplinas detectadas</div>
                <div class="gc-debug-value">{edital.debugInfo.disciplinasDetectadas}</div>
              </div>
              <div class="gc-debug-item gc-debug-item-full">
                <div class="gc-debug-label">Disciplinas oficiais (Quadro 1)</div>
                <div class="gc-debug-list">
                  {edital.debugInfo.disciplinasOficiais && edital.debugInfo.disciplinasOficiais.length > 0 ? (
                    edital.debugInfo.disciplinasOficiais.map((nome: string) => (
                      <div key={nome} class="gc-debug-tag gc-debug-tag-official">
                        {nome}
                      </div>
                    ))
                  ) : (
                    <div class="gc-debug-empty">Nenhuma disciplina oficial encontrada</div>
                  )}
                </div>
              </div>
              <div class="gc-debug-item gc-debug-item-full">
                <div class="gc-debug-label">Nomes das disciplinas detectadas</div>
                <div class="gc-debug-list">
                  {edital.debugInfo.nomesDisciplinas && edital.debugInfo.nomesDisciplinas.length > 0 ? (
                    edital.debugInfo.nomesDisciplinas.map((nome: string) => (
                      <div key={nome} class="gc-debug-tag">
                        {nome}
                      </div>
                    ))
                  ) : (
                    <div class="gc-debug-empty">Nenhuma disciplina detectada</div>
                  )}
                </div>
              </div>
              {edital.debugInfo.porDisciplina && edital.debugInfo.porDisciplina.length > 0 && (
                <div class="gc-debug-item gc-debug-item-full">
                  <div class="gc-debug-label">Detalhes por disciplina</div>
                  {/* Alerta para disciplinas faltantes */}
                  {edital.debugInfo.porDisciplina.some((info: { encontrou: boolean }) => !info.encontrou) && (
                    <div class="gc-debug-alert">
                      <div class="gc-debug-alert-title">⚠ Disciplinas não encontradas:</div>
                      <div class="gc-debug-alert-list">
                        {edital.debugInfo.porDisciplina
                          .filter((info: { encontrou: boolean }) => !info.encontrou)
                          .map((info: { nome: string; motivoFalha?: string }) => (
                            <div key={info.nome} class="gc-debug-alert-item">
                              <strong>FALTA: {info.nome}</strong>
                              {info.motivoFalha && <span> — {info.motivoFalha}</span>}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                  <div class="gc-debug-table">
                    <div class="gc-debug-table-header">
                      <div class="gc-debug-table-cell">Disciplina</div>
                      <div class="gc-debug-table-cell">Encontrou</div>
                      <div class="gc-debug-table-cell">Índices</div>
                      <div class="gc-debug-table-cell">Chars</div>
                      <div class="gc-debug-table-cell">Tópicos</div>
                    </div>
                    {edital.debugInfo.porDisciplina.map((info: {
                      nome: string;
                      encontrou: boolean;
                      inicio: number;
                      fim: number;
                      chars: number;
                      topicos: number;
                    }) => (
                      <div key={info.nome} class="gc-debug-table-row">
                        <div class="gc-debug-table-cell">{info.nome}</div>
                        <div class={`gc-debug-table-cell ${info.encontrou ? "success" : "error"}`}>
                          {info.encontrou ? "✓" : "✗"}
                        </div>
                        <div class="gc-debug-table-cell">
                          {info.encontrou ? `[${info.inicio}, ${info.fim}]` : "—"}
                        </div>
                        <div class="gc-debug-table-cell">{info.chars.toLocaleString()}</div>
                        <div class="gc-debug-table-cell">{info.topicos}</div>
                      </div>
                    ))}
                  </div>
                  {edital.debugInfo.porDisciplina.some((info: { motivoFalha?: string }) => info.motivoFalha) && (
                    <div class="gc-debug-failures">
                      <div class="gc-debug-label">Motivos de falha:</div>
                      {edital.debugInfo.porDisciplina
                        .filter((info: { motivoFalha?: string }) => info.motivoFalha)
                        .map((info: { nome: string; motivoFalha: string }) => (
                          <div key={info.nome} class="gc-debug-failure-item">
                            <strong>{info.nome}:</strong> {info.motivoFalha}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Painel Diagnóstico PDF (PASSO G - DEV-only) */}
        {typeof window !== "undefined" && import.meta.env.DEV && edital.debugInfo?.diagnosticoPdf && (
          <div class="gc-card">
            <PanelDiagnosticoPdf diagnostico={edital.debugInfo.diagnosticoPdf} />
          </div>
        )}

        {/* Painel Telemetria GC (PASSO X - DEV-only) */}
        {import.meta.env.DEV && (
          <div class="gc-card">
            <PanelTelemetryGc />
          </div>
        )}

        {/* Debug Text - apenas se textoBruto estiver disponível (não persistido) */}
        {edital.textoBruto && (
          <details class="gc-card gc-debug-section">
            <summary class="gc-debug-summary">
              <FileText size={18} />
              <span>Ver texto bruto extraído (debug)</span>
              <ChevronDown size={18} class="gc-chevron" />
            </summary>
            <pre class="gc-debug-text">
              {edital.textoBruto.slice(0, 12000)}
              {edital.textoBruto.length > 12000 ? "\n\n... (cortado)" : ""}
            </pre>
          </details>
        )}
      </div>
    </div>
    </PageWrapper>
  );
}

function Shell(props: { title: string; children: ComponentChildren }) {
  return (
    <div class="gc-detalhes-page">
      <div class="gc-topbar">
        <div class="gc-topbar-left">
          <div class="gc-titleblock">
            <div class="gc-title">{props.title}</div>
          </div>
        </div>
      </div>
      <div class="gc-content">{props.children}</div>
    </div>
  );
}

function EmptyState(props: {
  title: string;
  desc: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  return (
    <div class="gc-card gc-empty-state">
      <div class="gc-empty-title">{props.title}</div>
      <div class="gc-empty-desc">{props.desc}</div>
      <div class="gc-empty-actions">
        <button class="gc-btn-primary" onClick={props.onPrimary}>
          {props.primaryLabel}
        </button>
        {props.secondaryLabel && props.onSecondary && (
          <button class="gc-btn-secondary" onClick={props.onSecondary}>
            {props.secondaryLabel}
          </button>
        )}
      </div>
    </div>
  );
}

function ActionCard(props: {
  icon: ComponentChildren;
  title: string;
  desc: string;
  label: string;
  onClick: () => void;
  isPremium?: boolean;
  isUserPremium?: boolean;
}) {
  const isLocked = props.isPremium && !props.isUserPremium;
  
  return (
    <div 
      class={`gc-card gc-action-card ${isLocked ? "gc-action-card-locked" : ""}`}
      title={isLocked ? "Recurso exclusivo para assinantes Premium" : undefined}
    >
      <div class="gc-action-icon">
        {props.icon}
        {isLocked && (
          <div class="gc-action-lock-overlay">
            <Lock size={16} />
          </div>
        )}
      </div>
      <div class="gc-action-title">
        {props.title}
        {isLocked && <Lock size={14} class="gc-action-title-lock" />}
      </div>
      <div class="gc-action-desc">{props.desc}</div>
      <button 
        class={`gc-action-btn ${isLocked ? "gc-action-btn-locked" : ""}`} 
        onClick={props.onClick}
        title={isLocked ? "Recurso exclusivo para assinantes Premium" : undefined}
      >
        {isLocked ? (
          <>
            <Lock size={14} />
            Premium
          </>
        ) : (
          props.label
        )}
      </button>
    </div>
  );
}
