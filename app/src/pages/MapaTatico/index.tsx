// src/pages/MapaTatico/index.tsx
// Mapa Tático Canônico - Fase A
import { useMemo, useEffect, useRef } from "preact/hooks";
import { route } from "preact-router";
import { ArrowLeft, Calendar } from "preact-feather";
import { useEditalStore } from "../../stores/editalStore";
import { useAuth } from "../../contexts/AuthContext";
import { PremiumGate } from "../../components/auth/PremiumGate";
import { gerarMapaTatico } from "../../lib/mapaTatico/gerarMapaTatico";
import { incrementDisciplinasVistas } from "../../services/userService";
import { triggerMapaTaticoAberto } from "../../services/gamificacaoService";
import { PageWrapper } from "../../components/layout/PageWrapper";
import "../DetalhesEdital/style.css";
import "./style.css";

type Props = {
  id?: string;
};

export default function MapaTatico(props: Props) {
  const id = props.id ?? "";
  const { isPremium, loadingPlan, user } = useAuth();
  const getEditalById = useEditalStore((s) => s.getEditalById);
  const hasIncremented = useRef(false);

  const edital = useMemo(() => (id ? getEditalById(id) : null), [id, getEditalById]);

  // Gera o mapa tático se o edital existir
  const mapaTatico = useMemo(() => {
    if (!edital) return null;
    const mapa = gerarMapaTatico(edital);

    // Log DEV-only resumido (bateria de regressão)
    if (typeof window !== "undefined" && import.meta.env.DEV) {
      const top5 = mapa.disciplinas.slice(0, 5).map((d) => ({
        rank: d.rank,
        nome: d.nome,
        score: d.scorePrioridade.toFixed(1),
        questoes: d.questoes ?? "—",
        chars: d.totalChars,
      }));

      console.log(`[MapaTatico] Resumo Fase C:`, {
        metodoPeso: mapa.metodoPeso,
        totalQuestoesQuadro1: edital.totalQuestoesQuadro1 ?? "—",
        totalQuestoesEfetivo: mapa.totalQuestoes ?? "—",
        top5,
      });
    }

    return mapa;
  }, [edital]);

  // Incrementa disciplinasVistas quando o mapa é carregado (apenas uma vez por carregamento)
  useEffect(() => {
    if (mapaTatico && user && !hasIncremented.current && mapaTatico.totalDisciplinas > 0) {
      hasIncremented.current = true;
      incrementDisciplinasVistas(user.uid).catch((error) => {
        console.error("[GC/MapaTatico] Erro ao incrementar disciplinasVistas:", error);
      });
      // Trigger: Mapa Tático aberto (pontos + medalhas)
      triggerMapaTaticoAberto(user.uid).catch((error) => {
        console.error("[GC/MapaTatico] Erro ao conceder pontos:", error);
      });
    }
  }, [mapaTatico, user]);

  // Estados de erro
  if (!id) {
    return (
      <PageWrapper title="Mapa Tático" subtitle="Análise de prioridades">
        <EmptyState
          title="ID do edital não veio na rota"
          desc="Volte e processe um edital novamente."
          primaryLabel="Ir para Upload"
          onPrimary={() => route("/app/upload", true)}
        />
      </PageWrapper>
    );
  }

  if (!edital) {
    return (
      <PageWrapper title="Mapa Tático" subtitle="Análise de prioridades">
        <EmptyState
          title="Edital não encontrado"
          desc="Esse edital não está no store. Pode ter sido um refresh na página (o store é em memória)."
          primaryLabel="Ir para Upload"
          onPrimary={() => route("/app/upload", true)}
          secondaryLabel="Voltar"
          onSecondary={() => route("/app/", true)}
        />
      </PageWrapper>
    );
  }

  if (!mapaTatico || mapaTatico.totalDisciplinas === 0) {
    return (
      <PageWrapper title="Mapa Tático" subtitle="Análise de prioridades">
        <EmptyState
          title="Mapa Tático vazio"
          desc="Este edital não possui disciplinas processadas. Verifique se o parser encontrou conteúdo."
          primaryLabel="Voltar ao Edital"
          onPrimary={() => route(`/app/edital/${id}`, true)}
          secondaryLabel="Ir para Home"
          onSecondary={() => route("/app/", true)}
        />
      </PageWrapper>
    );
  }

  // Função para obter a classe CSS da prioridade
  const getPrioridadeClass = (prioridade: "ALTA" | "MEDIA" | "BAIXA") => {
    switch (prioridade) {
      case "ALTA":
        return "gc-prioridade-alta";
      case "MEDIA":
        return "gc-prioridade-media";
      case "BAIXA":
        return "gc-prioridade-baixa";
    }
  };

  // Mostra teaser se não for premium
  if (!isPremium && !loadingPlan) {
    const topDisciplinas = mapaTatico?.disciplinas.slice(0, Math.ceil(mapaTatico.disciplinas.length * 0.1)) || [];
    
    return (
      <PageWrapper
        title="Mapa Tático"
        subtitle={edital.titulo}
      >
        <div class="gc-content animate-slide-up">
          <div class="gc-card gc-mapa-tatico-card">
            <div class="gc-section-header">
              <div class="gc-section-title">Análise por Disciplina (Prévia - 10%)</div>
              <div class="gc-section-subtitle">Desbloqueie o Premium para ver o mapa completo</div>
            </div>
            
            <div class="gc-mapa-tatico-table">
              <div class="gc-mapa-tatico-table-header">
                <div class="gc-mapa-tatico-cell gc-mapa-tatico-cell-disciplina">Disciplina</div>
                <div class="gc-mapa-tatico-cell gc-mapa-tatico-cell-numerico gc-mapa-tatico-cell-rank">Rank</div>
                {mapaTatico.metodoPeso === "questoes" && (
                  <div class="gc-mapa-tatico-cell gc-mapa-tatico-cell-numerico">Questões</div>
                )}
                <div class="gc-mapa-tatico-cell gc-mapa-tatico-cell-numerico">Tópicos</div>
                <div class="gc-mapa-tatico-cell gc-mapa-tatico-cell-numerico">Peso (%)</div>
                <div class="gc-mapa-tatico-cell gc-mapa-tatico-cell-prioridade">Prioridade</div>
              </div>
              
              {topDisciplinas.map((disciplina) => (
                <div key={disciplina.nome} class="gc-mapa-tatico-table-row">
                  <div class="gc-mapa-tatico-cell gc-mapa-tatico-cell-disciplina">{disciplina.nome}</div>
                  <div class="gc-mapa-tatico-cell gc-mapa-tatico-cell-numerico gc-mapa-tatico-cell-rank">
                    <span class="gc-rank-badge">#{disciplina.rank}</span>
                  </div>
                  {mapaTatico.metodoPeso === "questoes" && (
                    <div class="gc-mapa-tatico-cell gc-mapa-tatico-cell-numerico">
                      {disciplina.questoes !== undefined ? disciplina.questoes : "—"}
                    </div>
                  )}
                  <div class="gc-mapa-tatico-cell gc-mapa-tatico-cell-numerico">
                    {disciplina.totalTopicos.toLocaleString()}
                  </div>
                  <div class="gc-mapa-tatico-cell gc-mapa-tatico-cell-numerico">
                    {disciplina.pesoRelativo.toFixed(2)}%
                  </div>
                  <div class="gc-mapa-tatico-cell gc-mapa-tatico-cell-prioridade">
                    <span class={`gc-prioridade-badge ${getPrioridadeClass(disciplina.prioridade)}`}>
                      {disciplina.prioridade}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Premium Gate */}
        <PremiumGate featureName="Mapa Tático" />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Mapa Tático"
      subtitle={edital.titulo}
    >
      <PremiumGate featureName="Mapa Tático">
        <div class="gc-detalhes-page">
          {/* Main Content */}
          <div class="gc-content animate-slide-up">
        {/* Badge Método de Peso */}
        <div class="gc-card gc-metodo-peso-badge">
          <div class="gc-metodo-peso-label">Método de peso:</div>
          <div class={`gc-metodo-peso-value ${mapaTatico.metodoPeso === "questoes" ? "gc-metodo-questoes" : "gc-metodo-chars"}`}>
            {mapaTatico.metodoPeso === "questoes"
              ? "Quadro 1 (questões)"
              : "Conteúdo (chars)"}
          </div>
          {edital.debugInfo?.quadro1Aviso && mapaTatico.metodoPeso === "chars" && (
            <div class="gc-metodo-peso-aviso">{edital.debugInfo.quadro1Aviso}</div>
          )}
          {/* Validações de sanidade (DEV-only) */}
          {typeof window !== "undefined" && import.meta.env.DEV && mapaTatico.validacao && (
            <>
              {mapaTatico.validacao.alinhamentoQuadro1 && (
                <div class="gc-metodo-peso-aviso gc-validacao-aviso">
                  ⚠️ {mapaTatico.validacao.alinhamentoQuadro1.aviso}
                </div>
              )}
              {mapaTatico.validacao.totalQuestoesDiscrepancia && (
                <div class="gc-metodo-peso-aviso gc-validacao-aviso">
                  ⚠️ {mapaTatico.validacao.totalQuestoesDiscrepancia.aviso}
                </div>
              )}
            </>
          )}
        </div>

        {/* Estatísticas Gerais */}
        <div class="gc-info-grid">
          <div class="gc-card gc-info-card">
            <div class="gc-info-label">Total de Disciplinas</div>
            <div class="gc-info-value">{mapaTatico.totalDisciplinas}</div>
          </div>
          <div class="gc-card gc-info-card">
            <div class="gc-info-label">Total de Tópicos</div>
            <div class="gc-info-value">{mapaTatico.totalTopicos.toLocaleString()}</div>
          </div>
          <div class="gc-card gc-info-card">
            <div class="gc-info-label">Total de Caracteres</div>
            <div class="gc-info-value">{mapaTatico.totalChars.toLocaleString()}</div>
          </div>
          <div class="gc-card gc-info-card">
            <div class="gc-info-label">Total de Questões (Quadro 1)</div>
            <div class="gc-info-value">
              {mapaTatico.totalQuestoes !== undefined
                ? mapaTatico.totalQuestoes.toLocaleString()
                : "—"}
            </div>
          </div>
        </div>

        {/* Tabela de Disciplinas */}
        <div class="gc-card gc-mapa-tatico-card">
          <div class="gc-section-header">
            <div class="gc-section-title">Análise por Disciplina</div>
            <div class="gc-section-subtitle">
              Prioridade baseada no peso relativo{" "}
              {mapaTatico.metodoPeso === "questoes" ? "(questões)" : "(conteúdo)"}
            </div>
          </div>

          <div class="gc-mapa-tatico-table">
            <div class="gc-mapa-tatico-table-header">
              <div class="gc-mapa-tatico-cell gc-mapa-tatico-cell-disciplina">Disciplina</div>
              <div class="gc-mapa-tatico-cell gc-mapa-tatico-cell-numerico gc-mapa-tatico-cell-rank">
                Rank
              </div>
              {mapaTatico.metodoPeso === "questoes" && (
                <div class="gc-mapa-tatico-cell gc-mapa-tatico-cell-numerico">Questões</div>
              )}
              <div class="gc-mapa-tatico-cell gc-mapa-tatico-cell-numerico">Tópicos</div>
              <div class="gc-mapa-tatico-cell gc-mapa-tatico-cell-numerico">Chars</div>
              <div class="gc-mapa-tatico-cell gc-mapa-tatico-cell-numerico">Peso (%)</div>
              {mapaTatico.metodoPeso === "questoes" && (
                <div class="gc-mapa-tatico-cell gc-mapa-tatico-cell-numerico gc-mapa-tatico-cell-secundario">
                  Peso (chars)
                </div>
              )}
              <div class="gc-mapa-tatico-cell gc-mapa-tatico-cell-numerico gc-mapa-tatico-cell-secundario">
                Score
              </div>
              <div class="gc-mapa-tatico-cell gc-mapa-tatico-cell-prioridade">Prioridade</div>
            </div>

            {mapaTatico.disciplinas.map((disciplina) => (
              <div key={disciplina.nome} class="gc-mapa-tatico-table-row">
                <div class="gc-mapa-tatico-cell gc-mapa-tatico-cell-disciplina">
                  {disciplina.nome}
                </div>
                <div class="gc-mapa-tatico-cell gc-mapa-tatico-cell-numerico gc-mapa-tatico-cell-rank">
                  <span class="gc-rank-badge">#{disciplina.rank}</span>
                </div>
                {mapaTatico.metodoPeso === "questoes" && (
                  <div class="gc-mapa-tatico-cell gc-mapa-tatico-cell-numerico">
                    {disciplina.questoes !== undefined ? disciplina.questoes : "—"}
                  </div>
                )}
                <div class="gc-mapa-tatico-cell gc-mapa-tatico-cell-numerico">
                  {disciplina.totalTopicos.toLocaleString()}
                </div>
                <div class="gc-mapa-tatico-cell gc-mapa-tatico-cell-numerico">
                  {disciplina.totalChars.toLocaleString()}
                </div>
                <div class="gc-mapa-tatico-cell gc-mapa-tatico-cell-numerico">
                  {disciplina.pesoRelativo.toFixed(2)}%
                </div>
                {mapaTatico.metodoPeso === "questoes" && (
                  <div class="gc-mapa-tatico-cell gc-mapa-tatico-cell-numerico gc-mapa-tatico-cell-secundario">
                    {disciplina.pesoChars.toFixed(2)}%
                  </div>
                )}
                <div class="gc-mapa-tatico-cell gc-mapa-tatico-cell-numerico gc-mapa-tatico-cell-secundario">
                  {disciplina.scorePrioridade.toFixed(1)}
                </div>
                <div class="gc-mapa-tatico-cell gc-mapa-tatico-cell-prioridade">
                  <span class={`gc-prioridade-badge ${getPrioridadeClass(disciplina.prioridade)}`}>
                    {disciplina.prioridade}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </PremiumGate>
    </PageWrapper>
  );
}

// Componentes auxiliares (reutilizados de DetalhesEdital)
function Shell(props: { title: string; children: any }) {
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
