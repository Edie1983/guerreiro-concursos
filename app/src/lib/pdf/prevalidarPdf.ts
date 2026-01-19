// src/lib/pdf/prevalidarPdf.ts
// Pré-validação estruturada do PDF (PASSO D - Fail-fast seguro)
// Detecção determinística de problemas estruturais ANTES do pré-processamento

export type PrevalidacaoPdfFlags = {
  textoInsuficiente: boolean;
  densidadeBaixa: boolean;
  semPalavrasChave: boolean;
  estruturaQuebrada: boolean;
  ruidoRepetitivo: boolean;
};

export type PrevalidacaoPdfResult = {
  flags: PrevalidacaoPdfFlags;
  estatisticas: {
    tamanho: number;
    linhas: number;
    densidade: number;
    linhasCurta: number;
    percentualLinhasCurta: number;
  };
};

/**
 * Pré-valida PDF antes do pré-processamento (PASSO D)
 * Detecta problemas estruturais de forma determinística
 * NÃO interrompe fluxo - apenas diagnóstica
 */
export function prevalidarPdf(texto: string): PrevalidacaoPdfResult {
  const tamanho = texto.length;
  const linhas = texto.split("\n");
  const numLinhas = linhas.length;
  const densidade = numLinhas > 0 ? tamanho / numLinhas : 0;

  // Flag 1: textoInsuficiente (texto < 800 chars)
  const flagTextoInsuficiente = tamanho < 800;

  // Flag 2: densidadeBaixa (média < 8 chars/linha)
  const flagDensidadeBaixa = densidade < 8;

  // Flag 3: semPalavrasChave (não contém "conteúdo", "programático", "disciplina")
  const textoNormalizado = texto.toLowerCase();
  const contemConteudo = textoNormalizado.includes("conteúdo") || textoNormalizado.includes("conteudo");
  const contemProgramatico = textoNormalizado.includes("programático") || textoNormalizado.includes("programatico");
  const contemDisciplina = textoNormalizado.includes("disciplina");
  const flagSemPalavrasChave = !contemConteudo && !contemProgramatico && !contemDisciplina;

  // Flag 4: estruturaQuebrada (>35% de linhas com ≤ 3 palavras)
  let linhasCurta = 0;
  for (const linha of linhas) {
    const palavras = linha.trim().split(/\s+/).filter(p => p.length > 0);
    if (palavras.length >= 1 && palavras.length <= 3 && linha.trim().length > 0) {
      linhasCurta++;
    }
  }
  const percentualLinhasCurta = numLinhas > 0 ? (linhasCurta / numLinhas) * 100 : 0;
  const flagEstruturaQuebrada = percentualLinhasCurta > 35;

  // Flag 5: ruidoRepetitivo (mesmo bloco repetido > 3 vezes)
  // Detecta linhas idênticas que aparecem mais de 3 vezes (provável header/footer)
  const linhaCount = new Map<string, number>();
  for (const linha of linhas) {
    const linhaTrim = linha.trim();
    if (linhaTrim.length > 0 && linhaTrim.length < 100) {
      // Apenas linhas curtas (headers/footers típicos)
      linhaCount.set(linhaTrim, (linhaCount.get(linhaTrim) || 0) + 1);
    }
  }
  
  let flagRuidoRepetitivo = false;
  for (const [linha, count] of linhaCount.entries()) {
    if (count > 3) {
      flagRuidoRepetitivo = true;
      break;
    }
  }

  const flags: PrevalidacaoPdfFlags = {
    textoInsuficiente: flagTextoInsuficiente,
    densidadeBaixa: flagDensidadeBaixa,
    semPalavrasChave: flagSemPalavrasChave,
    estruturaQuebrada: flagEstruturaQuebrada,
    ruidoRepetitivo: flagRuidoRepetitivo,
  };

  const estatisticas = {
    tamanho,
    linhas: numLinhas,
    densidade,
    linhasCurta,
    percentualLinhasCurta,
  };

  // Log DEV-only: apenas se alguma flag foi acionada
  if (typeof window !== "undefined" && import.meta.env.DEV) {
    const flagsAtivas = Object.entries(flags).filter(([_, ativa]) => ativa).map(([nome]) => nome);
    
    if (flagsAtivas.length > 0) {
      console.warn(`[prevalidarPdf] ⚠️ Flags de pré-validação acionadas:`, {
        flagsAtivas,
        flags,
        estatisticas,
      });
    } else {
      console.log(`[prevalidarPdf] ✅ Pré-validação OK`, {
        estatisticas,
      });
    }
  }

  return {
    flags,
    estatisticas,
  };
}



