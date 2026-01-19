// src/components/dev/PanelTelemetryGc.tsx
// Painel Visual de Telemetria GC (PASSO X - DEV-only)

import { useState, useEffect, useRef, useCallback } from "preact/hooks";
import { snapshot, reset } from "../../gc/dev/gcTelemetry";
import "./PanelTelemetryGc.css";

export function PanelTelemetryGc() {
  // Guard DEV-only e SSR-safe (duplo guard)
  if (typeof window === "undefined") return null;
  if (!import.meta.env.DEV) return null;

  // Helper para verificar disponibilidade (recalcula a cada chamada)
  const checkTelemetryAvailable = () => {
    return typeof (window as any).gcTelemetry !== "undefined";
  };

  const [data, setData] = useState(() => {
    try {
      return snapshot();
    } catch (e) {
      console.warn("[PanelTelemetryGc] Erro ao carregar snapshot inicial:", e);
      return {
        version: 1,
        startedAt: Date.now(),
        decisions: { total: 0, byMode: {}, bySeverity: {}, byKey: {} },
        actions: { total: 0, byAction: {}, byMode: {} },
        last: {},
      };
    }
  });
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const intervalRef = useRef<number | null>(null);

  // Função para atualizar dados (robusta, memoizada)
  const handleRefresh = useCallback(() => {
    try {
      if (!checkTelemetryAvailable()) {
        console.warn("[PanelTelemetryGc] Telemetria indisponível");
        return;
      }
      setData(snapshot());
      setLastUpdate(Date.now());
    } catch (e) {
      console.warn("[PanelTelemetryGc] Erro ao atualizar snapshot:", e);
    }
  }, []);

  // Função para resetar (robusta)
  const handleReset = () => {
    try {
      if (!checkTelemetryAvailable()) {
        console.warn("[PanelTelemetryGc] Telemetria indisponível para reset");
        return;
      }
      reset();
      handleRefresh();
    } catch (e) {
      console.warn("[PanelTelemetryGc] Erro ao resetar:", e);
    }
  };

  // Auto-refresh seguro com cleanup obrigatório
  useEffect(() => {
    if (!checkTelemetryAvailable()) return;

    // Limpar interval anterior se existir (anti-vazamento)
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Criar novo interval
    intervalRef.current = window.setInterval(handleRefresh, 2000);

    // Cleanup obrigatório
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [handleRefresh]); // handleRefresh é memoizado, então é estável

  const uptime = Math.floor((Date.now() - data.startedAt) / 1000 / 60); // minutos

  // Top 10 keys ordenado desc
  const topKeys = Object.entries(data.decisions.byKey)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  // Se telemetria não estiver disponível, mostrar aviso DEV
  if (!checkTelemetryAvailable()) {
    return (
      <div class="gc-panel-telemetry">
        <div class="gc-panel-telemetry-header">
          <div class="gc-panel-telemetry-title">📊 Telemetria GC (DEV)</div>
        </div>
        <div class="gc-panel-telemetry-unavailable">
          ⚠️ Telemetria indisponível. Verifique se window.gcTelemetry está disponível.
        </div>
      </div>
    );
  }

  return (
    <div class="gc-panel-telemetry">
      <div class="gc-panel-telemetry-header">
        <div class="gc-panel-telemetry-title">📊 Telemetria GC (DEV)</div>
        <div class="gc-panel-telemetry-actions">
          <button
            class="gc-panel-telemetry-btn"
            onClick={handleRefresh}
            title="Atualizar dados"
            disabled={!checkTelemetryAvailable()}
          >
            🔄 Atualizar
          </button>
          <button
            class="gc-panel-telemetry-btn gc-panel-telemetry-btn-danger"
            onClick={handleReset}
            title="Resetar todos os dados"
            disabled={!checkTelemetryAvailable()}
          >
            🗑️ Resetar
          </button>
        </div>
      </div>

      <div class="gc-panel-telemetry-grid">
        {/* Seção RESUMO */}
        <div class="gc-panel-telemetry-section gc-panel-telemetry-section-full">
          <div class="gc-panel-telemetry-section-title">
            <span>📈</span> Resumo Geral
          </div>
          <div class="gc-panel-telemetry-stats">
            <div class="gc-panel-telemetry-stat">
              <div class="gc-panel-telemetry-stat-label">Iniciado há</div>
              <div class="gc-panel-telemetry-stat-value">{uptime} minuto(s)</div>
            </div>
            <div class="gc-panel-telemetry-stat">
              <div class="gc-panel-telemetry-stat-label">Total de Decisões</div>
              <div class="gc-panel-telemetry-stat-value">{data.decisions.total}</div>
            </div>
            <div class="gc-panel-telemetry-stat">
              <div class="gc-panel-telemetry-stat-label">Total de Ações</div>
              <div class="gc-panel-telemetry-stat-value">{data.actions.total}</div>
            </div>
            <div class="gc-panel-telemetry-stat">
              <div class="gc-panel-telemetry-stat-label">Última atualização</div>
              <div class="gc-panel-telemetry-stat-value">
                {new Date(lastUpdate).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>

        {/* Seção DECISÕES POR MODE */}
        <div class="gc-panel-telemetry-section">
          <div class="gc-panel-telemetry-section-title">
            <span>🎯</span> Decisões por Mode
          </div>
          <div class="gc-panel-telemetry-list">
            {Object.keys(data.decisions.byMode).length > 0 ? (
              Object.entries(data.decisions.byMode)
                .sort(([, a], [, b]) => b - a)
                .map(([mode, count]) => (
                  <div key={mode} class="gc-panel-telemetry-item">
                    <div class="gc-panel-telemetry-item-label">{mode}</div>
                    <div class="gc-panel-telemetry-item-value">{count}</div>
                  </div>
                ))
            ) : (
              <div class="gc-panel-telemetry-empty">Nenhuma decisão registrada</div>
            )}
          </div>
        </div>

        {/* Seção DECISÕES POR SEVERITY */}
        <div class="gc-panel-telemetry-section">
          <div class="gc-panel-telemetry-section-title">
            <span>⚠️</span> Decisões por Severity
          </div>
          <div class="gc-panel-telemetry-list">
            {Object.keys(data.decisions.bySeverity).length > 0 ? (
              Object.entries(data.decisions.bySeverity)
                .sort(([, a], [, b]) => b - a)
                .map(([severity, count]) => (
                  <div key={severity} class="gc-panel-telemetry-item">
                    <div class="gc-panel-telemetry-item-label">{severity}</div>
                    <div class={`gc-panel-telemetry-item-value gc-severity-${severity.toLowerCase()}`}>
                      {count}
                    </div>
                  </div>
                ))
            ) : (
              <div class="gc-panel-telemetry-empty">Nenhuma decisão registrada</div>
            )}
          </div>
        </div>

        {/* Seção TOP 10 KEYS */}
        <div class="gc-panel-telemetry-section gc-panel-telemetry-section-full">
          <div class="gc-panel-telemetry-section-title">
            <span>🔑</span> Top 10 Keys (motivos principais)
          </div>
          <div class="gc-panel-telemetry-list">
            {topKeys.length > 0 ? (
              topKeys.map(([key, count], idx) => (
                <div key={key} class="gc-panel-telemetry-item">
                  <div class="gc-panel-telemetry-item-label">
                    <span class="gc-panel-telemetry-rank">#{idx + 1}</span> {key}
                  </div>
                  <div class="gc-panel-telemetry-item-value">{count}</div>
                </div>
              ))
            ) : (
              <div class="gc-panel-telemetry-empty">Nenhuma key registrada</div>
            )}
          </div>
        </div>

        {/* Seção AÇÕES POR TIPO */}
        <div class="gc-panel-telemetry-section">
          <div class="gc-panel-telemetry-section-title">
            <span>⚡</span> Ações por Tipo
          </div>
          <div class="gc-panel-telemetry-list">
            {Object.keys(data.actions.byAction).length > 0 ? (
              Object.entries(data.actions.byAction)
                .sort(([, a], [, b]) => b - a)
                .map(([action, count]) => (
                  <div key={action} class="gc-panel-telemetry-item">
                    <div class="gc-panel-telemetry-item-label">{action}</div>
                    <div class="gc-panel-telemetry-item-value">{count}</div>
                  </div>
                ))
            ) : (
              <div class="gc-panel-telemetry-empty">Nenhuma ação registrada</div>
            )}
          </div>
        </div>

        {/* Seção AÇÕES POR MODE (se existir) */}
        {data.actions.byMode && Object.keys(data.actions.byMode).length > 0 && (
          <div class="gc-panel-telemetry-section">
            <div class="gc-panel-telemetry-section-title">
              <span>🎭</span> Ações por Mode
            </div>
            <div class="gc-panel-telemetry-list">
              {Object.entries(data.actions.byMode)
                .sort(([, a], [, b]) => b - a)
                .map(([mode, count]) => (
                  <div key={mode} class="gc-panel-telemetry-item">
                    <div class="gc-panel-telemetry-item-label">{mode}</div>
                    <div class="gc-panel-telemetry-item-value">{count}</div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Seção ÚLTIMA DECISÃO */}
        {data.last && "decision" in data.last && data.last.decision && (
          <div class="gc-panel-telemetry-section">
            <div class="gc-panel-telemetry-section-title">
              <span>🔍</span> Última Decisão
            </div>
            <details class="gc-panel-telemetry-details">
              <summary class="gc-panel-telemetry-summary">
                {data.last.decision.key} ({data.last.decision.mode})
              </summary>
              <pre class="gc-panel-telemetry-pre">{JSON.stringify(data.last.decision, null, 2)}</pre>
            </details>
          </div>
        )}

        {/* Seção ÚLTIMA AÇÃO */}
        {data.last && "action" in data.last && data.last.action && (
          <div class="gc-panel-telemetry-section">
            <div class="gc-panel-telemetry-section-title">
              <span>🎬</span> Última Ação
            </div>
            <details class="gc-panel-telemetry-details">
              <summary class="gc-panel-telemetry-summary">
                {data.last.action.action} {data.last.action.mode && `(${data.last.action.mode})`}
              </summary>
              <pre class="gc-panel-telemetry-pre">{JSON.stringify(data.last.action, null, 2)}</pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}

