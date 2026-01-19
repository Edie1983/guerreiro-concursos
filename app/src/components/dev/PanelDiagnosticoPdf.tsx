// src/components/dev/PanelDiagnosticoPdf.tsx
// Painel Visual de Diagnóstico do PDF (PASSO G - DEV-only)

import type { DiagnosticoPdf } from "../../lib/pdf/diagnosticoPdf";
import "./PanelDiagnosticoPdf.css";

type Props = {
  diagnostico: DiagnosticoPdf;
};

export function PanelDiagnosticoPdf({ diagnostico }: Props) {
  // Não renderiza em produção
  if (typeof window !== "undefined" && !import.meta.env.DEV) {
    return null;
  }

  return (
    <div class="gc-panel-diagnostico">
      <div class="gc-panel-diagnostico-header">
        <div class="gc-panel-diagnostico-title">📊 Diagnóstico Consolidado do PDF (PASSO E)</div>
        <div class={`gc-panel-diagnostico-status gc-status-${diagnostico.status}`}>
          {diagnostico.status.toUpperCase()}
        </div>
      </div>

      <div class="gc-panel-diagnostico-grid">
        {/* Seção CLASSIFICAÇÃO (PASSO B) */}
        <div class="gc-panel-diagnostico-section">
          <div class="gc-panel-diagnostico-section-title">
            <span>📋</span> Classificação (PASSO B)
          </div>
          <div class="gc-panel-diagnostico-flags">
            <div class="gc-panel-diagnostico-flag">
              <div class="gc-panel-diagnostico-flag-label">Fragmentado</div>
              <div class={`gc-panel-diagnostico-flag-value ${diagnostico.classificacao.fragmentado ? "warning" : "ok"}`}>
                {diagnostico.classificacao.fragmentado ? "⚠️ SIM" : "✅ NÃO"}
              </div>
            </div>
            <div class="gc-panel-diagnostico-flag">
              <div class="gc-panel-diagnostico-flag-label">Escaneado</div>
              <div class={`gc-panel-diagnostico-flag-value ${diagnostico.classificacao.escaneado ? "error" : "ok"}`}>
                {diagnostico.classificacao.escaneado ? "❌ SIM" : "✅ NÃO"}
              </div>
            </div>
          </div>
        </div>

        {/* Seção FAIL-SAFE (PASSO C) */}
        <div class="gc-panel-diagnostico-section">
          <div class="gc-panel-diagnostico-section-title">
            <span>🔒</span> Fail-Safe (PASSO C)
          </div>
          <div class="gc-panel-diagnostico-flags">
            <div class="gc-panel-diagnostico-flag">
              <div class="gc-panel-diagnostico-flag-label">Anexo Perdido</div>
              <div class={`gc-panel-diagnostico-flag-value ${diagnostico.failSafe.possivelAnexoPerdido ? "error" : "ok"}`}>
                {diagnostico.failSafe.possivelAnexoPerdido ? "⚠️ SIM" : "✅ NÃO"}
              </div>
            </div>
            <div class="gc-panel-diagnostico-flag">
              <div class="gc-panel-diagnostico-flag-label">Headings Quebrados</div>
              <div class={`gc-panel-diagnostico-flag-value ${diagnostico.failSafe.headingsQuebrados ? "warning" : "ok"}`}>
                {diagnostico.failSafe.headingsQuebrados ? "⚠️ SIM" : "✅ NÃO"}
              </div>
            </div>
          </div>
        </div>

        {/* Seção PRÉ-VALIDAÇÃO (PASSO D) */}
        <div class="gc-panel-diagnostico-section gc-panel-diagnostico-section-full">
          <div class="gc-panel-diagnostico-section-title">
            <span>🛡️</span> Pré-Validação (PASSO D)
          </div>
          <div class="gc-panel-diagnostico-flags gc-panel-diagnostico-flags-grid">
            <div class="gc-panel-diagnostico-flag">
              <div class="gc-panel-diagnostico-flag-label">Texto Insuficiente</div>
              <div class={`gc-panel-diagnostico-flag-value ${diagnostico.prevalidacao.textoInsuficiente ? "error" : "ok"}`}>
                {diagnostico.prevalidacao.textoInsuficiente ? "⚠️ SIM" : "✅ NÃO"}
              </div>
            </div>
            <div class="gc-panel-diagnostico-flag">
              <div class="gc-panel-diagnostico-flag-label">Densidade Baixa</div>
              <div class={`gc-panel-diagnostico-flag-value ${diagnostico.prevalidacao.densidadeBaixa ? "warning" : "ok"}`}>
                {diagnostico.prevalidacao.densidadeBaixa ? "⚠️ SIM" : "✅ NÃO"}
              </div>
            </div>
            <div class="gc-panel-diagnostico-flag">
              <div class="gc-panel-diagnostico-flag-label">Sem Palavras-Chave</div>
              <div class={`gc-panel-diagnostico-flag-value ${diagnostico.prevalidacao.semPalavrasChave ? "warning" : "ok"}`}>
                {diagnostico.prevalidacao.semPalavrasChave ? "⚠️ SIM" : "✅ NÃO"}
              </div>
            </div>
            <div class="gc-panel-diagnostico-flag">
              <div class="gc-panel-diagnostico-flag-label">Estrutura Quebrada</div>
              <div class={`gc-panel-diagnostico-flag-value ${diagnostico.prevalidacao.estruturaQuebrada ? "error" : "ok"}`}>
                {diagnostico.prevalidacao.estruturaQuebrada ? "⚠️ SIM" : "✅ NÃO"}
              </div>
            </div>
            <div class="gc-panel-diagnostico-flag">
              <div class="gc-panel-diagnostico-flag-label">Ruído Repetitivo</div>
              <div class={`gc-panel-diagnostico-flag-value ${diagnostico.prevalidacao.ruidoRepetitivo ? "warning" : "ok"}`}>
                {diagnostico.prevalidacao.ruidoRepetitivo ? "⚠️ SIM" : "✅ NÃO"}
              </div>
            </div>
          </div>
        </div>

        {/* Seção ESTATÍSTICAS DO TEXTO */}
        <div class="gc-panel-diagnostico-section">
          <div class="gc-panel-diagnostico-section-title">
            <span>📊</span> Estatísticas do Texto
          </div>
          <div class="gc-panel-diagnostico-stats">
            <div class="gc-panel-diagnostico-stat">
              <div class="gc-panel-diagnostico-stat-label">Tamanho</div>
              <div class="gc-panel-diagnostico-stat-value">
                {diagnostico.estatisticasTexto.tamanho.toLocaleString()} chars
              </div>
            </div>
            {diagnostico.estatisticasTexto.linhas !== undefined && (
              <div class="gc-panel-diagnostico-stat">
                <div class="gc-panel-diagnostico-stat-label">Linhas</div>
                <div class="gc-panel-diagnostico-stat-value">
                  {diagnostico.estatisticasTexto.linhas.toLocaleString()}
                </div>
              </div>
            )}
            {diagnostico.estatisticasTexto.densidade !== undefined && (
              <div class="gc-panel-diagnostico-stat">
                <div class="gc-panel-diagnostico-stat-label">Densidade</div>
                <div class="gc-panel-diagnostico-stat-value">
                  {diagnostico.estatisticasTexto.densidade.toFixed(2)} chars/linha
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Seção ESTATÍSTICAS DO PARSER */}
        {diagnostico.estatisticasParser && (
          <div class="gc-panel-diagnostico-section">
            <div class="gc-panel-diagnostico-section-title">
              <span>🔍</span> Estatísticas do Parser
            </div>
            <div class="gc-panel-diagnostico-stats">
              <div class="gc-panel-diagnostico-stat">
                <div class="gc-panel-diagnostico-stat-label">ANEXO II Encontrado</div>
                <div class={`gc-panel-diagnostico-stat-value ${diagnostico.estatisticasParser.anexoEncontrado ? "success" : "error"}`}>
                  {diagnostico.estatisticasParser.anexoEncontrado ? "✅ SIM" : "❌ NÃO"}
                </div>
              </div>
              <div class="gc-panel-diagnostico-stat">
                <div class="gc-panel-diagnostico-stat-label">Disciplinas Detectadas</div>
                <div class="gc-panel-diagnostico-stat-value">
                  {diagnostico.estatisticasParser.disciplinasDetectadas}
                </div>
              </div>
              <div class="gc-panel-diagnostico-stat">
                <div class="gc-panel-diagnostico-stat-label">Disciplinas Oficiais</div>
                <div class="gc-panel-diagnostico-stat-value">
                  {diagnostico.estatisticasParser.disciplinasOficiais}
                </div>
              </div>
              <div class="gc-panel-diagnostico-stat">
                <div class="gc-panel-diagnostico-stat-label">Tópicos Total</div>
                <div class="gc-panel-diagnostico-stat-value">
                  {diagnostico.estatisticasParser.topicosTotal}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



