// src/pages/Home/index.tsx
import { useEffect, useMemo, useState } from "preact/hooks";
import { route } from "preact-router";
import { Search, Sliders, Plus } from "preact-feather";
import { useAuth } from "../../contexts/AuthContext";
import { useEditalStore } from "../../stores/editalStore";
import type { EditalProcessado } from "../../mocks/processarEditalMock";
import { PremiumStatusBanner } from "../../components/gc/PremiumStatusBanner";
import { PageWrapper } from "../../components/layout/PageWrapper";

import "./style.css";

type FiltroStatus = "TODOS" | "PENDING" | "PROCESSING" | "COMPLETED";

const Home = () => {
  const { user } = useAuth();
  const editaisRecord = useEditalStore((s) => s.editais);
  const loadEditais = useEditalStore((s) => s.loadEditais);
  const loading = useEditalStore((s) => s.loading);

  // Converte Record para array e ordena por criadoEmISO (mais recente primeiro)
  const editais = useMemo(() => {
    const arr = Object.values(editaisRecord);
    return arr.sort((a, b) => {
      const dateA = new Date(a.criadoEmISO).getTime();
      const dateB = new Date(b.criadoEmISO).getTime();
      return dateB - dateA;
    });
  }, [editaisRecord]);

  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<FiltroStatus>("TODOS");
  const [showMenuLegal, setShowMenuLegal] = useState(false);

  // Carrega editais do Firestore quando o usuário estiver logado
  useEffect(() => {
    if (user) {
      loadEditais(user.uid).catch((error) => {
        console.error("Erro ao carregar editais:", error);
      });
    }
  }, [user, loadEditais]);

  // Fecha menu legal ao clicar fora
  useEffect(() => {
    if (!showMenuLegal) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".gc-menu-legal-wrapper")) {
        setShowMenuLegal(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showMenuLegal]);

  const editaisFiltrados = useMemo(() => {
    const b = busca.trim().toLowerCase();

    return editais
      .filter((e: EditalProcessado) => {
        if (filtro === "TODOS") return true;
        return true;
      })
      .filter((e: EditalProcessado) =>
        b ? (e.titulo ?? "").toLowerCase().includes(b) : true
      );
  }, [editais, busca, filtro]);

  const navigateToDetail = (id: string) => route(`/app/edital/${id}`);

  const handleAddEdital = () => {
    route("/app/upload", true);
  };

  const resumo = useMemo(() => {
    const lista = editais;
    const total = lista.length;
    const completos = total;
    const emAndamento = 0;
    const progressoMedio = 100;

    return { total, completos, emAndamento, progressoMedio };
  }, [editais]);

  return (
    <PageWrapper
      title="Meus Editais"
      subtitle="Pare de adivinhar. Comece a acertar."
    >
      <div class="gc-home">
        {/* Banner de Status Premium/Free */}
        <PremiumStatusBanner />

        {/* Search + Filters */}
        <div class="gc-controls">
        <div class="gc-search">
          <Search size={18} />
          <input
            value={busca}
            onInput={(e) => setBusca((e.target as HTMLInputElement).value)}
            placeholder="Buscar edital pelo nome..."
            aria-label="Buscar edital"
          />
          <button class="icon-btn subtle" title="Filtros">
            <Sliders size={18} />
          </button>
        </div>

        <div class="gc-chips">
          <button class={`chip ${filtro === "TODOS" ? "active" : ""}`} onClick={() => setFiltro("TODOS")}>
            Todos
          </button>
          <button class={`chip ${filtro === "PROCESSING" ? "active" : ""}`} onClick={() => setFiltro("PROCESSING")}>
            Processando
          </button>
          <button class={`chip ${filtro === "PENDING" ? "active" : ""}`} onClick={() => setFiltro("PENDING")}>
            Pendentes
          </button>
          <button class={`chip ${filtro === "COMPLETED" ? "active" : ""}`} onClick={() => setFiltro("COMPLETED")}>
            Concluídos
          </button>
        </div>
      </div>

      {/* Stats */}
      <div class="gc-stats">
        <div class="gc-card stat">
          <div class="stat-label">Total</div>
          <div class="stat-value">{resumo.total}</div>
        </div>

        <div class="gc-card stat">
          <div class="stat-label">Processando</div>
          <div class="stat-value">{resumo.emAndamento}</div>
        </div>

        <div class="gc-card stat">
          <div class="stat-label">Concluídos</div>
          <div class="stat-value">{resumo.completos}</div>
        </div>

        <div class="gc-card stat">
          <div class="stat-label">Progresso médio</div>
          <div class="stat-value">{resumo.progressoMedio}%</div>
        </div>
      </div>

      {/* List */}
      <div class="gc-list">
        {loading ? (
          <div class="gc-card empty">Carregando editais...</div>
        ) : editaisFiltrados.length === 0 ? (
          <div class="gc-card empty">Nenhum edital encontrado. Clique no <b>+</b> para fazer upload.</div>
        ) : (
          editaisFiltrados.map((edital: EditalProcessado) => (
            <div key={edital.id} class="gc-card gc-edital" onClick={() => navigateToDetail(edital.id)}>
              <div class="gc-edital-row">
                <div class="gc-edital-title">{edital.titulo || "Edital sem título"}</div>
                <div class="gc-tag completed">Processado</div>
              </div>

              <div class="gc-edital-meta">
                <div class="gc-edital-info">
                  <span>{edital.orgao || "—"}</span>
                  {edital.banca && <span> • {edital.banca}</span>}
                </div>
                <div class="gc-edital-info">
                  {edital.disciplinas?.length > 0 && (
                    <span>{edital.disciplinas.length} disciplina{edital.disciplinas.length > 1 ? "s" : ""}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      <button class="gc-fab" onClick={handleAddEdital} title="Adicionar edital">
        <Plus size={22} />
      </button>
    </div>
  </PageWrapper>
  );
};

export default Home;
