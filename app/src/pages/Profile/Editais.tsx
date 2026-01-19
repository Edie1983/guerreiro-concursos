// src/pages/Profile/Editais.tsx
import { useEffect, useState, useMemo } from "preact/hooks";
import { route } from "preact-router";
import { ArrowLeft, FileText, Calendar, Map, Clock, ExternalLink } from "preact-feather";
import { useAuth } from "../../contexts/AuthContext";
import { listEditais, type EditalFirestore } from "../../services/editalService";
import { PlanBadge } from "../../components/gc/PlanBadge";
import { PageWrapper } from "../../components/layout/PageWrapper";
import "./editais.css";

export default function ProfileEditais() {
  const { user, isPremium } = useAuth();
  const [editais, setEditais] = useState<EditalFirestore[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    if (user) {
      loadEditais();
    }
  }, [user]);

  const loadEditais = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const lista = await listEditais(user.uid);
      setEditais(lista);
    } catch (error) {
      console.error("Erro ao carregar editais:", error);
    } finally {
      setLoading(false);
    }
  };

  const editaisFiltrados = useMemo(() => {
    const b = busca.trim().toLowerCase();
    return editais.filter((e) =>
      b ? (e.titulo || "").toLowerCase().includes(b) : true
    );
  }, [editais, busca]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "—";
    try {
      const date = timestamp instanceof Date
        ? timestamp
        : timestamp?.toDate
        ? timestamp.toDate()
        : new Date(timestamp);
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  const navigateToDetail = (id: string) => {
    route(`/app/edital/${id}`, true);
  };

  const navigateToMapa = (id: string) => {
    route(`/app/edital/${id}/mapa`, true);
  };

  const navigateToCronograma = (id: string) => {
    route(`/app/edital/${id}/cronograma`, true);
  };

  return (
    <PageWrapper
      title="Meus Editais"
      subtitle="Histórico completo de todos os seus editais processados"
    >
      <div class="gc-profile-editais-page">
        {/* Main Content */}
        <div class="gc-content">
        {/* Search */}
        <div className="gc-profile-editais-search">
          <input
            type="text"
            value={busca}
            onInput={(e) => setBusca((e.target as HTMLInputElement).value)}
            placeholder="Buscar edital..."
            className="gc-profile-editais-search-input"
          />
        </div>

        {/* Stats */}
        <div className="gc-profile-editais-stats">
          <div className="gc-profile-editais-stat">
            <div className="gc-profile-editais-stat-label">Total</div>
            <div className="gc-profile-editais-stat-value">{editais.length}</div>
          </div>
          <div className="gc-profile-editais-stat">
            <div className="gc-profile-editais-stat-label">Exibindo</div>
            <div className="gc-profile-editais-stat-value">{editaisFiltrados.length}</div>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="gc-card gc-profile-editais-empty">
            Carregando editais...
          </div>
        ) : editaisFiltrados.length === 0 ? (
          <div className="gc-card gc-profile-editais-empty">
            {busca ? "Nenhum edital encontrado com essa busca." : "Você ainda não processou nenhum edital."}
          </div>
        ) : (
          <div className="gc-profile-editais-list">
            {editaisFiltrados.map((edital) => (
              <div key={edital.id} className="gc-card gc-profile-editais-item">
                <div className="gc-profile-editais-item-header">
                  <div className="gc-profile-editais-item-title">
                    {edital.titulo || "Edital sem título"}
                  </div>
                  <PlanBadge isPremium={isPremium} size="small" />
                </div>

                <div className="gc-profile-editais-item-meta">
                  <div className="gc-profile-editais-item-meta-item">
                    <Calendar size={14} />
                    <span>{formatDate(edital.createdAt)}</span>
                  </div>
                  {edital.orgao && (
                    <div className="gc-profile-editais-item-meta-item">
                      <FileText size={14} />
                      <span>{edital.orgao}</span>
                    </div>
                  )}
                </div>

                <div className="gc-profile-editais-item-actions">
                  <button
                    className="gc-profile-editais-action-btn"
                    onClick={() => navigateToDetail(edital.id)}
                  >
                    <ExternalLink size={16} />
                    Detalhes
                  </button>
                  {isPremium && (
                    <>
                      <button
                        className="gc-profile-editais-action-btn"
                        onClick={() => navigateToMapa(edital.id)}
                      >
                        <Map size={16} />
                        Mapa Tático
                      </button>
                      <button
                        className="gc-profile-editais-action-btn"
                        onClick={() => navigateToCronograma(edital.id)}
                      >
                        <Clock size={16} />
                        Cronograma
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </PageWrapper>
  );
}
