// src/components/flashcards/FlashcardViewer.tsx
import { useState } from "preact/hooks";
import { RotateCcw } from "preact-feather";
import "./FlashcardViewer.css";

export type FlashcardViewerProps = {
  pergunta: string;
  resposta: string;
  topico?: string;
  onFlip?: () => void;
};

export function FlashcardViewer({ pergunta, resposta, topico, onFlip }: FlashcardViewerProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    if (onFlip && !isFlipped) {
      onFlip();
    }
  };

  return (
    <div class="flashcard-container">
      <div class={`flashcard ${isFlipped ? "flipped" : ""}`} onClick={handleFlip}>
        <div class="flashcard-inner">
          {/* Frente */}
          <div class="flashcard-front">
            <div class="flashcard-content">
              {topico && (
                <div class="flashcard-topico">{topico}</div>
              )}
              <div class="flashcard-pergunta">{pergunta}</div>
              <div class="flashcard-hint">Clique para ver a resposta</div>
            </div>
          </div>

          {/* Verso */}
          <div class="flashcard-back">
            <div class="flashcard-content">
              {topico && (
                <div class="flashcard-topico">{topico}</div>
              )}
              <div class="flashcard-resposta">{resposta}</div>
              <div class="flashcard-hint">Clique para voltar</div>
            </div>
          </div>
        </div>
      </div>

      {isFlipped && (
        <button
          class="flashcard-reset-btn"
          onClick={(e) => {
            e.stopPropagation();
            setIsFlipped(false);
          }}
          title="Voltar para a pergunta"
        >
          <RotateCcw size={18} />
        </button>
      )}
    </div>
  );
}






