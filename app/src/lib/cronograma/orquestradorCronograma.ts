// src/lib/cronograma/orquestradorCronograma.ts

import { addDays, getDay } from "date-fns";

/**
 * ===========================
 * PREFERÊNCIAS DO ALUNO
 * ===========================
 * FASE 3 — calendário semanal
 */
export interface PreferenciasAluno {
  horasPorDia: number;
  dataInicio?: Date;

  /**
   * Dias da semana em que o aluno estuda
   * 0 = Domingo | 6 = Sábado
   * Ex: [1,2,3,4,5] (seg a sex)
   */
  diasDaSemana?: number[];

  /**
   * Peso por disciplina
   */
  pesosPorDisciplina?: Record<string, number>;
}

/**
 * ===========================
 * MODELOS DO CRONOGRAMA
 * ===========================
 */
export interface CronogramaDisciplinaDia {
  disciplina: string;
  topicos: string[];
  cargaHoras: number;
}

export interface CronogramaDia {
  data: Date;
  cargaHoras: number;
  disciplinas: CronogramaDisciplinaDia[];
}

export interface CronogramaFinal {
  dias: CronogramaDia[];
  totalDias: number;
  totalTopicos: number;
}

/**
 * ===========================
 * TIPOS INTERNOS
 * ===========================
 */
interface FilaDisciplina {
  disciplina: string;
  topicos: string[];
  peso: number;
  cursor: number;
}

/**
 * ===========================
 * ORQUESTRADOR – FASE 3
 * ===========================
 */
export function gerarCronogramaCanonico(
  parserResult: any,
  preferencias: PreferenciasAluno
): CronogramaFinal {
  console.log("[Cronograma] Iniciando geração (FASE 3)");

  const dataInicio = preferencias.dataInicio ?? new Date();
  const horasPorDia = preferencias.horasPorDia;
  const pesos = preferencias.pesosPorDisciplina ?? {};
  const diasValidos =
    preferencias.diasDaSemana ?? [1, 2, 3, 4, 5]; // default seg–sex

  console.log("[Cronograma] Preferências:", preferencias);

  /**
   * ===========================
   * 1. Preparar filas
   * ===========================
   */
  const disciplinas = parserResult?.disciplinas ?? [];

  const filas: FilaDisciplina[] = disciplinas.map((disc: any) => ({
    disciplina: disc.nome ?? "Disciplina desconhecida",
    topicos: Array.isArray(disc.topicos) ? [...disc.topicos] : [],
    peso: pesos[disc.nome] ?? 1,
    cursor: 0,
  }));

  const totalTopicos = filas.reduce(
    (acc: number, f: FilaDisciplina) => acc + f.topicos.length,
    0
  );

  console.log("[Cronograma] Total de tópicos únicos:", totalTopicos);

  /**
   * ===========================
   * 2. Distribuição com calendário semanal
   * ===========================
   */
  const dias: CronogramaDia[] = [];
  let diaIndex = 0;
  let dataCursor = dataInicio;

  while (filas.some((f: FilaDisciplina) => f.cursor < f.topicos.length)) {
    // Avança até um dia válido
    while (!diasValidos.includes(getDay(dataCursor))) {
      dataCursor = addDays(dataCursor, 1);
    }

    console.log(
      `[Cronograma] Montando dia ${diaIndex + 1} – ${dataCursor.toDateString()}`
    );

    const disciplinasDoDia: Record<
      string,
      CronogramaDisciplinaDia
    > = {};

    const topicosUsadosNoDia = new Set<string>();
    let cargaRestante = horasPorDia;

    const disciplinasOrdenadas = [...filas].sort(
      (a: FilaDisciplina, b: FilaDisciplina) => {
        const prioridadeA = a.peso * (a.topicos.length - a.cursor);
        const prioridadeB = b.peso * (b.topicos.length - b.cursor);
        return prioridadeB - prioridadeA;
      }
    );

    for (const fila of disciplinasOrdenadas) {
      if (cargaRestante <= 0) break;
      if (fila.cursor >= fila.topicos.length) continue;

      const topico = fila.topicos[fila.cursor];
      if (topicosUsadosNoDia.has(topico)) continue;

      if (!disciplinasDoDia[fila.disciplina]) {
        disciplinasDoDia[fila.disciplina] = {
          disciplina: fila.disciplina,
          topicos: [],
          cargaHoras: 0,
        };
      }

      disciplinasDoDia[fila.disciplina].topicos.push(topico);
      disciplinasDoDia[fila.disciplina].cargaHoras += 1;

      topicosUsadosNoDia.add(topico);
      fila.cursor += 1;
      cargaRestante -= 1;
    }

    dias.push({
      data: dataCursor,
      cargaHoras: horasPorDia - cargaRestante,
      disciplinas: Object.values(disciplinasDoDia),
    });

    diaIndex += 1;
    dataCursor = addDays(dataCursor, 1);
  }

  console.log("[Cronograma] Cronograma FASE 3 gerado com sucesso");
  console.log("[Cronograma] Total de dias:", dias.length);

  return {
    dias,
    totalDias: dias.length,
    totalTopicos,
  };
}
