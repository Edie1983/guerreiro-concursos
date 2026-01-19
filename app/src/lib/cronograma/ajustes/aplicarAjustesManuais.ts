// src/lib/cronograma/ajustes/aplicarAjustesManuais.ts

import { CronogramaFinal, CronogramaDisciplinaDia } from "../orquestradorCronograma";

/**
 * ===========================
 * EVENTOS DE AJUSTE MANUAL
 * ===========================
 * Regra: toda data aqui é "YYYY-MM-DD"
 */
export type AjusteManualEvento =
  | {
      tipo: "MOVE_TOPICO";
      topico: string;
      dataOrigem: string; // YYYY-MM-DD
      dataDestino: string; // YYYY-MM-DD
    }
  | {
      tipo: "REORDER_TOPICO";
      data: string; // YYYY-MM-DD
      disciplina: string;
      novaOrdem: string[];
    }
  | {
      tipo: "MARCAR_CONCLUIDO";
      topico: string;
    }
  | {
      tipo: "PAUSAR_DIA";
      data: string; // YYYY-MM-DD
    }
  | {
      tipo: "DESPAUSAR_DIA";
      data: string; // YYYY-MM-DD
    };

/**
 * ===========================
 * ESTADO DERIVADO
 * ===========================
 */
export interface EstadoCronogramaDerivado {
  cronograma: CronogramaFinal;
  diasPausados: Set<string>; // YYYY-MM-DD
  topicosConcluidos: Set<string>;
}

/**
 * ===========================
 * APLICADOR DE AJUSTES
 * ===========================
 */
export function aplicarAjustesManuais(
  cronogramaBase: CronogramaFinal,
  eventos: AjusteManualEvento[]
): EstadoCronogramaDerivado {
  const diasPausados = new Set<string>();
  const topicosConcluidos = new Set<string>();

  // Clonagem defensiva
  const cronograma: CronogramaFinal = JSON.parse(JSON.stringify(cronogramaBase));

  for (const evento of eventos) {
    switch (evento.tipo) {
      case "PAUSAR_DIA":
        diasPausados.add(evento.data);
        break;

      case "DESPAUSAR_DIA":
        diasPausados.delete(evento.data);
        break;

      case "MARCAR_CONCLUIDO":
        topicosConcluidos.add(evento.topico);
        break;

      case "MOVE_TOPICO":
        moverTopicoMantendoDisciplina(cronograma, evento.topico, evento.dataOrigem, evento.dataDestino);
        break;

      case "REORDER_TOPICO":
        reordenarTopicos(cronograma, evento.data, evento.disciplina, evento.novaOrdem);
        break;
    }
  }

  return {
    cronograma,
    diasPausados,
    topicosConcluidos,
  };
}

/**
 * ===========================
 * UTIL: normaliza Date -> "YYYY-MM-DD" (LOCAL, sem UTC)
 * ===========================
 * Evita bug de timezone (toISOString pode mudar o dia).
 */
function toYmdLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function normalizarDia(dia: Date | string): string {
  return typeof dia === "string" ? dia : toYmdLocal(dia);
}

/**
 * ===========================
 * MOVE: remove do dia origem e adiciona no dia destino
 * Mantém a disciplina original.
 * ===========================
 */
function moverTopicoMantendoDisciplina(
  cronograma: CronogramaFinal,
  topico: string,
  dataOrigem: string,
  dataDestino: string
) {
  const origemYmd = normalizarDia(dataOrigem);
  const destinoYmd = normalizarDia(dataDestino);

  let disciplinaOrigem: string | null = null;

  // 1) Remover do dia origem e descobrir disciplina
  for (const dia of cronograma.dias) {
    const diaYmd = normalizarDia(dia.data);
    if (diaYmd !== origemYmd) continue;

    for (const disc of dia.disciplinas) {
      const idx = disc.topicos.indexOf(topico);
      if (idx !== -1) {
        disc.topicos.splice(idx, 1);
        disc.cargaHoras = Math.max(0, disc.cargaHoras - 1);
        disciplinaOrigem = disc.disciplina;
        break;
      }
    }

    break;
  }

  if (!disciplinaOrigem) return;

  // 2) Adicionar no dia destino na mesma disciplina
  for (const dia of cronograma.dias) {
    const diaYmd = normalizarDia(dia.data);
    if (diaYmd !== destinoYmd) continue;

    let discDestino = dia.disciplinas.find((d: CronogramaDisciplinaDia) => d.disciplina === disciplinaOrigem);

    if (!discDestino) {
      discDestino = {
        disciplina: disciplinaOrigem,
        topicos: [],
        cargaHoras: 0,
      };
      dia.disciplinas.push(discDestino);
    }

    // Evitar duplicar o mesmo tópico dentro do mesmo dia/disciplina
    if (!discDestino.topicos.includes(topico)) {
      discDestino.topicos.push(topico);
      discDestino.cargaHoras += 1;
    }

    break;
  }
}

/**
 * ===========================
 * REORDER: redefine ordem de tópicos da disciplina no dia
 * ===========================
 */
function reordenarTopicos(
  cronograma: CronogramaFinal,
  data: string,
  disciplina: string,
  novaOrdem: string[]
) {
  const dataYmd = normalizarDia(data);

  for (const dia of cronograma.dias) {
    const diaYmd = normalizarDia(dia.data);
    if (diaYmd !== dataYmd) continue;

    const disc = dia.disciplinas.find((d: CronogramaDisciplinaDia) => d.disciplina === disciplina);
    if (!disc) return;

    // Mantém apenas tópicos existentes, mas na ordem nova
    const setExistentes = new Set(disc.topicos);
    const filtrada = novaOrdem.filter((t) => setExistentes.has(t));

    // Se o usuário passou uma lista incompleta, apenda os restantes no final
    const restantes = disc.topicos.filter((t) => !filtrada.includes(t));

    disc.topicos = [...filtrada, ...restantes];
    return;
  }
}
