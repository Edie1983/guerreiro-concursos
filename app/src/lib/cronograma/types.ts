// src/lib/cronograma/types.ts
// Tipos para o Motor de Cronograma (determinístico, sem IA)

export type CronogramaConfig = {
  editalId: string;
  // Opção A: data da prova (YYYY-MM-DD)
  dataProva?: string;
  // Opção B: horizonte em semanas (se dataProva não existir)
  horizonteSemanas?: number;
  // Dias da semana ativos (0=domingo, 1=segunda, ..., 6=sábado)
  diasSemanaAtivos: number[];
  // Horas por dia de estudo
  horasPorDia: number;
  // Percentual de tempo para revisão (0..0.5 recomendado)
  percentRevisao: number;
};

export type CronogramaBloco = {
  tipo: "ESTUDO" | "REVISAO";
  duracaoMin: number; // Duração em minutos (arredondada)
  disciplinaNome: string;
  disciplinaRank: number; // Rank do Mapa Tático
  disciplinaScore: number; // Score do Mapa Tático
  origem?: string; // Opcional: indica origem do bloco (ex: "rank 1", "score 35.5")
};

export type CronogramaDia = {
  dataISO: string; // YYYY-MM-DD
  totalMin: number; // Total de minutos do dia
  blocos: CronogramaBloco[];
};

export type CronogramaSemana = {
  indice: number; // 1, 2, 3...
  dias: CronogramaDia[];
};

export type CronogramaGerado = {
  config: CronogramaConfig;
  semanas: CronogramaSemana[];
  meta: {
    totalMinPlanejado: number; // Total de minutos de estudo planejados
    totalMinRevisao: number; // Total de minutos de revisão planejados
    totalBlocosEstudo: number;
    totalBlocosRevisao: number;
  };
};






