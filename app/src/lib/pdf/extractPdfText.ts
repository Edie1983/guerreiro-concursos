// src/lib/pdf/extractPdfText.ts
// @ts-expect-error - pdfjs-dist v5 usa módulos ESM sem tipos completos
import * as pdfjsLib from "pdfjs-dist/build/pdf.mjs";

// Configurar o worker do pdfjs-dist
// Tenta usar o worker via import do Vite, com fallback para /public
if (typeof window !== "undefined") {
  // Importação dinâmica do worker (Vite)
  import("pdfjs-dist/build/pdf.worker.min.mjs?url")
    .then((module) => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = module.default;
    })
    .catch(() => {
      // Fallback para worker na pasta public (respeitando base /app/)
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/app/pdf.worker.min.mjs";
    });
}

/**
 * Extrai TODO o texto de TODAS as páginas do PDF
 * Garante que nenhuma página seja pulada ou truncada
 */
export async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const numPages = pdf.numPages;
  const fullTextParts: string[] = [];

  // Processa TODAS as páginas sequencialmente
  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    try {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();

      // Extrai texto de todos os itens da página
      const pageText = content.items
        .map((item: any) => {
          if (typeof item.str === "string" && item.str.trim().length > 0) {
            return item.str;
          }
          return "";
        })
        .filter((str: string) => str.length > 0)
        .join(" ");

      // Adiciona quebra de página para manter estrutura
      if (pageText.trim().length > 0) {
        fullTextParts.push(pageText);
      }
    } catch (error) {
      // Se uma página falhar, continua com as outras
      console.warn(`Erro ao extrair página ${pageNum}:`, error);
      fullTextParts.push(`[Erro ao extrair página ${pageNum}]`);
    }
  }

  // Junta todas as páginas com quebras de linha
  const fullText = fullTextParts.join("\n\n");

  // Validação: garante que temos texto extraído
  if (fullText.trim().length === 0) {
    throw new Error("Nenhum texto foi extraído do PDF. O arquivo pode estar corrompido ou ser uma imagem escaneada.");
  }

  // Log de debug (apenas em desenvolvimento)
  if (typeof window !== "undefined" && import.meta.env.DEV) {
    console.log(`[extractPdfText] Extraídas ${numPages} páginas, ${fullText.length} caracteres`);
  }

  return fullText;
}
