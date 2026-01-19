// src/dev/runPdfSuite.ts
// Runner DEV-only para suíte de compatibilidade de PDFs (BROWSER)
// Executa pipeline completo em múltiplos PDFs e gera relatório consolidado
// 
// USO NO BROWSER:
//   1. Abra o console do navegador (F12) em http://localhost:5173
//   2. Execute: window.runPdfSuite([file1, file2, ...])
//   
//   Exemplo prático:
//     const input = document.createElement('input');
//     input.type = 'file';
//     input.multiple = true;
//     input.accept = '.pdf';
//     input.onchange = (e) => {
//       const files = Array.from((e.target as HTMLInputElement).files || []);
//       window.runPdfSuite(files);
//     };
//     input.click();

import { extractPdfText } from "../lib/pdf/extractPdfText";
import { preprocessarTextoComLogs } from "../lib/parser/preprocessarTexto";
import { parserCanonico } from "../lib/parser/parserCanonico";

type ResultadoPdf = {
  nomeArquivo: string;
  tamanhoOriginal: number;
  tamanhoProcessado: number;
  anexoIIAntes: number;
  anexoIIDepois: number;
  anexoIIEncontrado: boolean;
  disciplinasDetectadas: number;
  topicosTotal: number;
  flagHeadingsQuebrados: boolean;
  flagProvavelEscaneado: boolean;
};

/**
 * Processa um PDF (File) e retorna métricas
 */
async function processarPdf(file: File): Promise<ResultadoPdf> {
  try {
    // Extrai texto
    const textoOriginal = await extractPdfText(file);

    // Pré-processa
    const { textoProcessado, stats } = preprocessarTextoComLogs(textoOriginal);

    // Roda parser
    const resultado = parserCanonico(textoProcessado);

    // Calcula métricas
    const topicosTotal = resultado.disciplinas.reduce(
      (sum, d) => sum + d.conteudos.length,
      0
    );

    const flagHeadingsQuebrados =
      resultado.debug.anexoEncontrado &&
      resultado.debug.disciplinasDetectadas <= 1 &&
      resultado.debug.disciplinasOficiais.length >= 3;

    const flagProvavelEscaneado =
      !resultado.debug.anexoEncontrado && textoOriginal.length < 1000;

    return {
      nomeArquivo: file.name,
      tamanhoOriginal: stats.tamanhoOriginal,
      tamanhoProcessado: stats.tamanhoProcessado,
      anexoIIAntes: stats.ocorrenciasAnexoIIAntes,
      anexoIIDepois: stats.ocorrenciasAnexoIIDepois,
      anexoIIEncontrado: resultado.debug.anexoEncontrado,
      disciplinasDetectadas: resultado.debug.disciplinasDetectadas,
      topicosTotal,
      flagHeadingsQuebrados,
      flagProvavelEscaneado,
    };
  } catch (error: any) {
    console.error(`[runPdfSuite] Erro ao processar ${file.name}:`, error.message);
    return {
      nomeArquivo: file.name,
      tamanhoOriginal: 0,
      tamanhoProcessado: 0,
      anexoIIAntes: 0,
      anexoIIDepois: 0,
      anexoIIEncontrado: false,
      disciplinasDetectadas: 0,
      topicosTotal: 0,
      flagHeadingsQuebrados: false,
      flagProvavelEscaneado: true,
    };
  }
}

/**
 * Formata número para tabela
 */
function formatarNumero(n: number): string {
  return n.toLocaleString("pt-BR");
}

/**
 * Formata boolean para tabela
 */
function formatarBoolean(b: boolean): string {
  return b ? "✓" : "—";
}

/**
 * Imprime tabela de resultados
 */
function imprimirTabela(resultados: ResultadoPdf[]): void {
  console.log("\n" + "=".repeat(120));
  console.log("RELATÓRIO DE COMPATIBILIDADE - SUÍTE DE PDFs");
  console.log("=".repeat(120));

  // Cabeçalho
  const header = [
    "Arquivo",
    "Tamanho Orig",
    "Tamanho Proc",
    "ANEXO II (Antes)",
    "ANEXO II (Depois)",
    "ANEXO II OK",
    "Disc. Detect",
    "Tópicos",
    "Headings Quebrados",
    "Provável Escaneado",
  ];

  const larguras = [30, 12, 12, 12, 12, 10, 10, 8, 15, 15];

  // Imprime cabeçalho
  console.log(
    header
      .map((h, i) => h.padEnd(larguras[i]))
      .join(" | ")
  );
  console.log("-".repeat(120));

  // Imprime linhas
  for (const r of resultados) {
    const linha = [
      r.nomeArquivo.substring(0, 28).padEnd(30),
      formatarNumero(r.tamanhoOriginal).padStart(12),
      formatarNumero(r.tamanhoProcessado).padStart(12),
      r.anexoIIAntes.toString().padStart(12),
      r.anexoIIDepois.toString().padStart(12),
      formatarBoolean(r.anexoIIEncontrado).padStart(10),
      r.disciplinasDetectadas.toString().padStart(10),
      r.topicosTotal.toString().padStart(8),
      formatarBoolean(r.flagHeadingsQuebrados).padStart(15),
      formatarBoolean(r.flagProvavelEscaneado).padStart(15),
    ];
    console.log(linha.join(" | "));
  }

  console.log("=".repeat(120));

  // Resumo
  console.log("\nRESUMO:");
  const total = resultados.length;
  const anexoIIOk = resultados.filter((r) => r.anexoIIEncontrado).length;
  const discOk = resultados.filter((r) => r.disciplinasDetectadas > 1).length;
  const headingsQuebrados = resultados.filter((r) => r.flagHeadingsQuebrados).length;
  const escaneados = resultados.filter((r) => r.flagProvavelEscaneado).length;

  console.log(`  Total processado: ${total}`);
  console.log(`  ANEXO II encontrado: ${anexoIIOk}/${total}`);
  console.log(`  Disciplinas > 1: ${discOk}/${total}`);
  console.log(`  Headings quebrados: ${headingsQuebrados}`);
  console.log(`  Provável escaneado: ${escaneados}`);
  console.log("");
}

/**
 * Runner principal (browser)
 */
export async function runPdfSuite(files: File[]): Promise<void> {
  console.log(`[runPdfSuite] Iniciando suíte com ${files.length} PDF(s)...\n`);

  const resultados: ResultadoPdf[] = [];

  for (const file of files) {
    console.log(`[runPdfSuite] Processando: ${file.name}...`);
    const resultado = await processarPdf(file);
    resultados.push(resultado);
  }

  imprimirTabela(resultados);
}

// Expõe globalmente para uso no console do navegador (DEV-only)
if (typeof window !== "undefined" && import.meta.env.DEV) {
  (window as any).runPdfSuite = runPdfSuite;
  console.log(
    `[runPdfSuite] ✅ Runner disponível. Use: window.runPdfSuite([file1, file2, ...])`
  );
}
