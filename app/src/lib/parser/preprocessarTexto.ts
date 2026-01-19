// src/lib/parser/preprocessarTexto.ts
// Pré-processador de texto puro (sem IA) para melhorar compatibilidade com PDFs
// Aplicado ANTES do parser canônico, sem alterar a lógica do parser

/**
 * Normaliza uma linha para uso como título (PASSO A)
 * - Remove invisíveis
 * - Normaliza espaços
 * - Mantém pontuação
 * - NÃO altera palavras
 * - NÃO junta linhas
 * - NÃO cria headings
 */
function normalizarLinhaParaTitulo(linha: string): string {
  // Remove caracteres invisíveis
  let normalizada = linha.replace(/[\u00A0\u200B\u200C\u200D\uFEFF]/g, " ");
  
  // Normaliza espaços múltiplos (mas preserva estrutura)
  normalizada = normalizada.replace(/[ \t]+/g, " ");
  
  // Trim mas mantém conteúdo
  normalizada = normalizada.trim();
  
  return normalizada;
}

/**
 * Sanea blocos de texto interrompidos por quebra acidental (PASSO A)
 * Regra determinística: apenas junta linhas que terminam com `;` ou `:` ou quebras após vírgulas curtas
 * Sem heurística inteligente - apenas padrões simples e seguros
 */
function sanearBlocosDeTexto(linhas: string[]): string[] {
  const linhasSanadas: string[] = [];
  let i = 0;

  while (i < linhas.length) {
    const linhaAtual = linhas[i];
    const linhaAtualTrim = linhaAtual.trim();
    
    // Regra 1: Se linha atual termina com `;` ou `:`, junta com próxima (se não for vazia)
    // Padrão determinístico: pontuação de fim de frase indica continuação
    if (linhaAtualTrim.endsWith(";") || linhaAtualTrim.endsWith(":")) {
      if (i + 1 < linhas.length) {
        const proximaLinha = linhas[i + 1].trim();
        // Só junta se próxima linha não for vazia
        if (proximaLinha.length > 0) {
          linhasSanadas.push(linhaAtualTrim + " " + proximaLinha);
          i += 2;
          continue;
        }
      }
    }
    
    // Regra 2: Se linha atual termina com vírgula e próxima linha é curta (1-3 palavras), junta
    // Critério conservador: apenas se próxima linha tem exatamente 1-3 palavras
    if (linhaAtualTrim.endsWith(",") && i + 1 < linhas.length) {
      const proximaLinha = linhas[i + 1].trim();
      
      if (proximaLinha.length > 0) {
        const palavrasProxima = proximaLinha.split(/\s+/).filter(p => p.length > 0);
        
        // Só junta se próxima linha tem 1-3 palavras (critério determinístico)
        if (palavrasProxima.length >= 1 && palavrasProxima.length <= 3) {
          // Proteção: não junta se próxima linha parece ser heading (tudo maiúsculas ou começa com número)
          const pareceHeading = /^[A-ZÁÉÍÓÚÇ][A-ZÁÉÍÓÚÇ\s]+$/.test(proximaLinha) || /^\d+\./.test(proximaLinha);
          
          if (!pareceHeading) {
            linhasSanadas.push(linhaAtualTrim + " " + proximaLinha);
            i += 2;
            continue;
          }
        }
      }
    }
    
    // Caso contrário, mantém linha como está (preserva original, não trim)
    linhasSanadas.push(linhaAtual);
    i++;
  }

  return linhasSanadas;
}

/**
 * Conta palavras em uma linha
 */
function contarPalavras(linha: string): number {
  return linha.trim().split(/\s+/).filter(p => p.length > 0).length;
}

/**
 * Pré-processa texto extraído do PDF para melhorar compatibilidade
 * 
 * Regras aplicadas:
 * - Normaliza quebras de linha (\r\n -> \n)
 * - Colapsa espaços múltiplos
 * - Remove caracteres invisíveis comuns (NBSP, etc)
 * - Corrige hífen de quebra de linha (ex: "conteú-\n do" -> "conteúdo")
 * - PASSO A: Normaliza linhas para títulos e sanea blocos de texto
 * 
 * @param textoOriginal - Texto bruto extraído do PDF
 * @returns Texto higienizado (mantém conteúdo textual, apenas normaliza formatação)
 */
export function preprocessarTexto(textoOriginal: string): string {
  let texto = textoOriginal;

  // 1) Normalizar quebras de linha: \r\n -> \n
  texto = texto.replace(/\r\n/g, "\n");
  texto = texto.replace(/\r/g, "\n");

  // 2) Remover caracteres invisíveis comuns, substituindo por espaço normal
  // NBSP (\u00A0), Zero Width Space (\u200B), etc
  texto = texto.replace(/[\u00A0\u200B\u200C\u200D\uFEFF]/g, " ");

  // 3) Corrigir hífen de quebra de linha: "palavra-\n palavra" -> "palavrapalavra"
  // Padrão: letra + hífen + quebra de linha + espaço opcional + letra
  texto = texto.replace(/([a-záéíóúçA-ZÁÉÍÓÚÇ])\s*-\s*\n\s*([a-záéíóúçA-ZÁÉÍÓÚÇ])/g, "$1$2");

  // 4) Colapsar espaços múltiplos: "   " -> " "
  // Mas preserva quebras de linha
  texto = texto.replace(/[ \t]+/g, " ");

  // 5) Normalizar quebras de linha múltiplas (máximo 2 consecutivas)
  // Evita blocos enormes de linhas vazias
  texto = texto.replace(/\n{3,}/g, "\n\n");

  // 6) Remover espaços no início/fim de linhas (trim por linha)
  // Mas preserva estrutura geral
  let linhas = texto.split("\n");
  
  // PASSO A: Normalizar linhas para títulos (remove invisíveis, normaliza espaços)
  linhas = linhas.map(normalizarLinhaParaTitulo);
  
  // PASSO A: Sanear blocos de texto interrompidos
  linhas = sanearBlocosDeTexto(linhas);
  
  // Recompõe texto
  texto = linhas.join("\n");

  return texto;
}

/**
 * Normaliza texto para busca de "ANEXO II" (aceita variações de espaços invisíveis e hífen)
 * Usado apenas para DETECÇÃO/contagem, não altera o texto processado
 */
function normalizarParaBusca(texto: string): string {
  // Remove caracteres invisíveis e normaliza espaços para busca
  return texto
    .replace(/[\u00A0\u200B\u200C\u200D\uFEFF]/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/**
 * Conta ocorrências de "ANEXO II" com variações (case-insensitive, espaços invisíveis, hífen)
 * Usa padrão mais flexível para detectar variações comuns
 */
function contarOcorrenciasAnexoII(texto: string): number {
  const textoNormalizado = normalizarParaBusca(texto);
  
  // Padrão único mais flexível que cobre variações:
  // - "anexo ii" (com espaços)
  // - "anexo-ii" (com hífen)
  // - "anexoii" (sem espaço)
  // - Aceita espaços invisíveis normalizados
  const padraoUnico = /anexo\s*[-]?\s*ii/gi;
  
  const matches = textoNormalizado.match(padraoUnico);
  return matches ? matches.length : 0;
}

/**
 * Conta ocorrências de uma string (case-insensitive) - genérico
 */
function contarOcorrencias(texto: string, padrao: string): number {
  const regex = new RegExp(padrao.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
  const matches = texto.match(regex);
  return matches ? matches.length : 0;
}

/**
 * Pré-processa texto e retorna estatísticas (DEV-only)
 * PASSO A: Adiciona logs de linhas antes/depois, linhas suspeitas e percentual de ruído
 */
export function preprocessarTextoComLogs(
  textoOriginal: string
): { textoProcessado: string; stats: { tamanhoOriginal: number; tamanhoProcessado: number; ocorrenciasAnexoIIAntes: number; ocorrenciasAnexoIIDepois: number; linhasAntes: number; linhasDepois: number; linhasSuspeitas: number; percentualRuidoRemovido: number } } {
  const tamanhoOriginal = textoOriginal.length;
  // Usa função melhorada que aceita variações de espaços invisíveis e hífen
  const ocorrenciasAnexoIIAntes = contarOcorrenciasAnexoII(textoOriginal);

  // PASSO A: Conta linhas antes do processamento
  const linhasAntes = textoOriginal.split("\n").length;
  
  // PASSO A: Conta linhas suspeitas (1-3 palavras) antes
  const linhasSuspeitasAntes = textoOriginal
    .split("\n")
    .filter(linha => {
      const palavras = contarPalavras(linha);
      return palavras >= 1 && palavras <= 3 && linha.trim().length > 0;
    }).length;

  const textoProcessado = preprocessarTexto(textoOriginal);

  const tamanhoProcessado = textoProcessado.length;
  // Usa função melhorada para contar após processamento também
  const ocorrenciasAnexoIIDepois = contarOcorrenciasAnexoII(textoProcessado);

  // PASSO A: Conta linhas depois do processamento
  const linhasDepois = textoProcessado.split("\n").length;
  
  // PASSO A: Conta linhas suspeitas (1-3 palavras) depois
  const linhasSuspeitasDepois = textoProcessado
    .split("\n")
    .filter(linha => {
      const palavras = contarPalavras(linha);
      return palavras >= 1 && palavras <= 3 && linha.trim().length > 0;
    }).length;
  
  // PASSO A: Calcula percentual de ruído removido (redução de linhas suspeitas)
  const linhasSuspeitas = linhasSuspeitasAntes - linhasSuspeitasDepois;
  const percentualRuidoRemovido = linhasSuspeitasAntes > 0 
    ? Math.round((linhasSuspeitas / linhasSuspeitasAntes) * 100) 
    : 0;

  // Logs DEV-only (PASSO A: expandido)
  if (typeof window !== "undefined" && import.meta.env.DEV) {
    console.log(`[preprocessarTexto] Pré-processamento (PASSO A):`, {
      tamanhoOriginal,
      tamanhoProcessado,
      reducao: tamanhoOriginal - tamanhoProcessado,
      ocorrenciasAnexoIIAntes,
      ocorrenciasAnexoIIDepois,
      linhasAntes,
      linhasDepois,
      linhasSuspeitas: linhasSuspeitasAntes,
      linhasSuspeitasDepois,
      linhasSuspeitasRemovidas: linhasSuspeitas,
      percentualRuidoRemovido: `${percentualRuidoRemovido}%`,
    });
  }

  return {
    textoProcessado,
    stats: {
      tamanhoOriginal,
      tamanhoProcessado,
      ocorrenciasAnexoIIAntes,
      ocorrenciasAnexoIIDepois,
      linhasAntes,
      linhasDepois,
      linhasSuspeitas: linhasSuspeitasAntes, // Total antes (para referência)
      percentualRuidoRemovido,
    },
  };
}

