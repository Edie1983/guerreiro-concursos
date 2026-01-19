// src/pages/Flashcards/index.tsx
import { useEffect, useState } from "preact/hooks";
import { route } from "preact-router";
import { Book, ArrowRight, Lock } from "preact-feather";
import { useAuth } from "../../contexts/AuthContext";
import { listarDisciplinasComFlashcards, contarFlashcards } from "../../services/flashcardService";
import { PageWrapper } from "../../components/layout/PageWrapper";
import { PremiumStatusBanner } from "../../components/gc/PremiumStatusBanner";
import "../Home/style.css";

const Flashcards = () => {
  const { user, isPremium } = useAuth();
  const [disciplinas, setDisciplinas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCards, setTotalCards] = useState(0);

  useEffect(() => {
    if (!user || !isPremium) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const disciplinasList = await listarDisciplinasComFlashcards(user.uid);
        const total = await contarFlashcards(user.uid);
        setDisciplinas(disciplinasList);
        setTotalCards(total);
      } catch (error) {
        console.error("[GC/Flashcards] Erro ao carregar disciplinas:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, isPremium]);

  // PAGE GATE: Se não for premium, mostrar apenas o gate
  if (!isPremium) {
    return (
      <PageWrapper
        title="Flashcards"
        subtitle="Memorização acelerada através de repetição espaçada"
      >
        <div class="gc-home">
          <PremiumStatusBanner />
          <div class="gc-list">
            <div class="gc-card">
              <div style="display: flex; flex-direction: column; align-items: center; text-align: center; padding: 8px;">
                <Lock size={48} style="color: var(--gc-text-muted); margin-bottom: 16px;" />
                <div class="gc-edital-title" style="margin-bottom: 12px;">
                  Flashcards são um recurso Premium
                </div>
                <div style="color: var(--gc-text-muted); font-size: 14px; margin-bottom: 20px; line-height: 1.6;">
                  Memorize melhor com repetição espaçada e flashcards inteligentes.
                </div>
                <div class="gc-edital-meta" style="margin-bottom: 20px; width: 100%;">
                  <div class="gc-edital-info">
                    <span>• Memorização acelerada</span>
                  </div>
                  <div class="gc-edital-info">
                    <span>• Repetição espaçada inteligente</span>
                  </div>
                  <div class="gc-edital-info">
                    <span>• Revisão otimizada por disciplina</span>
                  </div>
                </div>
                <button
                  class="gc-btn-primary"
                  style="width: 100%;"
                  onClick={() => route("/app/upgrade", true)}
                >
                  Ver planos
                </button>
              </div>
            </div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  // Conteúdo Premium
  return (
    <PageWrapper
      title="Flashcards"
      subtitle="Memorização acelerada através de repetição espaçada"
    >
      <div class="gc-home">
        <PremiumStatusBanner />

        {/* Stats */}
        {disciplinas.length > 0 && (
          <div class="gc-stats">
            <div class="gc-card stat">
              <div class="stat-label">Total de Cards</div>
              <div class="stat-value">{totalCards}</div>
            </div>

            <div class="gc-card stat">
              <div class="stat-label">Disciplinas</div>
              <div class="stat-value">{disciplinas.length}</div>
            </div>
          </div>
        )}

        {/* List */}
        <div class="gc-list">
          {loading ? (
            <div class="gc-card empty">Carregando flashcards...</div>
          ) : disciplinas.length === 0 ? (
            <div class="gc-card empty">
              Nenhum flashcard ainda. Crie seu primeiro flashcard a partir de um edital para começar a revisar de forma inteligente.
            </div>
          ) : (
            disciplinas.map((disciplina) => (
              <div
                key={disciplina}
                class="gc-card gc-edital"
                onClick={() => route(`/app/flashcards/${encodeURIComponent(disciplina)}`, true)}
              >
                <div class="gc-edital-row">
                  <div class="gc-edital-title" style="display: flex; align-items: center; gap: 8px;">
                    <Book size={18} style="color: var(--gc-primary);" />
                    {disciplina}
                  </div>
                  <ArrowRight size={16} style="color: var(--gc-text-muted);" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </PageWrapper>
  );
};

export default Flashcards;
