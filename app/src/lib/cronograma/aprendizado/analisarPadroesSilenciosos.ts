// src/lib/cronograma/aprendizado/analisarPadroesSilenciosos.ts

import { HistoricoSessoes } from "../sessoes/registrarSessaoEstudo";

export type SugestaoSilenciosa =
  | {
      tipo: "AJUSTE_CARGA_DIARIA";
      valorSugerido: number;
      motivo: string;
    }
  | {
      tipo: "DIA_PREFERENCIAL";
      diaSemana: number; // 0 = domingo
      motivo: string;
    }
  | {
      tipo: "TOPICO_RECORRENTE_ADIADO";
      topico: string;
      motivo: string;
    };

export interface ResultadoAprendizadoSilencioso {
  diasObservados: number;
  sugestoes: SugestaoSilenciosa[];
}

/**
 * ===========================
 * ANALISADOR SILENCIOSO
 * ===========================
 * Não decide. Não aplica. Só observa.
 */
export function analisarPadroesSilenciosos(
  historico: HistoricoSessoes
): ResultadoAprendizadoSilencioso {
  const sugestoes: SugestaoSilenciosa[] = [];

  if (historico.sessoes.length < 14) {
    return {
      diasObservados: historico.sessoes.length,
      sugestoes: [],
    };
  }

  let totalPlanejados = 0;
  let totalEstudados = 0;

  const contadorDiasSemana = new Map<number, number>();
  const contadorTopicosAdiadas = new Map<string, number>();

  for (const sessao of historico.sessoes) {
    totalPlanejados += sessao.topicosPlanejados.length;
    totalEstudados += sessao.topicosEstudados.length;

    const diaSemana = new Date(sessao.data).getDay();
    contadorDiasSemana.set(
      diaSemana,
      (contadorDiasSemana.get(diaSemana) ?? 0) + 1
    );

    for (const topico of sessao.topicosPlanejados) {
      if (!sessao.topicosEstudados.includes(topico)) {
        contadorTopicosAdiadas.set(
          topico,
          (contadorTopicosAdiadas.get(topico) ?? 0) + 1
        );
      }
    }
  }

  const taxaRealizacao =
    totalPlanejados === 0 ? 0 : totalEstudados / totalPlanejados;

  if (taxaRealizacao < 0.7) {
    sugestoes.push({
      tipo: "AJUSTE_CARGA_DIARIA",
      valorSugerido: -1,
      motivo:
        "Carga diária frequentemente acima do que foi possível cumprir",
    });
  }

  let melhorDia: number | null = null;
  let max = 0;

  for (const [dia, count] of Array.from(contadorDiasSemana.entries())) {
    if (count > max) {
      melhorDia = dia;
      max = count;
    }
  }

  if (melhorDia !== null) {
    sugestoes.push({
      tipo: "DIA_PREFERENCIAL",
      diaSemana: melhorDia,
      motivo: "Maior recorrência de sessões realizadas neste dia",
    });
  }

  for (const [topico, count] of Array.from(contadorTopicosAdiadas.entries())) {
    if (count >= 3) {
      sugestoes.push({
        tipo: "TOPICO_RECORRENTE_ADIADO",
        topico,
        motivo: "Tópico frequentemente planejado mas não estudado",
      });
    }
  }

  return {
    diasObservados: historico.sessoes.length,
    sugestoes,
  };
}
