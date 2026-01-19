// src/pages/Cronograma/index.tsx
// Página do Motor de Cronograma
import { useMemo, useState, useRef, useEffect } from "preact/hooks";
import { route } from "preact-router";
import { ArrowLeft, Calendar, Clock, BookOpen } from "preact-feather";
import { useEditalStore } from "../../stores/editalStore";
import { useCronogramaStore } from "../../stores/cronogramaStore";
import { useAuth } from "../../contexts/AuthContext";
import { PremiumGate } from "../../components/auth/PremiumGate";
import { PageWrapper } from "../../components/layout/PageWrapper";
import { gerarMapaTatico } from "../../lib/mapaTatico/gerarMapaTatico";
import { gerarCronograma } from "../../lib/cronograma/gerarCronograma";
import { incrementSemanasCriadas } from "../../services/userService";
import { triggerCronogramaAberto } from "../../services/gamificacaoService";
import type { CronogramaConfig } from "../../lib/cronograma/types";
import "../DetalhesEdital/style.css";
import "./style.css";

type Props = {
  id?: string;
};

export default function Cronograma(props: Props) {
  const id = props.id ?? "";
  const { isPremium, loadingPlan, user } = useAuth();
  const getEditalById = useEditalStore((s) => s.getEditalById);
  const hasIncremented = useRef(false);
  const hasTriggeredCronograma = useRef(false);
  
  // Assina diretamente os valores do store (reatividade garantida)
  const configSalvo = useCronogramaStore((s) => s.configs[id]);
  const cronogramaSalvo = useCronogramaStore((s) => s.cronogramas[id]);
  const setConfig = useCronogramaStore((s) => s.setConfig);
  const setCronograma = useCronogramaStore((s) => s.setCronograma);

  const edital = useMemo(() => (id ? getEditalById(id) : null), [id, getEditalById]);

  // Gera o mapa tático se o edital existir
  const mapaTatico = useMemo(() => {
    if (!edital) return null;
    return gerarMapaTatico(edital);
  }, [edital]);

  // Config padrão
  const configPadrao: CronogramaConfig = {
    editalId: id,
    horizonteSemanas: 12,
    diasSemanaAtivos: [1, 2, 3, 4, 5], // Segunda a sexta
    horasPorDia: 2,
    percentRevisao: 0.2, // 20%
  };

  // Estado do formulário (inicializa com config salvo ou padrão)
  const [config, setConfigLocal] = useState<CronogramaConfig>(() => {
    return configSalvo || configPadrao;
  });

  // Usa cronograma salvo diretamente do store (reatividade garantida)
  const cronogramaGerado = cronogramaSalvo || null;

  // Estados de erro
  if (!id) {
    return (
      <PageWrapper title="Cronograma" subtitle="Gerador de estudo inteligente">
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
      <PageWrapper title="Cronograma" subtitle="Gerador de estudo inteligente">
        <EmptyState
          title="Edital não encontrado"
          desc="Esse edital não está no store."
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
      <PageWrapper title="Cronograma" subtitle="Gerador de estudo inteligente">
        <EmptyState
          title="Mapa Tático vazio"
          desc="Este edital não possui disciplinas processadas."
          primaryLabel="Voltar ao Edital"
          onPrimary={() => route(`/app/edital/${id}`, true)}
          secondaryLabel="Ir para Home"
          onSecondary={() => route("/app/", true)}
        />
      </PageWrapper>
    );
  }

  // Trigger: Cronograma aberto (apenas uma vez por carregamento)
  useEffect(() => {
    if (user && edital && !hasTriggeredCronograma.current) {
      hasTriggeredCronograma.current = true;
      triggerCronogramaAberto(user.uid).catch((error) => {
        console.error("[GC/Cronograma] Erro ao conceder pontos:", error);
      });
    }
  }, [user, edital]);

  const handleGerarCronograma = () => {
    if (!mapaTatico) return;

    // Salva config
    setConfig(id, config);

    // Gera cronograma
    const cronograma = gerarCronograma(mapaTatico, config);
    setCronograma(id, cronograma);

    // Incrementa semanasCriadas quando cronograma é gerado
    if (user && cronograma.semanas.length > 0 && !hasIncremented.current) {
      hasIncremented.current = true;
      incrementSemanasCriadas(user.uid).catch((error) => {
        console.error("[GC/Cronograma] Erro ao incrementar semanasCriadas:", error);
      });
    }

    // Log DEV-only (sem poluir produção)
    if (typeof window !== "undefined" && import.meta.env.DEV) {
      console.log(`[Cronograma] Cronograma gerado e salvo para editalId=${id}`, {
        semanas: cronograma.semanas.length,
        totalBlocosEstudo: cronograma.meta.totalBlocosEstudo,
        totalBlocosRevisao: cronograma.meta.totalBlocosRevisao,
      });
    }
  };

  // Mostra teaser se não for premium
  if (!isPremium && !loadingPlan) {
    const topSemanas = cronogramaGerado?.semanas.slice(0, Math.ceil((cronogramaGerado?.semanas.length || 0) * 0.1)) || [];
    
    return (
      <PageWrapper
        title="Cronograma de Estudo"
        subtitle={edital.titulo}
      >
        <div class="gc-content animate-slide-up">
          {cronogramaGerado && (
            <div class="gc-card gc-cronograma-resultado">
              <div class="gc-section-header">
                <div class="gc-section-title">Cronograma Gerado (Prévia - 10%)</div>
                <div class="gc-section-subtitle">Desbloqueie o Premium para ver o cronograma completo</div>
              </div>
              
              <div class="gc-cronograma-semanas">
                {topSemanas.map((semana) => (
                  <div key={semana.indice} class="gc-semana-card">
                    <div class="gc-semana-header">
                      <div class="gc-semana-title">Semana {semana.indice}</div>
                    </div>
                    <div class="gc-semana-dias">
                      {semana.dias.slice(0, 2).map((dia) => (
                        <div key={dia.dataISO} class="gc-dia-card">
                          <div class="gc-dia-header">
                            <div class="gc-dia-data">
                              {new Date(dia.dataISO).toLocaleDateString("pt-BR", {
                                weekday: "short",
                                day: "2-digit",
                                month: "short",
                              })}
                            </div>
                            <div class="gc-dia-total">{dia.totalMin} min</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Premium Gate */}
        <PremiumGate featureName="Cronograma Inteligente" />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Cronograma de Estudo"
      subtitle={edital.titulo}
    >
      <PremiumGate featureName="Cronograma Inteligente">
        {/* Main Content */}
        <div class="gc-content animate-slide-up">
          {/* Configuração */}
          <div class="gc-card gc-cronograma-config">
          <div class="gc-section-header">
            <div class="gc-section-title">Configuração do Cronograma</div>
          </div>

          <div class="gc-config-grid">
            <div class="gc-config-item">
              <label class="gc-config-label">
                <Calendar size={16} />
                Data da Prova (opcional)
              </label>
              <input
                type="date"
                class="gc-input"
                value={config.dataProva || ""}
                onChange={(e: any) =>
                  setConfigLocal({
                    ...config,
                    dataProva: e.target.value || undefined,
                    horizonteSemanas: e.target.value ? undefined : config.horizonteSemanas,
                  })
                }
              />
            </div>

            <div class="gc-config-item">
              <label class="gc-config-label">
                <Calendar size={16} />
                Horizonte (semanas)
              </label>
              <input
                type="number"
                class="gc-input"
                min="1"
                max="52"
                value={config.horizonteSemanas || 12}
                disabled={!!config.dataProva}
                onChange={(e: any) =>
                  setConfigLocal({
                    ...config,
                    horizonteSemanas: parseInt(e.target.value) || 12,
                  })
                }
              />
            </div>

            <div class="gc-config-item">
              <label class="gc-config-label">
                <Clock size={16} />
                Horas por Dia
              </label>
              <input
                type="number"
                class="gc-input"
                min="0.5"
                max="12"
                step="0.5"
                value={config.horasPorDia}
                onChange={(e: any) =>
                  setConfigLocal({
                    ...config,
                    horasPorDia: parseFloat(e.target.value) || 2,
                  })
                }
              />
            </div>

            <div class="gc-config-item">
              <label class="gc-config-label">
                <BookOpen size={16} />
                % Revisão (0-50%)
              </label>
              <input
                type="number"
                class="gc-input"
                min="0"
                max="50"
                step="5"
                value={config.percentRevisao * 100}
                onChange={(e: any) =>
                  setConfigLocal({
                    ...config,
                    percentRevisao: (parseFloat(e.target.value) || 0) / 100,
                  })
                }
              />
            </div>
          </div>

          <div class="gc-config-item-full">
            <label class="gc-config-label">Dias da Semana Ativos</label>
            <div class="gc-dias-semana">
              {[
                { value: 0, label: "Dom" },
                { value: 1, label: "Seg" },
                { value: 2, label: "Ter" },
                { value: 3, label: "Qua" },
                { value: 4, label: "Qui" },
                { value: 5, label: "Sex" },
                { value: 6, label: "Sáb" },
              ].map((dia) => (
                <label key={dia.value} class="gc-dia-checkbox">
                  <input
                    type="checkbox"
                    checked={config.diasSemanaAtivos.includes(dia.value)}
                    onChange={(e: any) => {
                      const novosDias = e.target.checked
                        ? [...config.diasSemanaAtivos, dia.value]
                        : config.diasSemanaAtivos.filter((d) => d !== dia.value);
                      setConfigLocal({ ...config, diasSemanaAtivos: novosDias });
                    }}
                  />
                  {dia.label}
                </label>
              ))}
            </div>
          </div>

          <button class="gc-btn-primary gc-btn-gerar" onClick={handleGerarCronograma}>
            Gerar Cronograma
          </button>
        </div>

        {/* Cronograma Gerado */}
        {cronogramaGerado && (
          <div class="gc-card gc-cronograma-resultado">
            <div class="gc-section-header">
              <div class="gc-section-title">Cronograma Gerado</div>
              <div class="gc-section-subtitle">
                {cronogramaGerado.semanas.length} semanas •{" "}
                {cronogramaGerado.meta.totalBlocosEstudo} blocos de estudo •{" "}
                {cronogramaGerado.meta.totalBlocosRevisao} revisões
              </div>
            </div>

            <div class="gc-cronograma-meta">
              <div class="gc-meta-item">
                <div class="gc-meta-label">Minutos Planejados</div>
                <div class="gc-meta-value">
                  {cronogramaGerado.meta.totalMinPlanejado.toLocaleString()} min
                </div>
              </div>
              <div class="gc-meta-item">
                <div class="gc-meta-label">Minutos de Revisão</div>
                <div class="gc-meta-value">
                  {cronogramaGerado.meta.totalMinRevisao.toLocaleString()} min
                </div>
              </div>
            </div>

            <div class="gc-cronograma-semanas">
              {cronogramaGerado.semanas.map((semana) => (
                <div key={semana.indice} class="gc-semana-card">
                  <div class="gc-semana-header">
                    <div class="gc-semana-title">Semana {semana.indice}</div>
                  </div>

                  <div class="gc-semana-dias">
                    {semana.dias.map((dia) => (
                      <div key={dia.dataISO} class="gc-dia-card">
                        <div class="gc-dia-header">
                          <div class="gc-dia-data">
                            {new Date(dia.dataISO).toLocaleDateString("pt-BR", {
                              weekday: "short",
                              day: "2-digit",
                              month: "short",
                            })}
                          </div>
                          <div class="gc-dia-total">{dia.totalMin} min</div>
                        </div>

                        <div class="gc-dia-blocos">
                          {dia.blocos.map((bloco, idx) => (
                            <div
                              key={idx}
                              class={`gc-bloco gc-bloco-${bloco.tipo.toLowerCase()}`}
                            >
                              <div class="gc-bloco-tipo">{bloco.tipo}</div>
                              <div class="gc-bloco-disciplina">{bloco.disciplinaNome}</div>
                              <div class="gc-bloco-duracao">{bloco.duracaoMin} min</div>
                              {bloco.origem && (
                                <div class="gc-bloco-origem">{bloco.origem}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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

