// src/dev/runCronogramaPreview.ts
// Runner DEV-only para preview/teste do Cronograma Inteligente
// Executado via tsx (TypeScript + ESM)

import { gerarCronogramaCanonico } from "../lib/cronograma/orquestradorCronograma";

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
 * MOCK DE PREFERÊNCIAS (FASE 2)
 * ===========================
 * Agora com PESO POR DISCIPLINA
 */
const preferenciasAlunoMock = {
  horasPorDia: 3,
  dataInicio: new Date(),
  pesosPorDisciplina: {
    Português: 2,
    Matemática: 1,
  },
};

/**
 * ===========================
 * EXECUÇÃO DEV
 * ===========================
 */
console.log("=================================");
console.log(" CRONOGRAMA INTELIGENTE - PREVIEW ");
console.log(" FASE 2 — PESO POR DISCIPLINA ");
console.log("=================================");

const cronograma = gerarCronogramaCanonico(
  parserResultMock,
  preferenciasAlunoMock
);

console.log(JSON.stringify(cronograma, null, 2));
