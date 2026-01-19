// src/dev/runSessoesPreview.ts
// Runner DEV-only para validar registro silencioso de sessões

import {
  registrarSessaoEstudo,
  HistoricoSessoes,
} from "../lib/cronograma/sessoes/registrarSessaoEstudo";

console.log("=================================");
console.log(" REGISTRO DE SESSÕES — PREVIEW ");
console.log(" FASE 5 (SILENCIOSO) ");
console.log("=================================");

let historico: HistoricoSessoes = {
  sessoes: [],
};

historico = registrarSessaoEstudo(historico, {
  data: "2026-01-14",
  topicosPlanejados: ["Interpretação de texto", "Razão e proporção"],
  topicosEstudados: ["Interpretação de texto"],
  duracaoBlocos: 2,
  realizada: true,
});

historico = registrarSessaoEstudo(historico, {
  data: "2026-01-15",
  topicosPlanejados: ["Ortografia"],
  topicosEstudados: [],
  duracaoBlocos: 0,
  realizada: false,
});

console.log(JSON.stringify(historico, null, 2));
