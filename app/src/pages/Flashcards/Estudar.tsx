// src/pages/Flashcards/Estudar.tsx
import { useEffect, useState } from "preact/hooks";
import { route } from "preact-router";
import { X, CheckCircle, XCircle, Zap } from "preact-feather";
import { useAuth } from "../../contexts/AuthContext";
import { FlashcardViewer } from "../../components/flashcards/FlashcardViewer";
import {
  buscarFlashcardsParaRevisao,
  registrarResposta,
  type Flashcard,
} from "../../services/flashcardService";
import { concederPontos, verificarMedalhas } from "../../services/gamificacaoService";
import { addMedalha } from "../../services/userService";
import { incrementCartasEstudadas, updateHistoricoAtividade } from "../../services/userService";
import { Paywall } from "../../components/gc/Paywall";
import { PageWrapper } from "../../components/layout/PageWrapper";
import "./estudar.css";

type EstudarProps = {
  disciplina?: string;
};

const FlashcardsEstudar = ({ disciplina }: EstudarProps) => {
  const { user, isPremium } = useAuth();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [cardsRespondidos, setCardsRespondidos] = useState(0);
  const [showTeaser, setShowTeaser] = useState(false);
  const disciplinaDecoded = disciplina ? decodeURIComponent(disciplina) : "";

  useEffect(() => {
    if (!user) return;

    const loadCards = async () => {
      setLoading(true);
      try {
        const flashcards = await buscarFlashcardsParaRevisao(
          user.uid,
          disciplinaDecoded || undefined,
          10
        );

        // Se usuário não é premium, mostra apenas 3 cards como teaser
        if (!isPremium && flashcards.length > 3) {
          setCards(flashcards.slice(0, 3));
          setShowTeaser(true);
        } else {
          setCards(flashcards);
          setShowTeaser(false);
        }
      } catch (error) {
        console.error("[GC/Flashcards] Erro ao carregar flashcards:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCards();
  }, [user, disciplinaDecoded, isPremium]);

  const handleResposta = async (qualidade: 0 | 1 | 2) => {
    if (!user || cards.length === 0) return;

    const currentCard = cards[currentIndex];
    if (!currentCard) return;

    try {
      // Registra resposta
      await registrarResposta(user.uid, currentCard.id, qualidade);

      // Atualiza analytics
      await incrementCartasEstudadas(user.uid);
      await updateHistoricoAtividade(user.uid);

      // Concede pontos
      await concederPontos(user.uid, 2, { tipo: "flashcard_respondido" });

      // Verifica medalhas
      const totalRespostas = cardsRespondidos + 1;
      if (totalRespostas === 1) {
        await addMedalha(user.uid, "flashcards_iniciados");
      } else if (totalRespostas === 50) {
        await addMedalha(user.uid, "50_respostas");
      } else if (totalRespostas === 100) {
        await addMedalha(user.uid, "100_respostas");
      }
      // Verifica outras medalhas automaticamente
      await verificarMedalhas(user.uid, { tipo: "flashcard_respondido", dados: { totalRespostas } });

      setCardsRespondidos(totalRespostas);

      // Avança para próximo card ou finaliza sessão
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // Sessão completa
        if (user && cardsRespondidos >= 10) {
          await concederPontos(user.uid, 5, { tipo: "sessao_flashcards_completa" });
        }
        setSessionComplete(true);
      }
    } catch (error) {
      console.error("[GC/Flashcards] Erro ao registrar resposta:", error);
    }
  };

  const handleClose = () => {
    route("/app/flashcards", true);
  };

  if (loading) {
    return (
      <PageWrapper title="Estudar Flashcards">
        <Paywall>
          <div class="flashcards-page">
            <div class="flashcards-loading">Carregando...</div>
          </div>
        </Paywall>
      </PageWrapper>
    );
  }

  if (cards.length === 0) {
    return (
      <PageWrapper title="Estudar Flashcards">
        <Paywall>
          <div class="flashcards-page">
            <div class="flashcards-empty">
              <h2>Nenhum flashcard para revisar</h2>
              <p>Todos os flashcards estão em dia!</p>
              <button class="flashcards-action-btn" onClick={handleClose}>
                Voltar
              </button>
            </div>
          </div>
        </Paywall>
      </PageWrapper>
    );
  }

  if (sessionComplete) {
    return (
      <PageWrapper title="Sessão Completa">
        <Paywall>
          <div class="flashcards-page">
            <div class="flashcards-session-complete">
              <CheckCircle size={64} />
              <h2>Sessão de Estudo Completa!</h2>
              <p>Você estudou {cardsRespondidos} flashcards.</p>
              {cardsRespondidos >= 10 && (
                <p class="flashcards-bonus">+5 pontos por completar a sessão!</p>
              )}
              <button class="flashcards-action-btn" onClick={handleClose}>
                Voltar
              </button>
            </div>
          </div>
        </Paywall>
      </PageWrapper>
    );
  }

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <PageWrapper
      title={`Estudando: ${disciplinaDecoded}`}
      subtitle={`Card ${currentIndex + 1} de ${cards.length}`}
    >
      <Paywall>
        <div class="flashcards-page">
          <div class="flashcards-study-container">
            {showTeaser && !isPremium && (
              <div class="flashcards-teaser-banner">
                <p>Você está no modo de demonstração. Faça upgrade para estudar todos os flashcards!</p>
                <button
                  class="flashcards-upgrade-btn-small"
                  onClick={() => route("/app/upgrade", true)}
                >
                  Fazer Upgrade
                </button>
              </div>
            )}

            <div class="flashcards-study-header">
              <button class="flashcards-close-btn" onClick={handleClose}>
                <X size={20} />
              </button>
              <div class="flashcards-progress">
                <div class="flashcards-progress-bar">
                  <div
                    class="flashcards-progress-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span class="flashcards-progress-text">
                  {currentIndex + 1} / {cards.length}
                </span>
              </div>
            </div>

            <div class="flashcards-study-content">
              {currentCard && (
                <FlashcardViewer
                  pergunta={currentCard.pergunta}
                  resposta={currentCard.resposta}
                  topico={currentCard.topico}
                />
              )}

              <div class="flashcards-actions">
                <button
                  class="flashcards-action-btn-error"
                  onClick={() => handleResposta(0)}
                >
                  <XCircle size={20} />
                  Errei
                </button>
                <button
                  class="flashcards-action-btn-success"
                  onClick={() => handleResposta(1)}
                >
                  <CheckCircle size={20} />
                  Acertei
                </button>
                <button
                  class="flashcards-action-btn-easy"
                  onClick={() => handleResposta(2)}
                >
                  <Zap size={20} />
                  Fácil
                </button>
              </div>
            </div>
          </div>
        </div>
      </Paywall>
    </PageWrapper>
  );
};

export default FlashcardsEstudar;

