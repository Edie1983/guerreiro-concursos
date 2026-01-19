// src/dev/runAjustesPreview.ts
// Runner DEV-only para validar ajustes manuais do cronograma

import { gerarCronogramaCanonico } from "../lib/cronograma/orquestradorCronograma";
import { aplicarAjustesManuais, AjusteManualEvento } from "../lib/cronograma/ajustes/aplicarAjustesManuais";

/**
 * ===========================
 * MOCK DO PARSER (PASSO H)
 * ===========================
 */
const parserResultMock = {
  disciplinas: [
    {
      nome: "Português",
      topicos: [
        "Interpretação de texto",
        "Ortografia",
        "Acentuação",
        "Pontuação",
      ],
    },
    {
      nome: "Matemática",
      topicos: [
        "Razão e proporção",
        "Porcentagem",
        "Regra de três",
      ],
    },
  ],
};

/**
 * ===========================
 * PREFERÊNCIAS DO ALUNO
 * ===========================
 */
const preferenciasAlunoMock = {
  horasPorDia: 3,
  dataInicio: new Date("2026-01-14"),
  pesosPorDisciplina: {
    Português: 2,
    Matemática: 1,
  },
};

/**
 * ===========================
 * GERAR CRONOGRAMA BASE
 * ===========================
 */
console.log("=================================");
console.log(" CRONOGRAMA BASE (ANTES) ");
console.log("=================================");

const cronogramaBase = gerarCronogramaCanonico(
  parserResultMock,
  preferenciasAlunoMock
);

console.log(JSON.stringify(cronogramaBase, null, 2));

/**
 * ===========================
 * EVENTOS DE AJUSTE MANUAL
 * ===========================
 */
const eventosMock: AjusteManualEvento[] = [
  {
    tipo: "MOVE_TOPICO",
    topico: "Ortografia",
    dataOrigem: "2026-01-15",
    dataDestino: "2026-01-19",
  },
  {
    tipo: "REORDER_TOPICO",
    data: "2026-01-14",
    disciplina: "Português",
    novaOrdem: ["Interpretação de texto"],
  },
  {
    tipo: "PAUSAR_DIA",
    data: "2026-01-16",
  },
  {
    tipo: "MARCAR_CONCLUIDO",
    topico: "Razão e proporção",
  },
];

/**
 * ===========================
 * APLICAR AJUSTES
 * ===========================
 */
console.log("=================================");
console.log(" CRONOGRAMA AJUSTADO (DEPOIS) ");
console.log("=================================");

const estadoDerivado = aplicarAjustesManuais(
  cronogramaBase,
  eventosMock
);

console.log(JSON.stringify({
  cronograma: estadoDerivado.cronograma,
  diasPausados: Array.from(estadoDerivado.diasPausados),
  topicosConcluidos: Array.from(estadoDerivado.topicosConcluidos),
}, null, 2));
