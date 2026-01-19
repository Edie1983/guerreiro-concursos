import { route } from 'preact-router';
import './style.css';

interface EditalCardProps {
  id: string;
  nome_concurso: string;
  status: string;
}

export function EditalCard({ id, nome_concurso, status }: EditalCardProps) {
  const handleCardClick = () => {
    route(`/app/edital/${id}`);
  };

  return (
    <div className="edital-card" onClick={handleCardClick}>
      <h3 className="edital-card-title">{nome_concurso}</h3>
      <div className="edital-card-status">
        <span className="status-badge">{status}</span>
      </div>
    </div>
  );
}