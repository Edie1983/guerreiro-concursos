// src/components/gc/UserLevelIndicator.tsx
import { route } from "preact-router";
import { Star, TrendingUp } from "preact-feather";
import { useAuth } from "../../contexts/AuthContext";
import "./UserLevelIndicator.css";

export function UserLevelIndicator() {
  const { user, profile } = useAuth();

  if (!user || !profile) {
    return null;
  }

  const pontos = profile.pontos || 0;
  const nivel = profile.nivel || 1;
  const progressaoNivel = profile.progressaoNivel || 0;

  return (
    <div
      class="gc-user-level-indicator"
      onClick={() => route("/app/recompensas", true)}
      title="Ver minhas recompensas"
    >
      <div class="gc-user-level-content">
        <div class="gc-user-level-nivel">
          <TrendingUp size={16} />
          <span class="gc-user-level-nivel-text">Nível {nivel}</span>
        </div>
        <div class="gc-user-level-pontos">
          <Star size={14} />
          <span class="gc-user-level-pontos-text">{pontos.toLocaleString()}</span>
        </div>
      </div>
      <div class="gc-user-level-progresso">
        <div
          class="gc-user-level-progresso-fill"
          style={`width: ${progressaoNivel}%`}
        />
      </div>
    </div>
  );
}






