// src/lib/pdf/pipelinePdf.ts
// Pipeline unificada para extração + pré-processamento + parser (PASSO C + D - Fail-safe)

import { extractPdfText } from "./extractPdfText";
import { classificarPdf, type ClassificacaoPdf } from "./classificarPdf";
import { prevalidarPdf } from "./prevalidarPdf";
import { preprocessarTextoComLogs } from "../parser/preprocessarTexto";
import { parserCanonico, type ParserResult } from "../parser/parserCanonico";
import { gerarDiagnosticoPdf } from "./diagnosticoPdf";

export type PipelinePdfFlags = {
  // Flags do PASSO C
  fragmentado: boolean;
  escaneado: boolean;
  possivelAnexoPerdido: boolean;
  headingsQuebrados: boolean;
  // Flags do PASSO D (pré-validação)
  textoInsuficiente: boolean;
  densidadeBaixa: boolean;
  semPalavrasChave: boolean;
  estruturaQuebrada: boolean;
  ruidoRepetitivo: boolean;
};

export type PipelinePdfResult = 
  | {
      status: "ok";
      textoOriginal: string;
      textoProcessado: string;
      resultadoParser: ParserResult;
      flags: PipelinePdfFlags;
    }
  | {
      status: "pdf_escaneado";
      textoOriginal: string;
      textoProcessado?: string;
      resultadoParser?: ParserResult;
      flags: PipelinePdfFlags;
      mensagem: string;
    }
  | {
      status: "erro_extracao";
      textoOriginal: string;
      textoProcessado?: string;
      resultadoParser?: ParserResult;
      flags: PipelinePdfFlags;
      mensagem: string;
    };

/**
 * Pipeline unificada para processamento de PDFs (PASSO C + D - Fail-safe)
 * Orquestra: extractPdfText → classificarPdf → prevalidarPdf → preprocessarTexto → parserCanonico
 * Aplica roteamento inteligente e flags de diagnóstico
 */
export async function pipelinePdf(file: File): Promise<PipelinePdfResult> {
  try {
    // 1. Extração primária
    const textoOriginal = await extractPdfText(file);

    // 2. Classificação determinística
    const infoClassificacao = classificarPdf(textoOriginal);

    // 3. Pré-validação estruturada (PASSO D) - ANTES do pré-processador
    const prevalidacao = prevalidarPdf(textoOriginal);

    // 4. Roteamento: se escaneado, retorna erro elegante
    if (infoClassificacao.classificacao === "escaneado") {
      const flags: PipelinePdfFlags = {
        fragmentado: false,
        escaneado: true,
        possivelAnexoPerdido: false,
        headingsQuebrados: false,
        // Flags do PASSO D
        textoInsuficiente: prevalidacao.flags.textoInsuficiente,
        densidadeBaixa: prevalidacao.flags.densidadeBaixa,
        semPalavrasChave: prevalidacao.flags.semPalavrasChave,
        estruturaQuebrada: prevalidacao.flags.estruturaQuebrada,
        ruidoRepetitivo: prevalidacao.flags.ruidoRepetitivo,
      };

      // Log DEV-only
      if (typeof window !== "undefined" && import.meta.env.DEV) {
        console.log(`[pipelinePdf] Status: pdf_escaneado`, {
          tamanho: textoOriginal.length,
          flags,
        });
      }

      return {
        status: "pdf_escaneado",
        textoOriginal,
        flags,
        mensagem: "Este PDF parece estar escaneado. Utilize uma versão com texto selecionável.",
      };
    }

    // 5. Pré-processamento (Passo A)
    const { textoProcessado } = preprocessarTextoComLogs(textoOriginal);

    // 6. Parser canônico
    const resultadoParser = parserCanonico(textoProcessado);

    // 7. Calcula flags (PASSO C + D)
    // Nota: escaneado já foi tratado acima (linha 67), então aqui só pode ser "texto_valido" ou "fragmentado"
    const flags: PipelinePdfFlags = {
      // Flags do PASSO C
      fragmentado: infoClassificacao.classificacao === "fragmentado",
      escaneado: false, // Já foi verificado acima, não pode ser escaneado aqui
      possivelAnexoPerdido: textoOriginal.length >= 2000 && !resultadoParser.debug.anexoEncontrado,
      headingsQuebrados: resultadoParser.debug.disciplinasDetectadas <= 1 && resultadoParser.debug.disciplinasOficiais.length >= 3,
      // Flags do PASSO D (pré-validação)
      textoInsuficiente: prevalidacao.flags.textoInsuficiente,
      densidadeBaixa: prevalidacao.flags.densidadeBaixa,
      semPalavrasChave: prevalidacao.flags.semPalavrasChave,
      estruturaQuebrada: prevalidacao.flags.estruturaQuebrada,
      ruidoRepetitivo: prevalidacao.flags.ruidoRepetitivo,
    };

    // 8. Gera diagnóstico consolidado (PASSO E)
    gerarDiagnosticoPdf({
      status: "ok",
      textoOriginal,
      textoProcessado,
      resultadoParser,
      flags,
    });

    // 9. Retorna objeto consolidado
    return {
      status: "ok",
      textoOriginal,
      textoProcessado,
      resultadoParser,
      flags,
    };
  } catch (error) {
    // Erro na extração ou processamento
    const mensagem = error instanceof Error ? error.message : "Erro desconhecido ao processar PDF";
    
    if (typeof window !== "undefined" && import.meta.env.DEV) {
      console.error(`[pipelinePdf] Erro no pipeline:`, error);
    }

    // Tenta classificar mesmo com erro (se tiver texto parcial)
    let textoOriginal = "";
    const flags: PipelinePdfFlags = {
      fragmentado: false,
      escaneado: false,
      possivelAnexoPerdido: false,
      headingsQuebrados: false,
      textoInsuficiente: false,
      densidadeBaixa: false,
      semPalavrasChave: false,
      estruturaQuebrada: false,
      ruidoRepetitivo: false,
    };
    
    try {
      // Se o erro foi na extração, textoOriginal será vazio
      textoOriginal = error instanceof Error && "textoOriginal" in error 
        ? (error as any).textoOriginal 
        : "";
      
      if (textoOriginal.length > 0) {
        const infoClassificacao = classificarPdf(textoOriginal);
        flags.escaneado = infoClassificacao.classificacao === "escaneado";
        flags.fragmentado = infoClassificacao.classificacao === "fragmentado";
        
        // Tenta pré-validação também
        try {
          const prevalidacao = prevalidarPdf(textoOriginal);
          flags.textoInsuficiente = prevalidacao.flags.textoInsuficiente;
          flags.densidadeBaixa = prevalidacao.flags.densidadeBaixa;
          flags.semPalavrasChave = prevalidacao.flags.semPalavrasChave;
          flags.estruturaQuebrada = prevalidacao.flags.estruturaQuebrada;
          flags.ruidoRepetitivo = prevalidacao.flags.ruidoRepetitivo;
        } catch {
          // Ignora erro na pré-validação de fallback
        }
      }
    } catch {
      // Ignora erro na classificação de fallback
    }

    // Log DEV-only
    if (typeof window !== "undefined" && import.meta.env.DEV) {
      console.log(`[pipelinePdf] Status: erro_extracao`, {
        mensagem,
        flags,
        tamanhoTexto: textoOriginal.length,
      });
    }

    return {
      status: "erro_extracao",
      textoOriginal,
      flags,
      mensagem,
    };
  }
}

