// src/dev/runParserPreview.ts
// Runner DEV-only para processar TODOS os PDFs da pasta src/dev/pdfs
// Executar com: npx tsx src/dev/runParserPreview.ts

import fs from "fs";
import path from "path";
import { File } from "node:buffer";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { classificarPdf } from "../lib/pdf/classificarPdf";
import { prevalidarPdf } from "../lib/pdf/prevalidarPdf";
import { preprocessarTextoComLogs } from "../lib/parser/preprocessarTexto";
import { parserCanonico } from "../lib/parser/parserCanonico";
import { gerarDiagnosticoPdf } from "../lib/pdf/diagnosticoPdf";
import type { PipelinePdfFlags, PipelinePdfResult } from "../lib/pdf/pipelinePdf";

const PDF_DIR = path.resolve("src/dev/pdfs");
const isProd = process.env.NODE_ENV === "production";

if (isProd) {
  console.error("❌ Este runner é DEV-only. Defina NODE_ENV diferente de 'production'.");
  process.exit(1);
}

// Configuração específica para Node.js usando o bundle LEGACY do pdfjs-dist
pdfjsLib.GlobalWorkerOptions.disableWorker = true;

fs.mkdirSync(PDF_DIR, { recursive: true });

const pdfFiles = fs
  .readdirSync(PDF_DIR)
  .filter((file) => file.toLowerCase().endsWith(".pdf"))
  .sort();

if (pdfFiles.length === 0) {
  console.log("⚠️ Nenhum PDF encontrado em src/dev/pdfs. Adicione arquivos e execute novamente.");
  process.exit(0);
}

console.log("=================================");
console.log(" PARSER CANÔNICO — PREVIEW (DEV)");
console.log("=================================");
console.log(`Encontrados ${pdfFiles.length} PDF(s) em src/dev/pdfs\n`);

type TipoPdf = "texto" | "escaneado" | "misto";

async function extractPdfTextNode(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: arrayBuffer,
    useWorkerFetch: false,
    isEvalSupported: false,
  });

  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  const fullTextParts: string[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    try {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();

      const pageText = content.items
        .map((item: any) => {
          if (typeof item.str === "string" && item.str.trim().length > 0) {
            return item.str;
          }
          return "";
        })
        .filter((str: string) => str.length > 0)
        .join(" ");

      if (pageText.trim().length > 0) {
        fullTextParts.push(pageText);
      }
    } catch (error) {
      console.warn(`Erro ao extrair página ${pageNum}:`, error);
      fullTextParts.push(`[Erro ao extrair página ${pageNum}]`);
    }
  }

  const fullText = fullTextParts.join("\n\n");

  if (fullText.trim().length === 0) {
    throw new Error(
      "Nenhum texto foi extraído do PDF. O arquivo pode estar corrompido ou ser uma imagem escaneada."
    );
  }

  await pdf.cleanup();
  await pdf.destroy();

  return fullText;
}

async function pipelinePdfNode(file: File): Promise<PipelinePdfResult> {
  try {
    const textoOriginal = await extractPdfTextNode(file);

    const infoClassificacao = classificarPdf(textoOriginal);
    const prevalidacao = prevalidarPdf(textoOriginal);

    if (infoClassificacao.classificacao === "escaneado") {
      const flags: PipelinePdfFlags = {
        fragmentado: false,
        escaneado: true,
        possivelAnexoPerdido: false,
        headingsQuebrados: false,
        textoInsuficiente: prevalidacao.flags.textoInsuficiente,
        densidadeBaixa: prevalidacao.flags.densidadeBaixa,
        semPalavrasChave: prevalidacao.flags.semPalavrasChave,
        estruturaQuebrada: prevalidacao.flags.estruturaQuebrada,
        ruidoRepetitivo: prevalidacao.flags.ruidoRepetitivo,
      };

      return {
        status: "pdf_escaneado",
        textoOriginal,
        flags,
        mensagem: "Este PDF parece estar escaneado. Utilize uma versão com texto selecionável.",
      };
    }

    const { textoProcessado } = preprocessarTextoComLogs(textoOriginal);
    const resultadoParser = parserCanonico(textoProcessado);

    const flags: PipelinePdfFlags = {
      fragmentado: infoClassificacao.classificacao === "fragmentado",
      escaneado: false,
      possivelAnexoPerdido: textoOriginal.length >= 2000 && !resultadoParser.debug.anexoEncontrado,
      headingsQuebrados:
        resultadoParser.debug.disciplinasDetectadas <= 1 &&
        resultadoParser.debug.disciplinasOficiais.length >= 3,
      textoInsuficiente: prevalidacao.flags.textoInsuficiente,
      densidadeBaixa: prevalidacao.flags.densidadeBaixa,
      semPalavrasChave: prevalidacao.flags.semPalavrasChave,
      estruturaQuebrada: prevalidacao.flags.estruturaQuebrada,
      ruidoRepetitivo: prevalidacao.flags.ruidoRepetitivo,
    };

    gerarDiagnosticoPdf({
      status: "ok",
      textoOriginal,
      textoProcessado,
      resultadoParser,
      flags,
    });

    return {
      status: "ok",
      textoOriginal,
      textoProcessado,
      resultadoParser,
      flags,
    };
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Erro desconhecido ao processar PDF";
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
      textoOriginal =
        error instanceof Error && "textoOriginal" in error ? (error as any).textoOriginal : "";

      if (textoOriginal.length > 0) {
        const infoClassificacao = classificarPdf(textoOriginal);
        flags.escaneado = infoClassificacao.classificacao === "escaneado";
        flags.fragmentado = infoClassificacao.classificacao === "fragmentado";

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

    return {
      status: "erro_extracao",
      textoOriginal,
      flags,
      mensagem,
    };
  }
}

function mapearTipoPdf(resultado: Awaited<ReturnType<typeof pipelinePdfNode>>): TipoPdf {
  if (resultado.status === "pdf_escaneado") {
    return "escaneado";
  }

  if (resultado.flags.fragmentado) {
    return "misto";
  }

  return "texto";
}

function coletarAvisos(resultado: Awaited<ReturnType<typeof pipelinePdf>>): string[] {
  const avisos: string[] = [];

  if (resultado.status === "pdf_escaneado" || resultado.status === "erro_extracao") {
    avisos.push(resultado.mensagem || "Falha ao processar o PDF.");
  }

  if (resultado.flags.possivelAnexoPerdido) {
    avisos.push("Possível ANEXO II ausente ou não localizado.");
  }

  if (resultado.flags.headingsQuebrados) {
    avisos.push("Headings de disciplinas possivelmente quebrados.");
  }

  if (resultado.flags.textoInsuficiente) {
    avisos.push("Texto insuficiente para análise confiável.");
  }

  if (resultado.flags.densidadeBaixa) {
    avisos.push("Densidade textual baixa detectada.");
  }

  if (resultado.flags.semPalavrasChave) {
    avisos.push("Palavras-chave ausentes (conteúdo/programático/disciplina).");
  }

  if (resultado.flags.estruturaQuebrada) {
    avisos.push("Estrutura textual fragmentada (muitas linhas curtas).");
  }

  if (resultado.flags.ruidoRepetitivo) {
    avisos.push("Ruído repetitivo identificado (headers/footers).");
  }

  if (
    resultado.status === "ok" &&
    !resultado.resultadoParser.debug.anexoEncontrado
  ) {
    avisos.push("ANEXO II não encontrado pelo parser.");
  }

  return avisos;
}

async function processarPdf(nomeArquivo: string): Promise<void> {
  const caminho = path.join(PDF_DIR, nomeArquivo);
  const buffer = fs.readFileSync(caminho);
  const file = new File([buffer], nomeArquivo, { type: "application/pdf" });

  const resultado = await pipelinePdfNode(file);
  const tipoPdf = mapearTipoPdf(resultado);
  const avisos = coletarAvisos(resultado);

  const disciplinas =
    resultado.status === "ok"
      ? resultado.resultadoParser.disciplinas.map((disciplina) => ({
          nome: disciplina.nome,
          topicos: disciplina.conteudos.length,
        }))
      : [];

  const payload = {
    arquivo: nomeArquivo,
    tipoPdf,
    statusPipeline: resultado.status,
    disciplinas,
    avisos,
  };

  console.log("------------------------------------------------------------");
  console.log(JSON.stringify(payload, null, 2));
}

async function main(): Promise<void> {
  for (const pdf of pdfFiles) {
    await processarPdf(pdf);
  }
}

main().catch((erro) => {
  console.error("❌ Erro inesperado ao executar o runner:", erro);
  process.exit(1);
});
