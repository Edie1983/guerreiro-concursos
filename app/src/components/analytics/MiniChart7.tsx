// src/components/analytics/MiniChart7.tsx
import './MiniChart7.css';

interface MiniChart7Props {
  historico: Array<{ date: string; count: number }>;
}

export function MiniChart7({ historico }: MiniChart7Props) {
  // Preenche últimos 7 dias (mesmo que não tenha dados)
  const hoje = new Date();
  const ultimos7Dias: Array<{ date: string; count: number; label: string }> = [];
  
  for (let i = 6; i >= 0; i--) {
    const data = new Date(hoje);
    data.setDate(data.getDate() - i);
    data.setHours(0, 0, 0, 0);
    const dateStr = data.toISOString().split('T')[0];
    
    const entrada = historico.find(h => h.date === dateStr);
    const label = data.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' });
    
    ultimos7Dias.push({
      date: dateStr,
      count: entrada?.count || 0,
      label,
    });
  }

  const maxCount = Math.max(...ultimos7Dias.map(d => d.count), 1);

  return (
    <div class="gc-mini-chart-7">
      <div class="gc-mini-chart-header">
        <div class="gc-mini-chart-title">Atividade dos Últimos 7 Dias</div>
      </div>
      <div class="gc-mini-chart-bars">
        {ultimos7Dias.map((dia) => (
          <div key={dia.date} class="gc-mini-chart-bar-wrapper">
            <div class="gc-mini-chart-bar-container">
              <div
                class="gc-mini-chart-bar"
                style={{
                  height: `${(dia.count / maxCount) * 100}%`,
                  opacity: dia.count > 0 ? 1 : 0.3,
                }}
              />
            </div>
            <div class="gc-mini-chart-label">{dia.label}</div>
            {dia.count > 0 && (
              <div class="gc-mini-chart-value">{dia.count}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}






