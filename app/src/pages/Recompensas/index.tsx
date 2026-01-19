// src/pages/Recompensas/index.tsx
import { useEffect } from "preact/hooks";
import { Award, Star, TrendingUp } from "preact-feather";
import { useAuth } from "../../contexts/AuthContext";
import { PageWrapper } from "../../components/layout/PageWrapper";
import "./style.css";

const MEDALHAS_INFO: Record<string, { nome: string; descricao: string; icone: string }> = {
  primeiro_edital: {
    nome: "Primeiro Edital",
    descricao: "Processou seu primeiro edital",
    icone: "📄",
  },
  sete_dias_ativo: {
    nome: "Sete Dias Ativo",
    descricao: "Manteve-se ativo por 7 dias",
    icone: "🔥",
  },
  guerreiro_constante: {
    nome: "Guerreiro Constante",
    descricao: "Completou streak de 3 dias",
    icone: "⚔️",
  },
  premium_primeira_vez: {
    nome: "Premium Primeira Vez",
    descricao: "Assinou o plano Premium",
    icone: "👑",
  },
  mapa_desbloqueado: {
    nome: "Mapa Desbloqueado",
    descricao: "Acessou o Mapa Tático",
    icone: "🗺️",
  },
};

export default function Recompensas() {
  const { user, profile, loadingProfile, refreshProfile } = useAuth();

  useEffect(() => {
    if (user && !loadingProfile) {
      refreshProfile().catch(console.error);
    }
  }, [user, loadingProfile, refreshProfile]);

  if (!user) {
    return (
      <PageWrapper title="Minhas Recompensas" subtitle="Acompanhe seus pontos, nível e medalhas">
        <div class="gc-recompensas-page">
          <div class="gc-recompensas-empty">
            <div class="gc-recompensas-empty-text">Faça login para ver suas recompensas</div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (loadingProfile || !profile) {
    return (
      <PageWrapper title="Minhas Recompensas" subtitle="Acompanhe seus pontos, nível e medalhas">
        <div class="gc-recompensas-page">
          <div class="gc-recompensas-loading">Carregando...</div>
        </div>
      </PageWrapper>
    );
  }

  const pontos = profile.pontos || 0;
  const nivel = profile.nivel || 1;
  const progressaoNivel = profile.progressaoNivel || 0;
  const medalhas = profile.medalhas || [];

  const pontosParaProximoNivel = (() => {
    if (nivel === 1) return 100 - pontos;
    if (nivel === 2) return 250 - pontos;
    if (nivel === 3) return 500 - pontos;
    if (nivel === 4) return 1000 - pontos;
    return 0;
  })();

  return (
    <PageWrapper
      title="Minhas Recompensas"
      subtitle="Acompanhe seus pontos, nível e medalhas"
    >
      <div class="gc-recompensas-page">
        <div class="gc-recompensas-content animate-slide-up">
          <div class="gc-card gc-recompensas-card">
            <div class="gc-recompensas-header">
              <div class="gc-recompensas-pontos">
                <Star size={32} class="gc-recompensas-icone-pontos" />
                <div class="gc-recompensas-pontos-valor">{pontos.toLocaleString()}</div>
                <div class="gc-recompensas-pontos-label">Pontos</div>
              </div>
              <div class="gc-recompensas-nivel">
                <TrendingUp size={32} class="gc-recompensas-icone-nivel" />
                <div class="gc-recompensas-nivel-valor">Nível {nivel}</div>
                <div class="gc-recompensas-nivel-label">
                  {nivel === 5 ? "Nível Máximo!" : `${pontosParaProximoNivel} pontos para o próximo nível`}
                </div>
              </div>
            </div>

            {nivel < 5 && (
              <div class="gc-recompensas-progresso">
                <div class="gc-recompensas-progresso-label">
                  Progresso para Nível {nivel + 1}
                </div>
                <div class="gc-recompensas-progresso-bar">
                  <div
                    class="gc-recompensas-progresso-fill"
                    style={`width: ${progressaoNivel}%`}
                  />
                </div>
                <div class="gc-recompensas-progresso-text">
                  {progressaoNivel.toFixed(0)}%
                </div>
              </div>
            )}
          </div>

          <div class="gc-card gc-recompensas-card">
            <div class="gc-recompensas-section-header">
              <Award size={24} />
              <div class="gc-recompensas-section-title">Medalhas</div>
              <div class="gc-recompensas-section-subtitle">
                {medalhas.length} de {Object.keys(MEDALHAS_INFO).length} conquistadas
              </div>
            </div>

            <div class="gc-recompensas-medalhas-grid">
              {Object.entries(MEDALHAS_INFO).map(([id, info]) => {
                const conquistada = medalhas.includes(id);
                return (
                  <div
                    key={id}
                    class={`gc-recompensas-medalha ${conquistada ? "gc-recompensas-medalha-conquistada" : "gc-recompensas-medalha-bloqueada"}`}
                  >
                    <div class="gc-recompensas-medalha-icone">{info.icone}</div>
                    <div class="gc-recompensas-medalha-nome">{info.nome}</div>
                    <div class="gc-recompensas-medalha-descricao">{info.descricao}</div>
                    {conquistada && (
                      <div class="gc-recompensas-medalha-badge">Conquistada</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div class="gc-card gc-recompensas-card">
            <div class="gc-recompensas-section-header">
              <Star size={24} />
              <div class="gc-recompensas-section-title">Como Ganhar Pontos</div>
            </div>

            <div class="gc-recompensas-pontos-lista">
              <div class="gc-recompensas-ponto-item">
                <div class="gc-recompensas-ponto-valor">+5</div>
                <div class="gc-recompensas-ponto-descricao">Ao abrir o app</div>
              </div>
              <div class="gc-recompensas-ponto-item">
                <div class="gc-recompensas-ponto-valor">+10</div>
                <div class="gc-recompensas-ponto-descricao">Ao processar um edital</div>
              </div>
              <div class="gc-recompensas-ponto-item">
                <div class="gc-recompensas-ponto-valor">+3</div>
                <div class="gc-recompensas-ponto-descricao">Ao abrir o Mapa Tático</div>
              </div>
              <div class="gc-recompensas-ponto-item">
                <div class="gc-recompensas-ponto-valor">+3</div>
                <div class="gc-recompensas-ponto-descricao">Ao abrir o Cronograma</div>
              </div>
              <div class="gc-recompensas-ponto-item">
                <div class="gc-recompensas-ponto-valor">+20</div>
                <div class="gc-recompensas-ponto-descricao">Ao completar streak de 3 dias</div>
              </div>
              <div class="gc-recompensas-ponto-item">
                <div class="gc-recompensas-ponto-valor">+50</div>
                <div class="gc-recompensas-ponto-descricao">Ao assinar o Premium</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
