// src/gc/dev/gcTelemetry.ts
// Telemetria DEV-only para política de UX (PASSO W)

import type { GcUxDecision } from "../uxPolicy";

const STORAGE_KEY = "gc:telemetry:v1";

type TelemetryData = {
  version: 1;
  startedAt: number;
  decisions: {
    total: number;
    byMode: Record<string, number>;
    bySeverity: Record<string, number>;
    byKey: Record<string, number>;
  };
  actions: {
    total: number;
    byAction: Record<string, number>;
    byMode?: Record<string, number>;
  };
  last: {
    decision?: any;
    action?: any;
  };
};

// Guard DEV-only e SSR-safe
function isEnabled(): boolean {
  return typeof window !== "undefined" && import.meta.env.DEV;
}

// Carrega dados do localStorage
function loadData(): TelemetryData {
  if (!isEnabled()) {
    return getDefaultData();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Valida estrutura básica
      if (parsed && typeof parsed.version === "number" && parsed.decisions && parsed.actions) {
        return parsed as TelemetryData;
      }
    }
  } catch (e) {
    console.warn("[gcTelemetry] Erro ao carregar dados:", e);
  }

  return getDefaultData();
}

// Dados padrão
function getDefaultData(): TelemetryData {
  return {
    version: 1,
    startedAt: Date.now(),
    decisions: {
      total: 0,
      byMode: {},
      bySeverity: {},
      byKey: {},
    },
    actions: {
      total: 0,
      byAction: {},
      byMode: {},
    },
    last: {},
  };
}

// Salva dados no localStorage
function saveData(data: TelemetryData): void {
  if (!isEnabled()) return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("[gcTelemetry] Erro ao salvar dados:", e);
  }
}

// Obtém key do motivo principal
function getDecisionKey(decision: GcUxDecision, providedKey?: string): string {
  // PASSO W.1: Prioriza providedKey > decision.key > heurística
  if (providedKey) return providedKey;
  if (decision.key) return decision.key;
  
  // Tenta inferir pela combinação title/mode
  // Para OK_COM_ALERTAS, o título é "Posso continuar, mas com risco"
  if (decision.title === "Posso continuar, mas com risco") {
    return "OK_COM_ALERTAS";
  }
  
  // Fallback: usar título como key (normalizado)
  return decision.title.replace(/\s+/g, "_").toUpperCase() || "UNKNOWN";
}

/**
 * Registra uma decisão de UX
 */
export function trackDecision(input: {
  decision: GcUxDecision;
  key?: string;
  source: "processamento" | "detalhes";
}): void {
  if (!isEnabled()) return;

  const data = loadData();
  const { decision, key: providedKey, source } = input;

  // Incrementa contadores
  data.decisions.total++;
  data.decisions.byMode[decision.mode] = (data.decisions.byMode[decision.mode] || 0) + 1;
  data.decisions.bySeverity[decision.severity] = (data.decisions.bySeverity[decision.severity] || 0) + 1;

  const decisionKey = getDecisionKey(decision, providedKey);
  data.decisions.byKey[decisionKey] = (data.decisions.byKey[decisionKey] || 0) + 1;

  // Salva última decisão
  data.last.decision = {
    key: decisionKey,
    mode: decision.mode,
    severity: decision.severity,
    title: decision.title,
    source,
    timestamp: Date.now(),
  };

  saveData(data);
}

/**
 * Registra uma ação do usuário
 */
export function trackAction(input: {
  action: "UPLOAD_OTHER" | "RETRY" | "CONTINUE" | "DISMISS";
  mode?: "BLOCK" | "CONFIRM" | "INFO";
  source: "processamento" | "detalhes";
}): void {
  if (!isEnabled()) return;

  const data = loadData();
  const { action, mode, source } = input;

  // Incrementa contadores
  data.actions.total++;
  data.actions.byAction[action] = (data.actions.byAction[action] || 0) + 1;

  if (mode) {
    if (!data.actions.byMode) {
      data.actions.byMode = {};
    }
    data.actions.byMode[mode] = (data.actions.byMode[mode] || 0) + 1;
  }

  // Salva última ação
  data.last.action = {
    action,
    mode,
    source,
    timestamp: Date.now(),
  };

  saveData(data);
}

/**
 * Retorna snapshot dos dados atuais
 */
export function snapshot(): TelemetryData {
  if (!isEnabled()) {
    return getDefaultData();
  }
  return loadData();
}

/**
 * Reseta todos os dados de telemetria
 */
export function reset(): void {
  if (!isEnabled()) return;

  const newData = getDefaultData();
  saveData(newData);
  console.log("[gcTelemetry] Dados resetados");
}

/**
 * Imprime resumo formatado no console
 */
export function print(): void {
  if (!isEnabled()) {
    console.log("[gcTelemetry] Disponível apenas em DEV");
    return;
  }

  const data = loadData();
  const uptime = Math.floor((Date.now() - data.startedAt) / 1000 / 60); // minutos

  console.log("\n" + "═".repeat(60));
  console.log("  GC TELEMETRIA — Política de UX (PASSO W)");
  console.log("═".repeat(60));
  console.log(`  Iniciado há: ${uptime} minuto(s)`);
  console.log(`  Total de decisões: ${data.decisions.total}`);
  console.log(`  Total de ações: ${data.actions.total}`);

  // Tabela por Mode
  if (Object.keys(data.decisions.byMode).length > 0) {
    console.log("\n  📊 Decisões por Mode:");
    console.table(data.decisions.byMode);
  }

  // Tabela por Severity
  if (Object.keys(data.decisions.bySeverity).length > 0) {
    console.log("\n  📊 Decisões por Severity:");
    console.table(data.decisions.bySeverity);
  }

  // Top Keys (ordenado)
  if (Object.keys(data.decisions.byKey).length > 0) {
    const topKeys = Object.entries(data.decisions.byKey)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .reduce((acc, [key, count]) => {
        acc[key] = count;
        return acc;
      }, {} as Record<string, number>);

    console.log("\n  📊 Top 10 Keys (motivos principais):");
    console.table(topKeys);
  }

  // Tabela por Action
  if (Object.keys(data.actions.byAction).length > 0) {
    console.log("\n  📊 Ações por Tipo:");
    console.table(data.actions.byAction);
  }

  // Ações por Mode (se existir)
  if (data.actions.byMode && Object.keys(data.actions.byMode).length > 0) {
    console.log("\n  📊 Ações por Mode:");
    console.table(data.actions.byMode);
  }

  // Última decisão e ação
  if (data.last.decision) {
    console.log("\n  🔍 Última Decisão:");
    console.log(JSON.stringify(data.last.decision, null, 2));
  }

  if (data.last.action) {
    console.log("\n  🔍 Última Ação:");
    console.log(JSON.stringify(data.last.action, null, 2));
  }

  console.log("═".repeat(60) + "\n");
}

// Expor API em window.gcTelemetry (DEV-only)
if (isEnabled()) {
  (window as any).gcTelemetry = {
    trackDecision,
    trackAction,
    snapshot,
    reset,
    print,
  };

  console.log("[gcTelemetry] ✅ API disponível em window.gcTelemetry");
}

