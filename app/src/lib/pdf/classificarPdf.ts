// src/lib/pdf/classificarPdf.ts
// Classificação determinística do PDF antes do pré-processamento e parser

export type ClassificacaoPdf = 
  | "texto_valido"
  | "fragmentado"
  | "escaneado";

export function classificarPdf(texto: string): { 
  classificacao: ClassificacaoPdf;
  linhas: number;
  tamanho: number;
  densidade: number;
  flagProvavelEscaneado: boolean;
  flagFragmentado: boolean;
} {
  const tamanho = texto.length;
  const linhas = texto.split("\n").length;
  const densidade = linhas > 0 ? tamanho / linhas : 0;
  
  // Normaliza texto para busca (case-insensitive)
  const textoNormalizado = texto.toLowerCase();
  const contemAnexo = /anexo|conteúdo\s+programático/i.test(texto);

  // Regra 1: escaneado: texto.length < 1000 E não contém "anexo"
  const flagProvavelEscaneado = tamanho < 1000 && !contemAnexo;

  // Regra 2: fragmentado: texto.length >= 500 && < 2000
  const flagFragmentado = tamanho >= 500 && tamanho < 2000;

  // Classificação determinística
  let classificacao: ClassificacaoPdf;
  
  if (flagProvavelEscaneado) {
    classificacao = "escaneado";
  } else if (flagFragmentado) {
    classificacao = "fragmentado";
  } else {
    // texto_valido: texto.length >= 2000
    classificacao = "texto_valido";
  }

  // Logs DEV-only
  if (typeof window !== "undefined" && import.meta.env.DEV) {
    console.log(`[classificarPdf] Classificação: ${classificacao}`, {
      tamanho,
      linhas,
      densidade: densidade.toFixed(2),
      flagProvavelEscaneado,
      flagFragmentado,
      contemAnexo,
    });
  }

  return {
    classificacao,
    linhas,
    tamanho,
    densidade,
    flagProvavelEscaneado,
    flagFragmentado,
  };
}



