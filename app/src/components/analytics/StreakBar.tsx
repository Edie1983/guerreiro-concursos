// src/components/analytics/StreakBar.tsx
import { Zap } from 'preact-feather';
import './StreakBar.css';

interface StreakBarProps {
  diasAtivos: number;
  streakAtual?: number;
}

export function StreakBar({ diasAtivos, streakAtual }: StreakBarProps) {
  // Calcula streak baseado em dias consecutivos
  // Por enquanto, usa diasAtivos como aproximação
  const streak = streakAtual || diasAtivos;

  return (
    <div class="gc-streak-bar">
      <div class="gc-streak-header">
        <div class="gc-streak-icon">
          <Zap size={20} />
        </div>
        <div class="gc-streak-content">
          <div class="gc-streak-label">Sequência de Dias Ativos</div>
          <div class="gc-streak-value">{streak} {streak === 1 ? 'dia' : 'dias'}</div>
        </div>
      </div>
      <div class="gc-streak-progress">
        <div 
          class="gc-streak-progress-fill" 
          style={{ width: `${Math.min((streak / 30) * 100, 100)}%` }}
        />
      </div>
      <div class="gc-streak-hint">
        {streak < 7 && 'Continue estudando para aumentar sua sequência!'}
        {streak >= 7 && streak < 30 && 'Ótimo progresso! Mantenha o ritmo!'}
        {streak >= 30 && '🔥 Você está no fogo! Continue assim!'}
      </div>
    </div>
  );
}

