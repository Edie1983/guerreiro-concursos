// src/gc/dev/gcTestMode.ts
// Modo de teste DEV-only para política de UX (PASSO J/O)
// Permite testar modal/banner sem depender de PDFs específicos

import type { DiagnosticoPdf } from "../../lib/pdf/diagnosticoPdf";

/**
 * Gera DiagnosticoPdf sintético para testes (PASSO J/O - DEV-only)
 * Permite testar modal/banner sem depender de PDFs específicos
 */
function criarDiagnosticoSintetico(nivel: "alta" | "media" | "baixa"): DiagnosticoPdf {
  if (nivel === "alta") {
    // ALTA: textoInsuficiente
    return {
      classificacao: {
        fragmentado: false,
        escaneado: false,
      },
      failSafe: {
        possivelAnexoPerdido: false,
        headingsQuebrados: false,
      },
      prevalidacao: {
        textoInsuficiente: true, // Flag ALTA
        densidadeBaixa: false,
        semPalavrasChave: false,
        estruturaQuebrada: false,
        ruidoRepetitivo: false,
      },
      estatisticasTexto: {
        tamanho: 500, // < 800 (texto insuficiente)
        linhas: 50,
        densidade: 10,
      },
      estatisticasParser: {
        anexoEncontrado: false,
        disciplinasDetectadas: 0,
        disciplinasOficiais: 0,
        topicosTotal: 0,
      },
      status: "ok",
    };
  } else if (nivel === "media") {
    // MEDIA: densidadeBaixa
    return {
      classificacao: {
        fragmentado: false,
        escaneado: false,
      },
      failSafe: {
        possivelAnexoPerdido: false,
        headingsQuebrados: false,
      },
      prevalidacao: {
        textoInsuficiente: false,
        densidadeBaixa: true, // Flag MEDIA
        semPalavrasChave: false,
        estruturaQuebrada: false,
        ruidoRepetitivo: false,
      },
      estatisticasTexto: {
        tamanho: 5000,
        linhas: 1000, // Densidade = 5000/1000 = 5 (< 8)
        densidade: 5,
      },
      estatisticasParser: {
        anexoEncontrado: true,
        disciplinasDetectadas: 5,
        disciplinasOficiais: 5,
        topicosTotal: 50,
      },
      status: "ok",
    };
  } else {
    // BAIXA: ruidoRepetitivo
    return {
      classificacao: {
        fragmentado: false,
        escaneado: false,
      },
      failSafe: {
        possivelAnexoPerdido: false,
        headingsQuebrados: false,
      },
      prevalidacao: {
        textoInsuficiente: false,
        densidadeBaixa: false,
        semPalavrasChave: false,
        estruturaQuebrada: false,
        ruidoRepetitivo: true, // Flag BAIXA
      },
      estatisticasTexto: {
        tamanho: 10000,
        linhas: 500,
        densidade: 20,
      },
      estatisticasParser: {
        anexoEncontrado: true,
        disciplinasDetectadas: 8,
        disciplinasOficiais: 8,
        topicosTotal: 100,
      },
      status: "ok",
    };
  }
}

/**
 * Lê querystring gc_test e retorna DiagnosticoPdf sintético (PASSO O - DEV-only)
 * Retorna null em produção ou se não houver querystring válida
 */
export function getGcTestDiagnosticoFromUrl(): DiagnosticoPdf | null {
  // PASSO O: Blindagem - retorna null em SSR
  if (typeof window === "undefined") return null;

  // PASSO O: Blindagem - retorna null em produção
  if (!import.meta.env.DEV) return null;

  const urlParams = new URLSearchParams(window.location.search);
  const gcTest = urlParams.get("gc_test");

  if (gcTest === "alta" || gcTest === "media" || gcTest === "baixa") {
    console.log(`[PASSO J] Modo de teste ativado: ${gcTest.toUpperCase()}`);
    return criarDiagnosticoSintetico(gcTest);
  }

  return null;
}



