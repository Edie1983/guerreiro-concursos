// src/components/analytics/Timeline.tsx
import { Calendar, FileText, BookOpen, Clock } from 'preact-feather';
import './Timeline.css';

interface TimelineEvent {
  type: 'created' | 'edital' | 'disciplina' | 'cronograma';
  date: Date;
  label: string;
  description?: string;
}

interface TimelineProps {
  createdAt: Date;
  editaisProcessados: number;
  disciplinasVistas: number;
  semanasCriadas: number;
}

export function Timeline({ createdAt, editaisProcessados, disciplinasVistas, semanasCriadas }: TimelineProps) {
  const eventos: TimelineEvent[] = [];

  // Evento de criação da conta
  eventos.push({
    type: 'created',
    date: createdAt,
    label: 'Conta criada',
    description: 'Você começou sua jornada no Guerreiro Concursos',
  });

  // Eventos simulados baseados nos contadores
  // (Em produção, seria melhor ter eventos reais salvos)
  if (editaisProcessados > 0) {
    const dataPrimeiroEdital = new Date(createdAt);
    dataPrimeiroEdital.setDate(dataPrimeiroEdital.getDate() + 1);
    eventos.push({
      type: 'edital',
      date: dataPrimeiroEdital,
      label: `Primeiro edital processado`,
      description: `${editaisProcessados} edital${editaisProcessados > 1 ? 'is' : ''} processado${editaisProcessados > 1 ? 's' : ''} no total`,
    });
  }

  if (disciplinasVistas > 0) {
    const dataPrimeiraDisciplina = new Date(createdAt);
    dataPrimeiraDisciplina.setDate(dataPrimeiraDisciplina.getDate() + 2);
    eventos.push({
      type: 'disciplina',
      date: dataPrimeiraDisciplina,
      label: `Primeira disciplina estudada`,
      description: `${disciplinasVistas} disciplina${disciplinasVistas > 1 ? 's' : ''} vista${disciplinasVistas > 1 ? 's' : ''} no total`,
    });
  }

  if (semanasCriadas > 0) {
    const dataPrimeiroCronograma = new Date(createdAt);
    dataPrimeiroCronograma.setDate(dataPrimeiroCronograma.getDate() + 3);
    eventos.push({
      type: 'cronograma',
      date: dataPrimeiroCronograma,
      label: `Primeiro cronograma criado`,
      description: `${semanasCriadas} semana${semanasCriadas > 1 ? 's' : ''} criada${semanasCriadas > 1 ? 's' : ''} no total`,
    });
  }

  // Ordena por data
  eventos.sort((a, b) => a.date.getTime() - b.date.getTime());

  const getIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'created':
        return <Calendar size={18} />;
      case 'edital':
        return <FileText size={18} />;
      case 'disciplina':
        return <BookOpen size={18} />;
      case 'cronograma':
        return <Clock size={18} />;
    }
  };

  const getTypeClass = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'created':
        return 'gc-timeline-created';
      case 'edital':
        return 'gc-timeline-edital';
      case 'disciplina':
        return 'gc-timeline-disciplina';
      case 'cronograma':
        return 'gc-timeline-cronograma';
    }
  };

  return (
    <div class="gc-timeline">
      <div class="gc-timeline-header">
        <div class="gc-timeline-title">Sua Jornada</div>
        <div class="gc-timeline-subtitle">Marcos importantes da sua evolução</div>
      </div>
      <div class="gc-timeline-events">
        {eventos.length === 0 ? (
          <div class="gc-timeline-empty">
            <div class="gc-timeline-empty-text">Nenhum evento ainda</div>
            <div class="gc-timeline-empty-hint">Comece processando um edital para ver sua jornada aqui!</div>
          </div>
        ) : (
          eventos.map((evento, index) => (
            <div key={index} class={`gc-timeline-event ${getTypeClass(evento.type)}`}>
              <div class="gc-timeline-icon">{getIcon(evento.type)}</div>
              <div class="gc-timeline-content">
                <div class="gc-timeline-label">{evento.label}</div>
                {evento.description && (
                  <div class="gc-timeline-description">{evento.description}</div>
                )}
                <div class="gc-timeline-date">
                  {evento.date.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}






