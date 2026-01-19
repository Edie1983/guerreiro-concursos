// src/lib/cronograma/gerarCronograma.ts
// Motor de Cronograma Determinístico (sem IA)
// Gera cronograma de estudo baseado no Mapa Tático

import type {
  CronogramaConfig,
  CronogramaGerado,
  CronogramaSemana,
  CronogramaDia,
  CronogramaBloco,
} from "./types";
import type { MapaTatico } from "../mapaTatico/gerarMapaTatico";
import {
  calcularTotalMinutosSemana,
  aplicarPisoMinimoPorDisciplina,
  arredondarDuracao,
} from "./regras";

/**
 * Calcula número de semanas até a data da prova
 */
function calcularSemanasAteDataProva(dataProva: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const prova = new Date(dataProva + "T00:00:00");
  const diffMs = prova.getTime() - hoje.getTime();
  const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const semanas = Math.ceil(diffDias / 7);
  // Limites: mínimo 1 semana, máximo 52 semanas
  return Math.max(1, Math.min(52, semanas));
}

/**
 * Gera datas dos dias ativos para uma semana específica
 */
function gerarDiasSemana(
  semanaIndice: number,
  config: CronogramaConfig,
  dataInicio: Date
): Date[] {
  const dias: Date[] = [];
  const inicioSemana = new Date(dataInicio);
  inicioSemana.setDate(dataInicio.getDate() + (semanaIndice - 1) * 7);

  for (let i = 0; i < 7; i++) {
    const dia = new Date(inicioSemana);
    dia.setDate(inicioSemana.getDate() + i);
    const diaSemana = dia.getDay(); // 0=domingo, 6=sábado

    if (config.diasSemanaAtivos.includes(diaSemana)) {
      dias.push(dia);
    }
  }

  return dias;
}

/**
 * Distribui minutos de estudo proporcionalmente ao scorePrioridade
 */
function distribuirMinutosEstudo(
  mapa: MapaTatico,
  totalMinutosEstudo: number,
  minutosPiso: Map<string, number>
): Map<string, number> {
  const distribuicao = new Map<string, number>();

  // Calcula soma total de scores (para normalização)
  // Proteção: trata scorePrioridade undefined/NaN como 0
  const somaScores = mapa.disciplinas.reduce(
    (sum, d) => {
      const score = d.scorePrioridade ?? 0;
      return sum + (isNaN(score) ? 0 : score);
    },
    0
  );

  if (somaScores === 0) {
    // Fallback: distribui igualmente
    const minutosPorDisciplina = totalMinutosEstudo / mapa.totalDisciplinas;
    for (const disciplina of mapa.disciplinas) {
      distribuicao.set(disciplina.nome, minutosPorDisciplina);
    }
    return distribuicao;
  }

  // Distribui proporcionalmente ao score
  let minutosRestantes = totalMinutosEstudo;

  // Primeiro, aplica piso mínimo (se houver)
  Array.from(minutosPiso.entries()).forEach(([nome, minutos]) => {
    distribuicao.set(nome, minutos);
    minutosRestantes -= minutos;
  });

  // Depois, distribui o restante proporcionalmente ao score
  const minutosDisponiveis = Math.max(0, minutosRestantes);
  for (const disciplina of mapa.disciplinas) {
    const minutosJaAlocados = distribuicao.get(disciplina.nome) || 0;
    // Proteção: trata scorePrioridade undefined/NaN como 0
    const score = disciplina.scorePrioridade ?? 0;
    const scoreValido = isNaN(score) ? 0 : score;
    const proporcao = somaScores > 0 ? scoreValido / somaScores : 0;
    const minutosAdicionais = minutosDisponiveis * proporcao;
    distribuicao.set(disciplina.nome, minutosJaAlocados + minutosAdicionais);
  }

  return distribuicao;
}

/**
 * Cria blocos de estudo para uma disciplina em uma semana
 */
function criarBlocosEstudo(
  disciplinaNome: string,
  disciplinaRank: number,
  disciplinaScore: number,
  minutosTotais: number,
  baseDuracao: number = 25
): CronogramaBloco[] {
  const blocos: CronogramaBloco[] = [];
  let minutosRestantes = Math.max(0, minutosTotais); // Proteção: não negativo

  while (minutosRestantes >= baseDuracao) {
    const duracao = Math.min(minutosRestantes, baseDuracao * 2); // Máximo 50 min por bloco
    const duracaoArredondada = arredondarDuracao(duracao, baseDuracao);

    // Proteção: não criar bloco maior que o restante
    const duracaoFinal = Math.min(duracaoArredondada, minutosRestantes);

    blocos.push({
      tipo: "ESTUDO",
      duracaoMin: duracaoFinal,
      disciplinaNome,
      disciplinaRank,
      disciplinaScore: disciplinaScore ?? 0, // Proteção: score undefined/NaN
      origem: `rank ${disciplinaRank}`,
    });

    minutosRestantes -= duracaoFinal;
  }

  return blocos;
}

/**
 * Agenda revisões para um bloco de estudo
 * Revisões: D+1, D+7, D+21 (se dentro do horizonte)
 */
function agendarRevisoes(
  blocoEstudo: CronogramaBloco,
  dataEstudo: Date,
  horizonteSemanas: number,
  revisoesAgendadas: Array<{ data: Date; bloco: CronogramaBloco }>
): void {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dataFim = new Date(hoje);
  dataFim.setDate(hoje.getDate() + horizonteSemanas * 7);

  const intervalos = [1, 7, 21]; // D+1, D+7, D+21

  for (const intervalo of intervalos) {
    const dataRevisao = new Date(dataEstudo);
    dataRevisao.setDate(dataEstudo.getDate() + intervalo);

    // Só agenda se estiver dentro do horizonte
    if (dataRevisao <= dataFim) {
      revisoesAgendadas.push({
        data: dataRevisao,
        bloco: {
          tipo: "REVISAO",
          duracaoMin: blocoEstudo.duracaoMin,
          disciplinaNome: blocoEstudo.disciplinaNome,
          disciplinaRank: blocoEstudo.disciplinaRank,
          disciplinaScore: blocoEstudo.disciplinaScore,
          origem: `revisão D+${intervalo}`,
        },
      });
    }
  }
}

/**
 * Corta revisões se excederem o orçamento de minutos de revisão
 * Prioridade: corta D+21 primeiro, depois D+7, depois D+1
 */
function cortarRevisoesExcedentes(
  revisoesAgendadas: Array<{ data: Date; bloco: CronogramaBloco }>,
  minutosRevisaoDisponiveis: number
): Array<{ data: Date; bloco: CronogramaBloco }> {
  // Separa revisões por intervalo (D+1, D+7, D+21)
  const revisoesPorIntervalo: Record<number, Array<{ data: Date; bloco: CronogramaBloco }>> = {
    1: [],
    7: [],
    21: [],
  };

  for (const revisao of revisoesAgendadas) {
    const origem = revisao.bloco.origem || "";
    let intervalo = 0;
    if (origem.includes("D+21")) intervalo = 21;
    else if (origem.includes("D+7")) intervalo = 7;
    else if (origem.includes("D+1")) intervalo = 1;

    if (intervalo > 0) {
      revisoesPorIntervalo[intervalo].push(revisao);
    }
  }

  // Ordena cada grupo por data
  revisoesPorIntervalo[1].sort((a, b) => a.data.getTime() - b.data.getTime());
  revisoesPorIntervalo[7].sort((a, b) => a.data.getTime() - b.data.getTime());
  revisoesPorIntervalo[21].sort((a, b) => a.data.getTime() - b.data.getTime());

  // Prioridade de corte: D+21 primeiro, depois D+7, depois D+1
  // Então mantemos: D+1 primeiro, depois D+7, depois D+21
  const revisoesFinais: Array<{ data: Date; bloco: CronogramaBloco }> = [];
  let minutosUsados = 0;

  // Processa em ordem de prioridade (D+1 primeiro, depois D+7, depois D+21)
  const ordemPrioridade = [1, 7, 21];
  for (const intervalo of ordemPrioridade) {
    for (const revisao of revisoesPorIntervalo[intervalo]) {
      const minutosRevisao = revisao.bloco.duracaoMin;
      if (minutosUsados + minutosRevisao <= minutosRevisaoDisponiveis) {
        revisoesFinais.push(revisao);
        minutosUsados += minutosRevisao;
      }
      // Se exceder, não adiciona (corta)
    }
  }

  // Reordena por data para retorno
  revisoesFinais.sort((a, b) => a.data.getTime() - b.data.getTime());

  return revisoesFinais;
}

/**
 * Gera cronograma determinístico a partir do Mapa Tático
 */
export function gerarCronograma(
  mapaTatico: MapaTatico,
  config: CronogramaConfig
): CronogramaGerado {
  // a) Determinar horizonte
  let horizonteSemanas: number;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  if (config.dataProva) {
    horizonteSemanas = calcularSemanasAteDataProva(config.dataProva);
  } else {
    horizonteSemanas = Math.max(1, config.horizonteSemanas || 4);
  }

  // b) Calcular minutos semanais
  const minutosSemana = calcularTotalMinutosSemana(config);

  // c) Separar revisão
  const minutosRevisao = Math.floor(minutosSemana * config.percentRevisao);
  const minutosEstudo = minutosSemana - minutosRevisao;

  // d) Distribuir minutosEstudo proporcional ao scorePrioridade
  const minutosPiso = aplicarPisoMinimoPorDisciplina(
    mapaTatico,
    minutosEstudo,
    1
  );
  const distribuicaoMinutos = distribuirMinutosEstudo(
    mapaTatico,
    minutosEstudo,
    minutosPiso
  );

  // e) Gerar semanas e dias
  const semanas: CronogramaSemana[] = [];
  const revisoesAgendadas: Array<{ data: Date; bloco: CronogramaBloco }> = [];

  // Calcula total de dias ativos no horizonte
  let totalDiasAtivos = 0;
  for (let s = 1; s <= horizonteSemanas; s++) {
    const diasSemana = gerarDiasSemana(s, config, hoje);
    totalDiasAtivos += diasSemana.length;
  }

  // Acumuladores de minutos por disciplina (para distribuição progressiva)
  const minutosAcumulados = new Map<string, number>();
  for (const disciplina of mapaTatico.disciplinas) {
    minutosAcumulados.set(disciplina.nome, 0);
  }

  for (let semanaIdx = 1; semanaIdx <= horizonteSemanas; semanaIdx++) {
    const diasSemana = gerarDiasSemana(semanaIdx, config, hoje);
    const dias: CronogramaDia[] = [];

    // Para cada dia da semana
    for (const diaData of diasSemana) {
      const blocos: CronogramaBloco[] = [];
      let totalMinDia = 0;
      const maxMinutosDia = config.horasPorDia * 60; // Invariante: não exceder horasPorDia

      // Distribui blocos de estudo por disciplina (proporcional ao score)
      // Usa distribuição progressiva para evitar concentração
      for (const disciplina of mapaTatico.disciplinas) {
        // Invariante: não exceder minutos disponíveis do dia
        if (totalMinDia >= maxMinutosDia) break;

        const minutosDisciplinaTotal =
          distribuicaoMinutos.get(disciplina.nome) || 0;
        const minutosPorDia = minutosDisciplinaTotal / totalDiasAtivos;
        const minutosAcum = minutosAcumulados.get(disciplina.nome) || 0;

        // Se ainda há minutos a distribuir para esta disciplina
        if (minutosAcum < minutosDisciplinaTotal && minutosPorDia > 0) {
          const minutosRestantes = minutosDisciplinaTotal - minutosAcum;
          const minutosParaEsteDia = Math.min(
            minutosPorDia,
            minutosRestantes,
            maxMinutosDia - totalMinDia // Não exceder limite do dia
          );

          if (minutosParaEsteDia >= 25) {
            // Cria blocos apenas se houver pelo menos 25 minutos
            const blocosDisciplina = criarBlocosEstudo(
              disciplina.nome,
              disciplina.rank,
              disciplina.scorePrioridade ?? 0,
              minutosParaEsteDia
            );

            for (const bloco of blocosDisciplina) {
              // Invariante: não exceder minutos do dia
              if (totalMinDia + bloco.duracaoMin > maxMinutosDia) break;

              blocos.push(bloco);
              totalMinDia += bloco.duracaoMin;

              // Agenda revisões para este bloco de estudo
              agendarRevisoes(bloco, diaData, horizonteSemanas, revisoesAgendadas);

              // Atualiza acumulador
              const novoAcum = minutosAcumulados.get(disciplina.nome) || 0;
              minutosAcumulados.set(disciplina.nome, novoAcum + bloco.duracaoMin);
            }
          }
        }
      }

      dias.push({
        dataISO: diaData.toISOString().split("T")[0],
        totalMin: totalMinDia,
        blocos,
      });
    }

    semanas.push({
      indice: semanaIdx,
      dias,
    });
  }

  // g) Cortar revisões se excederem orçamento
  const totalMinutosRevisaoNecessarios = revisoesAgendadas.reduce(
    (sum, r) => sum + r.bloco.duracaoMin,
    0
  );
  const revisoesFinais = cortarRevisoesExcedentes(
    revisoesAgendadas,
    minutosRevisao * horizonteSemanas
  );

  // Adiciona revisões aos dias correspondentes
  for (const revisao of revisoesFinais) {
    const dataISO = revisao.data.toISOString().split("T")[0];
    const semana = semanas.find((s) =>
      s.dias.some((d) => d.dataISO === dataISO)
    );

    if (semana) {
      const dia = semana.dias.find((d) => d.dataISO === dataISO);
      if (dia) {
        dia.blocos.push(revisao.bloco);
        dia.totalMin += revisao.bloco.duracaoMin;
      }
    }
  }

  // Logs DEV-only
  if (typeof window !== "undefined" && import.meta.env.DEV) {
    const top5 = mapaTatico.disciplinas
      .slice(0, 5)
      .map((d) => ({
        rank: d.rank,
        nome: d.nome,
        score: (d.scorePrioridade ?? 0).toFixed(1),
        minAlocado: Math.round(
          (distribuicaoMinutos.get(d.nome) || 0) / horizonteSemanas
        ),
      }));

    const revisoesCortadas =
      revisoesAgendadas.length - revisoesFinais.length;

    // Conta revisões por intervalo
    const revisoesPorIntervalo = {
      d1: revisoesFinais.filter((r) => r.bloco.origem?.includes("D+1")).length,
      d7: revisoesFinais.filter((r) => r.bloco.origem?.includes("D+7")).length,
      d21: revisoesFinais.filter((r) => r.bloco.origem?.includes("D+21")).length,
    };

    // Verifica invariantes
    let maxMinutosDia = 0;
    let maxMinutosSemana = 0;
    for (const semana of semanas) {
      let minutosSemana = 0;
      for (const dia of semana.dias) {
        minutosSemana += dia.totalMin;
        maxMinutosDia = Math.max(maxMinutosDia, dia.totalMin);
      }
      maxMinutosSemana = Math.max(maxMinutosSemana, minutosSemana);
    }

    console.log(`[gerarCronograma] Cronograma gerado:`, {
      horizonte: horizonteSemanas,
      minSemana: minutosSemana,
      minEstudo: minutosEstudo,
      minRevisao: minutosRevisao,
      top5,
      revisoesGeradas: revisoesAgendadas.length,
      revisoesFinais: revisoesFinais.length,
      revisoesCortadas,
      revisoesPorIntervalo,
      invariantes: {
        maxMinutosDia,
        maxMinutosSemana,
        limiteDia: config.horasPorDia * 60,
        limiteSemana: minutosSemana,
        diaOk: maxMinutosDia <= config.horasPorDia * 60,
        semanaOk: maxMinutosSemana <= minutosSemana,
      },
    });
  }

  // Calcula totais finais
  let totalMinPlanejado = 0;
  let totalMinRevisao = 0;
  let totalBlocosEstudo = 0;
  let totalBlocosRevisao = 0;

  for (const semana of semanas) {
    for (const dia of semana.dias) {
      for (const bloco of dia.blocos) {
        if (bloco.tipo === "ESTUDO") {
          totalMinPlanejado += bloco.duracaoMin;
          totalBlocosEstudo++;
        } else {
          totalMinRevisao += bloco.duracaoMin;
          totalBlocosRevisao++;
        }
      }
    }
  }

  return {
    config,
    semanas,
    meta: {
      totalMinPlanejado,
      totalMinRevisao,
      totalBlocosEstudo,
      totalBlocosRevisao,
    },
  };
}

