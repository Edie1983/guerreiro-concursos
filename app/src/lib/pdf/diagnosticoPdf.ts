// src/lib/pdf/diagnosticoPdf.ts
// Diagnóstico Consolidado (PASSO E - DEV-only)
// Consolida flags e estatísticas dos PASSOS B, C e D em relatório único

import type { PipelinePdfResult, PipelinePdfFlags } from "./pipelinePdf";

export type DiagnosticoPdf = {
  // Flags PASSO B (classificação)
  classificacao: {
    fragmentado: boolean;
    escaneado: boolean;
  };
  // Flags PASSO C (fail-safe)
  failSafe: {
    possivelAnexoPerdido: boolean;
    headingsQuebrados: boolean;
  };
  // Flags PASSO D (pré-validação)
  prevalidacao: {
    textoInsuficiente: boolean;
    densidadeBaixa: boolean;
    semPalavrasChave: boolean;
    estruturaQuebrada: boolean;
    ruidoRepetitivo: boolean;
  };
  // Estatísticas do texto
  estatisticasTexto: {
    tamanho: number;
    linhas?: number;
    densidade?: number;
  };
  // Estatísticas do parser
  estatisticasParser?: {
    anexoEncontrado: boolean;
    disciplinasDetectadas: number;
    disciplinasOficiais: number;
    topicosTotal: number;
  };
  // Status do pipeline
  status: "ok" | "pdf_escaneado" | "erro_extracao";
};

/**
 * Gera diagnóstico consolidado do PDF (PASSO E)
 * Consolida flags e estatísticas dos PASSOS B, C e D
 */
export function gerarDiagnosticoPdf(resultado: PipelinePdfResult): DiagnosticoPdf {
  const flags = resultado.flags;

  // Consolida flags PASSO B (classificação)
  const classificacao = {
    fragmentado: flags.fragmentado,
    escaneado: flags.escaneado,
  };

  // Consolida flags PASSO C (fail-safe)
  const failSafe = {
    possivelAnexoPerdido: flags.possivelAnexoPerdido,
    headingsQuebrados: flags.headingsQuebrados,
  };

  // Consolida flags PASSO D (pré-validação)
  const prevalidacao = {
    textoInsuficiente: flags.textoInsuficiente,
    densidadeBaixa: flags.densidadeBaixa,
    semPalavrasChave: flags.semPalavrasChave,
    estruturaQuebrada: flags.estruturaQuebrada,
    ruidoRepetitivo: flags.ruidoRepetitivo,
  };

  // Estatísticas do texto
  const estatisticasTexto = {
    tamanho: resultado.textoOriginal.length,
  };

  // Estatísticas do parser (apenas se status === "ok")
  const estatisticasParser =
    resultado.status === "ok"
      ? {
          anexoEncontrado: resultado.resultadoParser.debug.anexoEncontrado,
          disciplinasDetectadas: resultado.resultadoParser.debug.disciplinasDetectadas,
          disciplinasOficiais: resultado.resultadoParser.debug.disciplinasOficiais.length,
          topicosTotal: resultado.resultadoParser.disciplinas.reduce(
            (sum, d) => sum + d.conteudos.length,
            0
          ),
        }
      : undefined;

  const diagnostico: DiagnosticoPdf = {
    classificacao,
    failSafe,
    prevalidacao,
    estatisticasTexto,
    estatisticasParser,
    status: resultado.status,
  };

  // Log DEV-only: relatório tabulado
  if (typeof window !== "undefined" && import.meta.env.DEV) {
    imprimirDiagnosticoTabulado(diagnostico, resultado);
  }

  return diagnostico;
}

/**
 * Imprime diagnóstico em formato tabulado (DEV-only)
 */
function imprimirDiagnosticoTabulado(
  diagnostico: DiagnosticoPdf,
  resultado: PipelinePdfResult
): void {
  const linhaSeparadora = "═".repeat(60);
  const linhaSubtitulo = "─".repeat(60);

  console.log("\n" + linhaSeparadora);
  console.log("  DIAGNÓSTICO CONSOLIDADO DO PDF (PASSO E)");
  console.log(linhaSeparadora);

  // Seção CLASSIFICAÇÃO (PASSO B)
  console.log("\n  📋 CLASSIFICAÇÃO (PASSO B)");
  console.log(linhaSubtitulo);
  console.log(`  Fragmentado:     ${diagnostico.classificacao.fragmentado ? "⚠️  SIM" : "✅ NÃO"}`);
  console.log(`  Escaneado:       ${diagnostico.classificacao.escaneado ? "⚠️  SIM" : "✅ NÃO"}`);

  // Seção FAIL-SAFE (PASSO C)
  console.log("\n  🔒 FAIL-SAFE (PASSO C)");
  console.log(linhaSubtitulo);
  console.log(
    `  Anexo Perdido:   ${diagnostico.failSafe.possivelAnexoPerdido ? "⚠️  SIM" : "✅ NÃO"}`
  );
  console.log(
    `  Headings Quebrados: ${diagnostico.failSafe.headingsQuebrados ? "⚠️  SIM" : "✅ NÃO"}`
  );

  // Seção PRÉ-VALIDAÇÃO (PASSO D)
  console.log("\n  🛡️  PRÉ-VALIDAÇÃO (PASSO D)");
  console.log(linhaSubtitulo);
  console.log(
    `  Texto Insuficiente:    ${diagnostico.prevalidacao.textoInsuficiente ? "⚠️  SIM" : "✅ NÃO"}`
  );
  console.log(
    `  Densidade Baixa:       ${diagnostico.prevalidacao.densidadeBaixa ? "⚠️  SIM" : "✅ NÃO"}`
  );
  console.log(
    `  Sem Palavras-Chave:    ${diagnostico.prevalidacao.semPalavrasChave ? "⚠️  SIM" : "✅ NÃO"}`
  );
  console.log(
    `  Estrutura Quebrada:    ${diagnostico.prevalidacao.estruturaQuebrada ? "⚠️  SIM" : "✅ NÃO"}`
  );
  console.log(
    `  Ruído Repetitivo:      ${diagnostico.prevalidacao.ruidoRepetitivo ? "⚠️  SIM" : "✅ NÃO"}`
  );

  // Seção ESTATÍSTICAS DO TEXTO
  console.log("\n  📊 ESTATÍSTICAS DO TEXTO");
  console.log(linhaSubtitulo);
  console.log(`  Tamanho:         ${diagnostico.estatisticasTexto.tamanho.toLocaleString()} chars`);
  if (resultado.status === "ok" && resultado.textoProcessado) {
    console.log(
      `  Processado:      ${resultado.textoProcessado.length.toLocaleString()} chars`
    );
  }

  // Seção ESTATÍSTICAS DO PARSER (apenas se disponível)
  if (diagnostico.estatisticasParser) {
    console.log("\n  🔍 ESTATÍSTICAS DO PARSER");
    console.log(linhaSubtitulo);
    console.log(
      `  ANEXO II Encontrado:  ${diagnostico.estatisticasParser.anexoEncontrado ? "✅ SIM" : "❌ NÃO"}`
    );
    console.log(
      `  Disciplinas Detectadas: ${diagnostico.estatisticasParser.disciplinasDetectadas}`
    );
    console.log(
      `  Disciplinas Oficiais:   ${diagnostico.estatisticasParser.disciplinasOficiais}`
    );
    console.log(`  Tópicos Total:         ${diagnostico.estatisticasParser.topicosTotal}`);
  }

  // Rodapé
  console.log("\n" + linhaSeparadora);
  console.log(`  Status: ${diagnostico.status.toUpperCase()}`);
  console.log(linhaSeparadora + "\n");
}



