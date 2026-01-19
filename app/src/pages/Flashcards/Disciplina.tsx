// src/pages/Flashcards/Disciplina.tsx
import { useEffect, useState } from "preact/hooks";
import { route } from "preact-router";
import { Book, Play, ArrowLeft } from "preact-feather";
import { useAuth } from "../../contexts/AuthContext";
import { listarFlashcardsPorDisciplina, type Flashcard } from "../../services/flashcardService";
import { Paywall } from "../../components/gc/Paywall";
import { PageWrapper } from "../../components/layout/PageWrapper";
import "./style.css";

type DisciplinaProps = {
  disciplina?: string;
};

const FlashcardsDisciplina = ({ disciplina }: DisciplinaProps) => {
  const { user } = useAuth();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const disciplinaDecoded = disciplina ? decodeURIComponent(disciplina) : "";

  useEffect(() => {
    if (!user || !disciplinaDecoded) return;

    const loadCards = async () => {
      setLoading(true);
      try {
        const flashcards = await listarFlashcardsPorDisciplina(user.uid, disciplinaDecoded);
        setCards(flashcards);
      } catch (error) {
        console.error("[GC/Flashcards] Erro ao carregar flashcards:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCards();
  }, [user, disciplinaDecoded]);

  const cardsParaRevisao = cards.filter(
    (card) => new Date(card.proximaRevisao) <= new Date()
  ).length;

  return (
    <PageWrapper
      title={disciplinaDecoded}
      subtitle={`${cards.length} flashcards • ${cardsParaRevisao} para revisar`}
      rightSlot={
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            class="flashcards-back-btn"
            onClick={() => route("/app/flashcards", true)}
          >
            <ArrowLeft size={18} />
            Voltar
          </button>
          {cardsParaRevisao > 0 && (
            <button
              class="flashcards-study-btn"
              onClick={() => route(`/app/flashcards/estudar/${encodeURIComponent(disciplinaDecoded)}`, true)}
            >
              <Play size={18} />
              Estudar Agora
            </button>
          )}
        </div>
      }
    >
      <Paywall>
        <div class="flashcards-page">
          <div class="flashcards-container">
            {loading ? (
            <div class="flashcards-loading">Carregando...</div>
          ) : cards.length === 0 ? (
            <div class="flashcards-empty">
              <Book size={48} />
              <h2>Nenhum flashcard encontrado</h2>
              <p>Esta disciplina ainda não tem flashcards.</p>
            </div>
          ) : (
            <div class="flashcards-list">
              {cards.map((card) => (
                <div key={card.id} class="flashcards-card-item">
                  <div class="flashcards-card-content">
                    <div class="flashcards-card-topico">{card.topico}</div>
                    <div class="flashcards-card-pergunta">{card.pergunta}</div>
                    <div class="flashcards-card-stats">
                      <span>✓ {card.acertos}</span>
                      <span>✗ {card.erros}</span>
                      <span class="flashcards-card-revisao">
                        Próxima: {new Date(card.proximaRevisao).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Paywall>
    </PageWrapper>
  );
};

export default FlashcardsDisciplina;






