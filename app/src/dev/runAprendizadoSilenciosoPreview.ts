// src/dev/runAprendizadoSilenciosoPreview.ts

import { analisarPadroesSilenciosos } from "../lib/cronograma/aprendizado/analisarPadroesSilenciosos";
import { HistoricoSessoes } from "../lib/cronograma/sessoes/registrarSessaoEstudo";

console.log("=================================");
console.log(" APRENDIZADO SILENCIOSO — PREVIEW ");
console.log(" FASE 6 ");
console.log("=================================");

const historicoMock: HistoricoSessoes = {
  sessoes: Array.from({ length: 14 }).map((_, i) => ({
    data: `2026-01-${String(10 + i).padStart(2, "0")}`,
    topicosPlanejados: ["Português", "Matemática"],
    topicosEstudados: i % 3 === 0 ? ["Português"] : ["Português", "Matemática"],
    duracaoBlocos: i % 3 === 0 ? 1 : 2,
    realizada: true,
  })),
};

const resultado = analisarPadroesSilenciosos(historicoMock);

console.log(JSON.stringify(resultado, null, 2));
