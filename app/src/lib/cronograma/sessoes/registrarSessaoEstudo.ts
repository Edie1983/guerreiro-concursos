// src/lib/cronograma/sessoes/registrarSessaoEstudo.ts

/**
 * ===========================
 * REGISTRO DE SESSÕES (FASE 5)
 * MODO SILENCIOSO
 * ===========================
 */

export type SessaoEstudoEvento = {
  data: string; // YYYY-MM-DD
  topicosPlanejados: string[];
  topicosEstudados: string[];
  duracaoBlocos: number; // ex: 1 = ~30min, 2 = ~1h
  realizada: boolean;
};

export interface HistoricoSessoes {
  sessoes: SessaoEstudoEvento[];
}

/**
 * Registro simples e imutável.
 * Não interpreta.
 * Não julga.
 * Não ajusta nada.
 */
export function registrarSessaoEstudo(
  historico: HistoricoSessoes,
  evento: SessaoEstudoEvento
): HistoricoSessoes {
  return {
    sessoes: [...historico.sessoes, evento],
  };
}
