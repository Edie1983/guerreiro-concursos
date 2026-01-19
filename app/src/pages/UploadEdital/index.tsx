// src/pages/UploadEdital/index.tsx
import { useMemo, useState, useEffect } from "preact/hooks";
import { route } from "preact-router";
import { Upload, FileText } from "preact-feather";
import { useEditalStore } from "../../stores/editalStore";
import { useAuth } from "../../contexts/AuthContext";
import { PremiumGate } from "../../components/auth/PremiumGate";
import { PageWrapper } from "../../components/layout/PageWrapper";
import "./style.css";

const MAX_EDITAIS_FREE = 2;

export default function UploadEdital() {
  const { user, isPremium, loadingPlan } = useAuth();
  const setPendingUpload = useEditalStore((s) => s.setPendingUpload);
  const editaisRecord = useEditalStore((s) => s.editais);
  const loadEditais = useEditalStore((s) => s.loadEditais);

  const [file, setFile] = useState<File | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const fileLabel = useMemo(() => file?.name ?? "Nenhum PDF selecionado", [file]);

  // Carrega editais para contar
  useEffect(() => {
    if (user && !isPremium) {
      loadEditais(user.uid).catch((error) => {
        console.error("Erro ao carregar editais:", error);
      });
    }
  }, [user, isPremium, loadEditais]);

  // Conta editais do usuário
  const totalEditais = useMemo(() => {
    return Object.keys(editaisRecord).length;
  }, [editaisRecord]);

  // Verifica se pode fazer upload
  const canUpload = useMemo(() => {
    if (loadingPlan) return false;
    if (isPremium) return true;
    return totalEditais < MAX_EDITAIS_FREE;
  }, [isPremium, totalEditais, loadingPlan]);

  function onPickFile(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const f = input.files?.[0] ?? null;

    setErro(null);

    if (!f) {
      setFile(null);
      return;
    }

    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      setFile(null);
      setErro("Selecione um arquivo PDF válido.");
      return;
    }

    setFile(f);
  }

  function onStart() {
    setErro(null);

    if (!file) {
      setErro("Selecione um PDF antes de continuar.");
      return;
    }

    if (!canUpload) {
      setErro("Limite de editais atingido. Faça upgrade para Premium.");
      return;
    }

    setPendingUpload(file);
    route("/app/processamento", true);
  }

  return (
    <PageWrapper
      title="Novo Edital"
      subtitle="Envie seu PDF e deixe o Guerreiro organizar tudo para você"
    >
      <div class="gc-upload-page">
        {/* Main Content */}
        <div class="gc-content animate-slide-up">
          {/* Premium Gate - Bloqueio se exceder limite */}
          {!loadingPlan && !canUpload && (
            <PremiumGate
              featureName="Upload de editais ilimitados"
              fallback={
                <div class="gc-card gc-upload-card">
                  <div class="gc-error-message">
                    <div class="gc-error-title">Limite atingido</div>
                    <div class="gc-error-text">
                      Você já possui {totalEditais} edital(is). O plano Free permite até {MAX_EDITAIS_FREE} editais.
                      Faça upgrade para Premium para uploads ilimitados.
                    </div>
                  </div>
                  <button
                    class="gc-btn-primary"
                    onClick={() => route("/app/planos", true)}
                  >
                    Ver Planos
                  </button>
                </div>
              }
            >
              {/* Children não será renderizado quando fallback é usado */}
              <div></div>
            </PremiumGate>
          )}

          {/* File Upload Card */}
          {canUpload && (
            <div class="gc-card gc-upload-card">
              <div class="gc-upload-header">
                <div class="gc-upload-icon">
                  <FileText size={32} />
                </div>
                <div class="gc-upload-info">
                  <div class="gc-upload-label">Arquivo selecionado</div>
                  <div class="gc-upload-filename">{fileLabel}</div>
                </div>
              </div>

              <label class="gc-file-input-label">
                <Upload size={18} />
                <span>Selecionar PDF</span>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  class="gc-file-input"
                  onChange={onPickFile as any}
                />
              </label>

              {erro && (
                <div class="gc-error-message">
                  <div class="gc-error-title">Atenção</div>
                  <div class="gc-error-text">{erro}</div>
                </div>
              )}

              <div class="gc-upload-actions">
                <button
                  class={`gc-btn-primary ${!file ? "disabled" : ""}`}
                  onClick={onStart}
                  disabled={!file}
                >
                  Enviar e Processar
                </button>
                <button class="gc-btn-secondary" onClick={() => route("/app/", true)}>
                  Voltar
                </button>
              </div>
            </div>
          )}

          {/* Features Grid */}
          <div class="gc-features-grid">
            <div class="gc-card gc-feature-card">
              <div class="gc-feature-title">Rápido</div>
              <div class="gc-feature-desc">Extrai o texto e já organiza em disciplinas</div>
            </div>
            <div class="gc-card gc-feature-card">
              <div class="gc-feature-title">Premium</div>
              <div class="gc-feature-desc">Cartões limpos, foco e clareza no fluxo</div>
            </div>
            <div class="gc-card gc-feature-card">
              <div class="gc-feature-title">Evolutivo</div>
              <div class="gc-feature-desc">Depois trocamos o mock por IA real</div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
