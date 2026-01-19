// src/lib/parser/parserCanonico.ts
// Parser Canônico v1 - Estratégia canônica: Quadro 1 -> ANEXO II
// Estratégia: texto por índice (não depende de quebras de linha)
// Otimizado para edital IBGE APM (2025_04_APM_Edital.pdf)

export type DisciplinaExtraida = {
  nome: string;
  nomeOriginal?: string;
  conteudos: string[];
};

export type DisciplinaDebugInfo = {
  nome: string;
  encontrou: boolean;
  inicio: number;
  fim: number;
  chars: number;
  topicos: number;
  motivoFalha?: string;
};

export type Quadro1PesoDisciplina = {
  disciplina: string;
  questoes?: number; // preferencial
  pontos?: number; // opcional se aparecer
};

export type ParserDebugInfo = {
  anexoEncontrado: boolean;
  anexoStart: number;
  anexoEnd: number;
  anexoChars: number;
  anexoSnippet: string;
  disciplinasOficiais: string[];
  disciplinasDetectadas: number;
  nomesDisciplinas: string[];
  porDisciplina: DisciplinaDebugInfo[];
  quadro1Encontrado?: boolean;
  quadro1Pesos?: Quadro1PesoDisciplina[];
  quadro1Metodo?: "questoes" | "pontos" | "fallback_chars" | "nao_encontrado";
  quadro1Aviso?: string;
  // Estatísticas do PASSO H (finalização)
  totalDisciplinas?: number;
  totalTopicos?: number;
  densidadeTextual?: number;
  percentualCompletude?: number;
  scoreDeConfiabilidade?: number;
};

export type ParserResult = {
  disciplinas: DisciplinaExtraida[];
  debug: ParserDebugInfo;
};

/**
 * Disciplinas oficiais do Quadro 1 – Estrutura da Prova – APM (IBGE)
 */
const DISCIPLINAS_OFICIAIS_APM = [
  "Língua Portuguesa",
  "Geografia",
  "Raciocínio Lógico Matemático",
  "Noções de Informática",
  "Ética no Serviço Público",
];

/**
 * Palavras-chave de cabeçalho/editorial que devem ser filtradas dos tópicos
 */
const PALAVRAS_CABECALHO = [
  "edital",
  "numero",
  "instituto brasileiro",
  "geografia e estatistica",
  "ibge",
  "processo seletivo",
  "anexo",
  "conteudo programatico",
  "quadro",
  "estrutura da prova",
];

/**
 * Normaliza string removendo acentos (NFD), convertendo para lowercase e colapsando espaços
 */
function normalizarString(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .toLowerCase()
    .replace(/\s+/g, " ") // Colapsa múltiplos espaços em um
    .trim();
}

/**
 * Mapa de equivalências conservador para nomes de disciplinas
 * (somente casos explícitos e frequentes)
 */
const MAPA_EQUIVALENCIAS_DISCIPLINAS: Record<string, string> = {
  "lingua portuguesa": "Língua Portuguesa",
  "língua portuguesa": "Língua Portuguesa",
  "portugues": "Língua Portuguesa",
  "lingua inglesa": "Língua Inglesa",
  "língua inglesa": "Língua Inglesa",
  "ingles": "Língua Inglesa",
  matematica: "Matemática",
  "matematica basica": "Matemática",
  "matematica financeira": "Matemática Financeira",
  "matematica financeira basica": "Matemática Financeira",
  "probabilidade e estatistica": "Probabilidade e Estatística",
  "conhecimentos bancarios": "Conhecimentos Bancários",
  "atualidades do mercado financeiro": "Atualidades do Mercado Financeiro",
  "conhecimentos de informatica": "Conhecimentos de Informática",
  "informatica": "Conhecimentos de Informática",
  "tecnologia da informacao": "Tecnologia da Informação",
  "tecnologia da informacao e comunicacao": "Tecnologia da Informação",
  "vendas e negociacao": "Vendas e Negociação",
};

function normalizarNomeDisciplinaExplicito(nome: string): { nomeNormalizado: string; nomeOriginal: string } {
  const nomeOriginal = nome.trim();
  const chave = normalizarString(nomeOriginal);
  const nomeNormalizado = MAPA_EQUIVALENCIAS_DISCIPLINAS[chave] ?? nomeOriginal;
  return { nomeNormalizado, nomeOriginal };
}

/**
 * Encontra índice de uma substring no texto normalizado (case-insensitive e accent-insensitive)
 */
function encontrarIndiceNormalizado(
  textoNormalizado: string,
  substr: string,
  inicio: number = 0
): number {
  const substrNormalizado = normalizarString(substr);
  return textoNormalizado.indexOf(substrNormalizado, inicio);
}

/**
 * Encontra TODAS as ocorrências de uma substring no texto normalizado
 */
function encontrarTodasOcorrencias(
  textoNormalizado: string,
  substr: string
): number[] {
  const indices: number[] = [];
  const substrNormalizado = normalizarString(substr);
  let inicio = 0;

  while (true) {
    const idx = textoNormalizado.indexOf(substrNormalizado, inicio);
    if (idx === -1) break;
    indices.push(idx);
    inicio = idx + 1;
  }

  return indices;
}

/**
 * Extrai disciplinas do Quadro 1 – Estrutura da Prova – APM
 * Se extrair < 3, usa fallback fixo das 5 disciplinas oficiais
 */
function getDisciplinasOficiais(texto: string): string[] {
  const textoNormalizado = normalizarString(texto);
  const disciplinasEncontradas: string[] = [];

  // Procura por "Quadro 1" ou variações
  const indicesQuadro = [
    encontrarIndiceNormalizado(textoNormalizado, "quadro 1"),
    encontrarIndiceNormalizado(textoNormalizado, "quadro i"),
    encontrarIndiceNormalizado(textoNormalizado, "estrutura da prova"),
  ].filter((idx) => idx !== -1);

  if (indicesQuadro.length === 0) {
    // Não encontrou Quadro 1, usa fallback
    if (typeof window !== "undefined" && import.meta.env.DEV) {
      console.log(`[parserCanonico] Quadro 1 não encontrado, usando fallback fixo`);
    }
    return DISCIPLINAS_OFICIAIS_APM;
  }

  const inicioQuadro = Math.min(...indicesQuadro);
  const trechoQuadro = textoNormalizado.substring(inicioQuadro, inicioQuadro + 5000);

  // Procura pelas disciplinas oficiais no trecho do Quadro 1
  for (const disciplina of DISCIPLINAS_OFICIAIS_APM) {
    if (encontrarIndiceNormalizado(trechoQuadro, disciplina) !== -1) {
      disciplinasEncontradas.push(disciplina);
    }
  }

  // Se encontrou menos de 3, usa fallback
  if (disciplinasEncontradas.length < 3) {
    if (typeof window !== "undefined" && import.meta.env.DEV) {
      console.log(
        `[parserCanonico] Quadro 1 encontrou apenas ${disciplinasEncontradas.length} disciplinas, usando fallback fixo`
      );
    }
    return DISCIPLINAS_OFICIAIS_APM;
  }

  return disciplinasEncontradas;
}

/**
 * Extrai pesos do Quadro 1 – Estrutura da Prova
 * Busca por número de questões (ou pontos) associadas a cada disciplina
 */
function extrairPesosQuadro1(
  textoOriginal: string,
  disciplinasOficiais: string[]
): {
  pesos: Quadro1PesoDisciplina[];
  metodo: "questoes" | "pontos" | "nao_encontrado";
  encontrado: boolean;
  aviso?: string;
} {
  const textoNormalizado = normalizarString(textoOriginal);
  const disciplinasNormalizadas = disciplinasOficiais.map((d) => normalizarString(d));

  // A) Localiza região do Quadro 1
  const indicesQuadro = [
    encontrarIndiceNormalizado(textoNormalizado, "quadro 1"),
    encontrarIndiceNormalizado(textoNormalizado, "quadro i"),
    encontrarIndiceNormalizado(textoNormalizado, "estrutura da prova"),
  ].filter((idx) => idx !== -1);

  if (indicesQuadro.length === 0) {
    return {
      pesos: [],
      metodo: "nao_encontrado",
      encontrado: false,
      aviso: "Quadro 1 não encontrado no texto",
    };
  }

  const inicioQuadro = Math.min(...indicesQuadro);
  // B) Recorta janela segura (3.000 a 8.000 chars após o marcador)
  const janelaInicio = inicioQuadro;
  const janelaFim = Math.min(inicioQuadro + 8000, textoNormalizado.length);
  const trechoQuadroNormalizado = textoNormalizado.substring(janelaInicio, janelaFim);

  const pesos: Quadro1PesoDisciplina[] = [];
  let metodoDetectado: "questoes" | "pontos" | null = null;

  // C) Para cada disciplina oficial, tenta encontrar e extrair número
  for (let i = 0; i < disciplinasOficiais.length; i++) {
    const disciplinaOriginal = disciplinasOficiais[i];
    const disciplinaNormalizada = disciplinasNormalizadas[i];

    // Encontra índice da disciplina no trecho
    let idxDisciplina = trechoQuadroNormalizado.indexOf(disciplinaNormalizada);

    // Se não encontrou nome completo, tenta palavras-chave principais
    if (idxDisciplina === -1) {
      const palavrasChave = disciplinaNormalizada.split(/\s+/).filter((p) => p.length > 3);
      for (const palavra of palavrasChave) {
        idxDisciplina = trechoQuadroNormalizado.indexOf(palavra);
        if (idxDisciplina !== -1) break;
      }
    }

    if (idxDisciplina === -1) continue;

    // D) Busca números nos próximos 80-200 chars após o nome da disciplina
    const contextoDepois = trechoQuadroNormalizado.substring(
      idxDisciplina,
      Math.min(idxDisciplina + 200, trechoQuadroNormalizado.length)
    );

    // E) Tenta extrair questões (preferencial) ou pontos
    // Padrão: número entre 1 e 200 próximo ao nome
    const numerosEncontrados = contextoDepois.match(/\b(\d{1,3})\b/g);
    if (!numerosEncontrados || numerosEncontrados.length === 0) continue;

    // Filtra números plausíveis (1-200)
    const numerosValidos = numerosEncontrados
      .map((n) => parseInt(n, 10))
      .filter((n) => n >= 1 && n <= 200);

    if (numerosValidos.length === 0) continue;

    // Verifica se há menção a "pontos" antes de considerar pontos
    const temPontos = /pontos?/i.test(contextoDepois);
    const temQuestoes = /quest[oõ]es?/i.test(contextoDepois) || !temPontos;

    // Usa o primeiro número válido encontrado
    const numero = numerosValidos[0];

    if (temQuestoes && !metodoDetectado) {
      metodoDetectado = "questoes";
    } else if (temPontos && !metodoDetectado) {
      metodoDetectado = "pontos";
    }

    const peso: Quadro1PesoDisciplina = {
      disciplina: disciplinaOriginal,
    };

    if (temQuestoes) {
      peso.questoes = numero;
    } else if (temPontos) {
      peso.pontos = numero;
    } else {
      // Se não tem indicação clara, assume questões (mais comum)
      peso.questoes = numero;
      if (!metodoDetectado) metodoDetectado = "questoes";
    }

    pesos.push(peso);
  }

  // F) Valida: pelo menos 3 disciplinas com número para considerar "encontrado"
  if (pesos.length < 3) {
    return {
      pesos: [],
      metodo: "nao_encontrado",
      encontrado: false,
      aviso: `Quadro 1 encontrou apenas ${pesos.length} disciplina(s) com número válido (mínimo: 3)`,
    };
  }

  const metodoFinal = metodoDetectado || "questoes";

  if (typeof window !== "undefined" && import.meta.env.DEV) {
    console.log(`[parserCanonico] Quadro 1 encontrado: true`);
    console.log(`[parserCanonico] Quadro 1 pesos (metodo=${metodoFinal}):`, pesos);
  }

  return {
    pesos,
    metodo: metodoFinal,
    encontrado: true,
  };
}

/**
 * Valida se um trecho do ANEXO II é o correto (contém conteúdo programático e disciplinas)
 * REGRAS CANÔNICAS:
 * A) "ANEXO II" deve aparecer nos primeiros 800 caracteres do trecho (normalizado)
 * B) "CONTEUDO PROGRAMATICO" deve aparecer nos primeiros 2000 caracteres do trecho (normalizado)
 * C) Deve existir pelo menos 1 heading de disciplina válido + presença de tópicos numéricos próximos
 */
function validarAnexoII(
  trechoNormalizado: string,
  disciplinasNormalizadas: string[]
): boolean {
  // REGRA A: "ANEXO II" deve aparecer nos primeiros 800 caracteres
  const trechoInicial800 = trechoNormalizado.substring(0, 800);
  const temAnexoII = encontrarIndiceNormalizado(trechoInicial800, "anexo ii") !== -1;
  
  if (!temAnexoII) {
    if (typeof window !== "undefined" && import.meta.env.DEV) {
      console.log(`[parserCanonico] Validação ANEXO II falhou: "anexo ii" não encontrado nos primeiros 800 chars`);
    }
    return false;
  }

  // REGRA B: "CONTEUDO PROGRAMATICO" deve aparecer nos primeiros 2000 caracteres
  const trechoInicial2000 = trechoNormalizado.substring(0, 2000);
  const temConteudoProgramatico =
    encontrarIndiceNormalizado(trechoInicial2000, "conteudo programatico") !== -1 ||
    encontrarIndiceNormalizado(trechoInicial2000, "conteudos programaticos") !== -1;

  if (!temConteudoProgramatico) {
    if (typeof window !== "undefined" && import.meta.env.DEV) {
      console.log(`[parserCanonico] Validação ANEXO II falhou: "conteudo programatico" não encontrado nos primeiros 2000 chars`);
    }
    return false;
  }

  // REGRA C: Deve existir pelo menos 1 heading de disciplina válido + presença de tópicos numéricos próximos
  let encontrouDisciplinaComTopicos = false;
  for (const disciplinaNormalizada of disciplinasNormalizadas) {
    // Busca por variações: nome completo ou palavras-chave principais
    const palavrasChave = disciplinaNormalizada.split(/\s+/).filter((p) => p.length > 3);
    let idxDisciplina = -1;
    
    // Tenta nome completo primeiro
    idxDisciplina = trechoNormalizado.indexOf(disciplinaNormalizada);
    
    // Se não encontrou, tenta palavras-chave
    if (idxDisciplina === -1) {
      for (const palavra of palavrasChave) {
        idxDisciplina = trechoNormalizado.indexOf(palavra);
        if (idxDisciplina !== -1) break;
      }
    }
    
    if (idxDisciplina !== -1) {
      // Verifica se há tópicos numéricos próximos (janela de 300 chars após o heading)
      const contextoDepois = trechoNormalizado.substring(
        idxDisciplina,
        Math.min(idxDisciplina + 300, trechoNormalizado.length)
      );
      
      // Procura por padrões de tópicos numéricos: "1.", "2.", "1)", "2)", etc.
      const temTopicosNumericos = /\d+[\.\)]\s+/.test(contextoDepois);
      
      if (temTopicosNumericos) {
        encontrouDisciplinaComTopicos = true;
        if (typeof window !== "undefined" && import.meta.env.DEV) {
          console.log(`[parserCanonico] Validação ANEXO II: encontrou disciplina "${disciplinaNormalizada}" com tópicos numéricos`);
        }
        break;
      }
    }
  }

  if (!encontrouDisciplinaComTopicos) {
    if (typeof window !== "undefined" && import.meta.env.DEV) {
      console.log(`[parserCanonico] Validação ANEXO II falhou: nenhuma disciplina com tópicos numéricos encontrada`);
    }
    return false;
  }

  return true;
}

/**
 * Localiza e recorta o texto do ANEXO II REAL (não a menção na lista de anexos)
 * Encontra TODAS as ocorrências e escolhe a melhor (normalmente a última que contém conteúdo programático)
 */
function localizarAnexoII(
  texto: string,
  disciplinasOficiais: string[]
): {
  trechoOriginal: string;
  trechoNormalizado: string;
  startIdx: number;
  endIdx: number;
  encontrado: boolean;
} {
  const textoNormalizado = normalizarString(texto);
  const disciplinasNormalizadas = disciplinasOficiais.map((d) => normalizarString(d));

  const localizarIndiceProgramatico = (): number => {
    const gatilhos = ["conteudos programaticos", "conteudo programatico"];
    const indices: number[] = [];

    for (const gatilho of gatilhos) {
      indices.push(...encontrarTodasOcorrencias(textoNormalizado, gatilho));
    }

    if (indices.length === 0) return -1;

    indices.sort((a, b) => a - b);

    for (let i = indices.length - 1; i >= 0; i--) {
      const idx = indices[i];
      const janelaOriginal = texto.substring(idx, Math.min(idx + 1500, texto.length));
      if (/[A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-ZÁÉÍÓÚÂÊÔÃÕÇ\s\/\-]{3,80}:/.test(janelaOriginal)) {
        return idx;
      }
    }

    return indices[indices.length - 1];
  };

  // Encontra TODAS as ocorrências de "anexo ii"
  const indicesAnexoII = encontrarTodasOcorrencias(textoNormalizado, "anexo ii");

  if (indicesAnexoII.length === 0) {
    const idxProgramatico = localizarIndiceProgramatico();
    if (idxProgramatico === -1) {
      return {
        trechoOriginal: "",
        trechoNormalizado: "",
        startIdx: -1,
        endIdx: -1,
        encontrado: false,
      };
    }

    const trechoOriginal = texto.substring(idxProgramatico);
    const trechoNormalizado = textoNormalizado.substring(idxProgramatico);

    return {
      trechoOriginal,
      trechoNormalizado,
      startIdx: idxProgramatico,
      endIdx: texto.length,
      encontrado: true,
    };
  }

  if (typeof window !== "undefined" && import.meta.env.DEV) {
    console.log(`[parserCanonico] Encontradas ${indicesAnexoII.length} ocorrências de "anexo ii"`);
  }

  // Para cada ocorrência, valida se é o ANEXO II real
  // Começa pela última (normalmente é o correto) e vai para trás
  let melhorIndice = -1;
  let melhorTrechoNormalizado = "";

  for (let i = indicesAnexoII.length - 1; i >= 0; i--) {
    const idxInicio = indicesAnexoII[i];

    // Recorta um trecho inicial para validação (primeiros 2000 chars após "anexo ii")
    const trechoInicialNormalizado = textoNormalizado.substring(
      idxInicio,
      Math.min(idxInicio + 2000, textoNormalizado.length)
    );

    // Valida se contém "conteudo programatico" e pelo menos 1 disciplina
    if (validarAnexoII(trechoInicialNormalizado, disciplinasNormalizadas)) {
      melhorIndice = idxInicio;
      melhorTrechoNormalizado = trechoInicialNormalizado;
      break;
    }
  }

  // Se não encontrou nenhum válido, fallback: usar a última ocorrência mas logar claramente
  if (melhorIndice === -1) {
    const idxProgramatico = localizarIndiceProgramatico();
    if (idxProgramatico !== -1) {
      melhorIndice = idxProgramatico;
      melhorTrechoNormalizado = textoNormalizado.substring(
        idxProgramatico,
        Math.min(idxProgramatico + 2000, textoNormalizado.length)
      );
      if (typeof window !== "undefined" && import.meta.env.DEV) {
        console.warn(
          `[parserCanonico] ⚠️ FALLBACK: Nenhum ANEXO II válido encontrado, usando marcador de conteúdos programáticos no índice ${melhorIndice}`
        );
      }
    } else {
      melhorIndice = indicesAnexoII[indicesAnexoII.length - 1];
      if (typeof window !== "undefined" && import.meta.env.DEV) {
        console.warn(
          `[parserCanonico] ⚠️ FALLBACK: Nenhum ANEXO II válido encontrado após validação canônica, usando última ocorrência no índice ${melhorIndice}`
        );
      }
    }
  } else {
    if (typeof window !== "undefined" && import.meta.env.DEV) {
      console.log(`[parserCanonico] ✓ ANEXO II válido encontrado no índice ${melhorIndice} (passou validação canônica)`);
    }
  }

  // Procura por "ANEXO III" para definir o fim
  const textoRestanteNormalizado = textoNormalizado.substring(melhorIndice);
  const possiveisTerminos = ["anexo iii", "anexo 3", "anexo iv", "anexo 4"];
  const indicesFim = possiveisTerminos
    .map((gatilho) => encontrarIndiceNormalizado(textoRestanteNormalizado, gatilho))
    .filter((idx) => idx !== -1);
  const indexFimRelativo = indicesFim.length > 0 ? Math.min(...indicesFim) : -1;

  let endIdx: number;
  if (indexFimRelativo !== -1) {
    endIdx = melhorIndice + indexFimRelativo;
  } else {
    endIdx = texto.length;
  }

  const trechoOriginal = texto.substring(melhorIndice, endIdx);
  const trechoNormalizado = textoNormalizado.substring(melhorIndice, endIdx);

  return {
    trechoOriginal,
    trechoNormalizado,
    startIdx: melhorIndice,
    endIdx,
    encontrado: true,
  };
}

/**
 * Gera tokens principais (palavras-chave) de uma disciplina normalizada
 * Para "Noções de Informática": ["nocoes", "informatica"]
 * Para "Raciocínio Lógico Matemático": ["raciocinio", "logico", "matematico"]
 */
function gerarTokensDisciplina(disciplinaNormalizada: string): string[] {
  const palavras = disciplinaNormalizada.split(/\s+/);
  return palavras.filter((p) => p.length > 3).map((p) => p.trim());
}

/**
 * Encontra heading de uma disciplina por assinatura (tokens)
 * Busca por ocorrência de TODOS os tokens principais próximos (janela pequena)
 * Especial para "Noções de Informática" que pode vir como "NOCOES DE INFORMATICA" ou "NOCOES BASICAS DE INFORMATICA"
 */
function encontrarHeadingPorAssinatura(
  anexoNormalizado: string,
  disciplinaNormalizada: string,
  disciplinaOriginal: string
): number | null {
  const tokens = gerarTokensDisciplina(disciplinaNormalizada);

  // Caso especial: "Noções de Informática"
  // Aceita variações: "nocoes" + "informatica" ou "nocoes" + "basicas" + "informatica"
  if (disciplinaOriginal.toLowerCase().includes("informática") || disciplinaOriginal.toLowerCase().includes("informatica")) {
    const idxInformatica = anexoNormalizado.indexOf("informatica");
    if (idxInformatica !== -1) {
      // Verifica se há "nocoes" ou "basicas" próximo (janela de 50 chars antes)
      const contextoAntes = anexoNormalizado.substring(
        Math.max(0, idxInformatica - 50),
        idxInformatica
      );
      if (contextoAntes.includes("nocoes") || contextoAntes.includes("basicas")) {
        // Encontra o início de "nocoes" ou "basicas"
        const idxNocoes = contextoAntes.lastIndexOf("nocoes");
        const idxBasicas = contextoAntes.lastIndexOf("basicas");
        const idxInicio = Math.max(idxNocoes, idxBasicas);
        if (idxInicio !== -1) {
          const idxAbsoluto = Math.max(0, idxInformatica - 50) + idxInicio;
          // Valida contexto depois (deve ter números indicando tópicos)
          const contextoDepois = anexoNormalizado.substring(
            idxInformatica,
            Math.min(idxInformatica + 200, anexoNormalizado.length)
          );
          if (/\d+[\.\)]/.test(contextoDepois)) {
            if (typeof window !== "undefined" && import.meta.env.DEV) {
              console.log(`[parserCanonico] Heading "${disciplinaOriginal}" encontrado por assinatura no índice ${idxAbsoluto}`);
            }
            return idxAbsoluto;
          }
        }
      }
    }
  }

  // Para outras disciplinas: busca por TODOS os tokens principais próximos
  // Tenta encontrar todos os tokens em uma janela pequena (até 100 chars)
  const primeiraPalavra = tokens[0];
  if (!primeiraPalavra) return null;

  let idxAtual = 0;
  while (true) {
    const idxPrimeira = anexoNormalizado.indexOf(primeiraPalavra, idxAtual);
    if (idxPrimeira === -1) break;

    // Verifica se os outros tokens estão próximos (janela de 100 chars)
    const janela = anexoNormalizado.substring(
      idxPrimeira,
      Math.min(idxPrimeira + 100, anexoNormalizado.length)
    );

    let todosTokensPresentes = true;
    for (let i = 1; i < tokens.length; i++) {
      if (!janela.includes(tokens[i])) {
        todosTokensPresentes = false;
        break;
      }
    }

    if (todosTokensPresentes) {
      // Valida contexto depois (deve ter números indicando tópicos)
      const contextoDepois = anexoNormalizado.substring(
        idxPrimeira,
        Math.min(idxPrimeira + 200, anexoNormalizado.length)
      );
      if (/\d+[\.\)]/.test(contextoDepois)) {
        if (typeof window !== "undefined" && import.meta.env.DEV) {
          console.log(`[parserCanonico] Heading "${disciplinaOriginal}" encontrado por assinatura no índice ${idxPrimeira}`);
        }
        return idxPrimeira;
      }
    }

    idxAtual = idxPrimeira + 1;
  }

  return null;
}

/**
 * Detecta headings de disciplinas diretamente no ANEXO (padrão: texto em CAIXA ALTA seguido de ":")
 */
function detectarHeadingsProgramaticos(anexoOriginal: string): string[] {
  const candidatos: string[] = [];
  const regex = /([A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9\s\/\-]{2,80}?):/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(anexoOriginal)) !== null) {
    let heading = match[1].trim().replace(/\s+/g, " ");

    const idxHeading = match.index ?? 0;
    const trechoDepois = anexoOriginal.substring(
      idxHeading,
      Math.min(idxHeading + 200, anexoOriginal.length)
    );

    if (!/\d+\s*[\-–—\.]/.test(trechoDepois)) continue;

    if (heading.length < 3 || heading.length > 80) continue;
    if (heading.startsWith("ANEXO")) continue;
    if (/[a-záéíóúâêôãõç]/.test(heading)) continue;
    if (normalizarString(heading).includes("conteudos programaticos")) continue;

    const partes = heading.split(" ").filter((p) => p.trim().length > 0);
    const palavrasContexto = [
      "escriturario",
      "nome",
      "relacionamento",
      "agente",
      "conhecimentos",
      "basicos",
      "especificos",
      "comercial",
      "area",
    ];

    if (partes.length > 3) {
      const filtradas = partes.filter(
        (p) => !palavrasContexto.includes(normalizarString(p))
      );

      if (filtradas.length >= 2) {
        heading = filtradas.slice(-4).join(" ");
      } else {
        heading = partes.slice(-4).join(" ");
      }
    }

    heading = heading.split(" ").slice(-4).join(" ").trim();
    if (heading.length < 3) continue;

    const headingNormalizado = normalizarString(heading);
    if (headingNormalizado === "de" || headingNormalizado === "-") continue;
    const somenteLetras = headingNormalizado.replace(/[^a-z]/g, "");
    if (somenteLetras.length < 3) continue;

    const padroesNormalizacao: Array<{ teste: RegExp; valor: string }> = [
      { teste: /lingua portuguesa/, valor: "Língua Portuguesa" },
      { teste: /lingua inglesa/, valor: "Língua Inglesa" },
      { teste: /matematica financeira/, valor: "Matemática Financeira" },
      { teste: /matematica\b/, valor: "Matemática" },
      { teste: /atualidades do mercado financeiro/, valor: "Atualidades do Mercado Financeiro" },
      { teste: /probabilidade e estatistica/, valor: "Probabilidade e Estatística" },
      { teste: /conhecimentos bancarios/, valor: "Conhecimentos Bancários" },
      { teste: /conhecimentos de informatica/, valor: "Conhecimentos de Informática" },
      { teste: /tecnologia da informacao/, valor: "Tecnologia da Informação" },
      { teste: /vendas e negociacao/, valor: "Vendas e Negociação" },
    ];

    for (const regra of padroesNormalizacao) {
      if (regra.teste.test(headingNormalizado)) {
        heading = regra.valor;
        break;
      }
    }

    if (!candidatos.includes(heading)) {
      candidatos.push(heading);
    }
  }

  return candidatos;
}

/**
 * Localiza TODAS as seções de disciplinas no ANEXO II
 * Retorna array ordenado por índice de início
 */
function localizarTodasSecoes(
  anexoNormalizado: string,
  anexoOriginal: string,
  disciplinasOficiais: string[],
  disciplinasNormalizadas: string[]
): Array<{ disciplina: string; inicio: number }> {
  const secoes: Array<{ disciplina: string; inicio: number }> = [];

  for (let i = 0; i < disciplinasOficiais.length; i++) {
    const disciplinaOriginal = disciplinasOficiais[i];
    const disciplinaNormalizada = disciplinasNormalizadas[i];

    // Tenta primeiro nome completo
    let idxInicio = anexoNormalizado.indexOf(disciplinaNormalizada);

    // Se não encontrou, tenta por assinatura (tokens)
    if (idxInicio === -1) {
      idxInicio = encontrarHeadingPorAssinatura(
        anexoNormalizado,
        disciplinaNormalizada,
        disciplinaOriginal
      ) ?? -1;
    }

    if (idxInicio !== -1) {
      secoes.push({ disciplina: disciplinaOriginal, inicio: idxInicio });
    }
  }

  // Ordena por índice de início
  secoes.sort((a, b) => a.inicio - b.inicio);

  if (typeof window !== "undefined" && import.meta.env.DEV) {
    console.log(`[parserCanonico] Seções encontradas (ordenadas):`, secoes.map((s) => `${s.disciplina} @ ${s.inicio}`));
  }

  return secoes;
}

/**
 * Verifica se um tópico contém palavras de cabeçalho/editorial
 */
function contemCabecalho(topico: string): boolean {
  const topicoNormalizado = normalizarString(topico);
  return PALAVRAS_CABECALHO.some((palavra) => topicoNormalizado.includes(palavra));
}

/**
 * Extrai tópicos de uma seção
 * Suporta: (a) "1. ... 2. ... 3. ..." na mesma linha
 *         (b) "1. ..." em linhas separadas
 *         (c) itens com ";" e frases longas (3-240 chars)
 * FILTRA tópicos que contenham cabeçalhos/editorial
 */
function extrairTopicos(secaoOriginal: string): string[] {
  const topicos: string[] = [];
  const topicosSet = new Set<string>();
  const linhasProcessadas = new Set<number>();

  const registrarTopico = (texto: string): boolean => {
    const topicoNormalizado = texto.trim().replace(/\s+/g, " ");
    if (topicoNormalizado.length < 3 || topicoNormalizado.length > 240) return false;

    const topicoLimpo = topicoNormalizado.replace(/[;:]+$/, "").trim();
    if (
      topicoLimpo.length < 3 ||
      contemCabecalho(topicoLimpo) ||
      topicosSet.has(topicoLimpo)
    ) {
      return false;
    }

    topicos.push(topicoLimpo);
    topicosSet.add(topicoLimpo);
    return true;
  };

  const quebrarBlocoLivre = (texto: string): string[] => {
    const base = texto.trim().replace(/\s+/g, " ");
    if (base.length === 0) return [];

    // Regra 1: itens separados por ponto e vírgula
    const porPontoEVirgula = base.split(/;\s*/).map((p) => p.trim()).filter(Boolean);
    if (porPontoEVirgula.length > 1) {
      return porPontoEVirgula;
    }

    // Regra 2: enumerações implícitas (romanos, números ou letras seguidos de -.) dentro da frase
    const partesEnumeradas = base
      .split(/(?=\b(?:\d{1,2}|[ivxlcdm]{1,4}|[a-z])[\)\-–—.]\s+)/i)
      .map((p) => p.trim())
      .filter(Boolean);
    if (partesEnumeradas.length > 1) {
      return partesEnumeradas;
    }

    // Regra 3: blocos extensos quebrados em sentenças
    if (base.length > 180) {
      const sentencas = base
        .split(/(?<=[.;])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/)
        .map((s) => s.trim())
        .filter((s) => s.length >= 20 && s.length <= 240);

      if (sentencas.length > 1) {
        return sentencas;
      }

      // Regra 4: pausas fortes com vírgula seguidas de maiúsculas
      const subfrases = base
        .split(/,\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/)
        .map((s) => s.trim())
        .filter((s) => s.length >= 20 && s.length <= 240);

      if (subfrases.length > 1) {
        return subfrases;
      }
    }

    return [base];
  };

  const linhas = secaoOriginal.split(/\n/);

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i].trim();
    if (linha.length === 0) continue;
    let linhaConsumida = false;

    // Padrão (a): Conteúdos numerados na mesma linha
    const matchesMesmaLinha = linha.matchAll(/\d+\s*[\.\)\-–—]\s+([^0-9]+?)(?=\d+\s*[\.\)\-–—]|$)/g);

    for (const match of matchesMesmaLinha) {
      if (match[1]) {
        if (registrarTopico(match[1])) {
          linhaConsumida = true;
        }
      }
    }

    if (linhaConsumida) {
      linhasProcessadas.add(i);
      continue;
    }

    // Padrão (b): Conteúdo numerado em linha separada "1. Conteúdo"
    const matchNumero = linha.match(/^\d+\s*[\.\)\-–—]\s+(.+)/);
    if (matchNumero && matchNumero[1]) {
      if (registrarTopico(matchNumero[1])) {
        linhasProcessadas.add(i);
        linhaConsumida = true;
      }
      continue;
    }

    const linhaPareceHeading = /^[A-ZÁÉÍÓÚÇ\s]{10,}$/.test(linha);
    const linhaComecaNumero = /^\d+[\.\)]/.test(linha);

    // Heurísticas para blocos corridos (ponto e vírgula, enumerações implícitas, frases longas)
    if (!linhaPareceHeading && !linhaComecaNumero) {
      const segmentos = quebrarBlocoLivre(linha);
      let inseriu = false;

      for (const segmento of segmentos) {
        if (registrarTopico(segmento)) {
          inseriu = true;
        }
      }

      if (inseriu) {
        linhasProcessadas.add(i);
        linhaConsumida = true;
      }
    }

    if (linhaConsumida) {
      linhasProcessadas.add(i);
      continue;
    }

    // Padrão: Linha que parece conteúdo (não título)
    if (
      linha.length >= 3 &&
      linha.length <= 240 &&
      !linhaPareceHeading && // Não é só maiúsculas
      !linhaComecaNumero && // Não começa com número
      !linhasProcessadas.has(i)
    ) {
      registrarTopico(linha);
    }
  }

  return topicos.slice(0, 120); // Limita a 120 tópicos por disciplina
}

/**
 * PASSO H - Finalizador Canônico
 * Refina e normaliza a saída final do parser:
 * - Normaliza headings de disciplinas
 * - Corrige hierarquia e estrutura
 * - Fecha blocos abertos
 * - Saneia duplicidades
 * - Consolidar estatísticas finais
 * 
 * TESTE: deve consolidar corretamente tópicos fragmentados
 * TESTE: deve validar pesos do Quadro 1 quando existir
 */
function canonicFinalizer(resultado: ParserResult): ParserResult {
  const { disciplinas, debug } = resultado;

  // PASSO H.1: Normalização de headings de disciplinas
  const disciplinasNormalizadas = disciplinas.map((disciplina) => {
    const base = disciplina.nome.trim().replace(/\s+/g, " ");
    const { nomeNormalizado } = normalizarNomeDisciplinaExplicito(base);

    return {
      nome: nomeNormalizado,
      nomeOriginal: disciplina.nomeOriginal ?? base,
      conteudos: disciplina.conteudos,
    };
  });

  // PASSO H.2: Saneamento de duplicidades e correção de hierarquia
  const disciplinasSaneadas: DisciplinaExtraida[] = [];
  const nomesVistos = new Set<string>();

  for (const disciplina of disciplinasNormalizadas) {
    const nomeLower = normalizarString(disciplina.nome);
    
    // Se já vimos esta disciplina, mescla os conteúdos
    if (nomesVistos.has(nomeLower)) {
      const disciplinaExistente = disciplinasSaneadas.find(
        (d) => normalizarString(d.nome) === nomeLower
      );
      if (disciplinaExistente) {
        // Mescla tópicos únicos
        const topicosUnicos = new Set([
          ...disciplinaExistente.conteudos,
          ...disciplina.conteudos,
        ]);
        disciplinaExistente.conteudos = Array.from(topicosUnicos);
      }
    } else {
      // PASSO H.3: Limpa e normaliza tópicos
      const topicosNormalizados = disciplina.conteudos
        .map((topico) => {
          // Remove espaços múltiplos
          let topicoLimpo = topico.trim().replace(/\s+/g, " ");
          
          // Remove pontuação repetida no final
          topicoLimpo = topicoLimpo.replace(/[;:]+$/, "").trim();
          
          // Remove tópicos muito curtos ou muito longos
          if (topicoLimpo.length < 3 || topicoLimpo.length > 240) {
            return null;
          }
          
          return topicoLimpo;
        })
        .filter((topico): topico is string => topico !== null);

      // Remove duplicatas dentro da mesma disciplina
      const topicosUnicos = Array.from(new Set(topicosNormalizados));

      disciplinasSaneadas.push({
        nome: disciplina.nome,
        nomeOriginal: disciplina.nomeOriginal ?? disciplina.nome,
        conteudos: topicosUnicos,
      });

      nomesVistos.add(nomeLower);
    }
  }

  // PASSO H.4: Fechamento de blocos abertos
  // Garante que todas as disciplinas oficiais estejam presentes
  const disciplinasFinais: DisciplinaExtraida[] = [];
  const disciplinasSaneadasMap = new Map(
    disciplinasSaneadas.map((d) => [normalizarString(d.nome), d])
  );

  // Se temos disciplinas oficiais no debug, garante que todas estejam presentes
  if (debug.disciplinasOficiais && debug.disciplinasOficiais.length > 0) {
    for (const disciplinaOficial of debug.disciplinasOficiais) {
      const nomeLower = normalizarString(disciplinaOficial);
      const disciplinaEncontrada = disciplinasSaneadasMap.get(nomeLower);

      if (disciplinaEncontrada) {
        disciplinasFinais.push(disciplinaEncontrada);
      } else {
        // Adiciona disciplina oficial mesmo sem tópicos (para manter estrutura)
        disciplinasFinais.push({
          nome: disciplinaOficial,
          nomeOriginal: disciplinaOficial,
          conteudos: [],
        });
      }
    }
  } else {
    // Se não temos disciplinas oficiais, usa as saneadas
    disciplinasFinais.push(...disciplinasSaneadas);
  }

  // PASSO H.5: Consolidar estatísticas finais
  const totalDisciplinas = disciplinasFinais.length;
  const totalTopicos = disciplinasFinais.reduce(
    (acc, d) => acc + d.conteudos.length,
    0
  );

  // Densidade textual: média de tópicos por disciplina
  const densidadeTextual =
    totalDisciplinas > 0 ? totalTopicos / totalDisciplinas : 0;

  // Percentual de completude: disciplinas com tópicos / total de disciplinas oficiais
  const totalDisciplinasOficiais = debug.disciplinasOficiais?.length || 0;
  const disciplinasComTopicos = disciplinasFinais.filter(
    (d) => d.conteudos.length > 0
  ).length;
  const percentualCompletude =
    totalDisciplinasOficiais > 0
      ? (disciplinasComTopicos / totalDisciplinasOficiais) * 100
      : 0;

  // Score de confiabilidade (0-100):
  // - Base: anexo encontrado (30%)
  // - Completude (40%)
  // - Densidade textual (30%)
  let scoreDeConfiabilidade = 0;
  if (debug.anexoEncontrado) {
    scoreDeConfiabilidade += 30;
  }
  scoreDeConfiabilidade += Math.min((percentualCompletude / 100) * 40, 40);
  scoreDeConfiabilidade += Math.min((densidadeTextual / 20) * 30, 30);
  scoreDeConfiabilidade = Math.round(scoreDeConfiabilidade);

  // Log DEV-only (PASSO H)
  if (typeof window !== "undefined" && import.meta.env.DEV) {
    console.log(`[Parser/H] Finalização canônica concluída`, {
      totalDisciplinas,
      totalTopicos,
      densidadeTextual: densidadeTextual.toFixed(2),
      percentualCompletude: percentualCompletude.toFixed(1),
      scoreDeConfiabilidade,
    });
  }

  const devEnv =
    (typeof import.meta !== "undefined" && (import.meta as any).env?.DEV) ||
    (typeof process !== "undefined" && process.env.NODE_ENV !== "production");
  if (devEnv) {
    console.log(
      `[parserCanonico] Disciplinas (originais -> normalizadas):`,
      disciplinasFinais.map((d) => `${d.nomeOriginal || d.nome} -> ${d.nome}`)
    );
  }

  // Retorna resultado refinado
  return {
    disciplinas: disciplinasFinais,
    debug: {
      ...debug,
      disciplinasDetectadas: totalDisciplinas,
      nomesDisciplinas: disciplinasFinais.map((d) => d.nome),
      totalDisciplinas,
      totalTopicos,
      densidadeTextual: Math.round(densidadeTextual * 100) / 100,
      percentualCompletude: Math.round(percentualCompletude * 100) / 100,
      scoreDeConfiabilidade,
    },
  };
}

/**
 * Parser Canônico v1 - Estratégia: Quadro 1 -> ANEXO II (texto por índice)
 */
export function parserCanonico(texto: string): ParserResult {
  // Log de debug (apenas em dev)
  if (typeof window !== "undefined" && import.meta.env.DEV) {
    console.log(`[parserCanonico] Iniciando parse, texto: ${texto.length} caracteres`);
  }

  // 1. Extrai disciplinas do Quadro 1 (lista oficial)
  const disciplinasOficiais = getDisciplinasOficiais(texto);

  if (typeof window !== "undefined" && import.meta.env.DEV) {
    console.log(`[parserCanonico] Disciplinas oficiais (Quadro 1):`, disciplinasOficiais);
  }

  // 1.5. Extrai pesos do Quadro 1 (questões/pontos por disciplina)
  const quadro1Result = extrairPesosQuadro1(texto, disciplinasOficiais);

  // 2. Localiza e recorta ANEXO II REAL (não a menção na lista)
  const { trechoOriginal, trechoNormalizado, startIdx, endIdx, encontrado: anexoEncontrado } =
    localizarAnexoII(texto, disciplinasOficiais);

  // 2.1 Ajuste heurístico: se não encontrou Quadro 1, tenta extrair headings diretamente do ANEXO
  let disciplinasParaUso = disciplinasOficiais;
  if (!quadro1Result.encontrado && trechoOriginal.length > 0) {
    const headingsDetectadas = detectarHeadingsProgramaticos(trechoOriginal);
    if (headingsDetectadas.length >= 3) {
      disciplinasParaUso = headingsDetectadas;
    }
  }

  // Gera snippet (200 caracteres do começo do ANEXO II)
  const anexoSnippet = trechoOriginal.substring(0, 200).replace(/\n/g, " ").trim();

  if (typeof window !== "undefined" && import.meta.env.DEV) {
    console.log(`[parserCanonico] ANEXO II encontrado: ${anexoEncontrado}`);
    if (anexoEncontrado) {
      console.log(`[parserCanonico] ANEXO II índices: [${startIdx}, ${endIdx}]`);
      console.log(`[parserCanonico] ANEXO II tamanho: ${trechoOriginal.length} caracteres`);
      console.log(`[parserCanonico] ANEXO II snippet: "${anexoSnippet}..."`);
    }
  }

  // Se não encontrou ANEXO II, retorna vazio
  if (!anexoEncontrado || trechoOriginal.length === 0) {
    return {
      disciplinas: [],
      debug: {
        anexoEncontrado: false,
        anexoStart: -1,
        anexoEnd: -1,
        anexoChars: 0,
        anexoSnippet: "",
        disciplinasOficiais,
        disciplinasDetectadas: 0,
        nomesDisciplinas: [],
        porDisciplina: disciplinasOficiais.map((nome) => ({
          nome,
          encontrou: false,
          inicio: -1,
          fim: -1,
          chars: 0,
          topicos: 0,
          motivoFalha: "ANEXO II não encontrado",
        })),
        quadro1Encontrado: quadro1Result.encontrado,
        quadro1Pesos: quadro1Result.encontrado ? quadro1Result.pesos : undefined,
        quadro1Metodo: quadro1Result.metodo,
        quadro1Aviso: quadro1Result.aviso,
      },
    };
  }

  // 3. Localiza TODAS as seções de disciplinas (ordenadas por índice)
  const disciplinasNormalizadas = disciplinasParaUso.map((d) => normalizarString(d));
  const secoesEncontradas = localizarTodasSecoes(
    trechoNormalizado,
    trechoOriginal,
    disciplinasParaUso,
    disciplinasNormalizadas
  );

  // 4. Para cada disciplina oficial, extrai seção e conteúdos
  const disciplinas: DisciplinaExtraida[] = [];
  const nomesDisciplinas: string[] = [];
  const porDisciplina: DisciplinaDebugInfo[] = [];

  for (let i = 0; i < disciplinasParaUso.length; i++) {
    const disciplinaOficial = disciplinasParaUso[i];
    const { nomeNormalizado, nomeOriginal } = normalizarNomeDisciplinaExplicito(disciplinaOficial);

    // Encontra a seção desta disciplina
    const secaoEncontrada = secoesEncontradas.find((s) => s.disciplina === disciplinaOficial);

    if (secaoEncontrada) {
      // Calcula o fim: início da próxima seção ou fim do ANEXO II
      let idxFim = trechoNormalizado.length;
      const idxProximaSecao = secoesEncontradas.findIndex((s) => s.inicio > secaoEncontrada.inicio);
      if (idxProximaSecao !== -1) {
        idxFim = secoesEncontradas[idxProximaSecao].inicio;
      }

      // Extrai o trecho da seção
      const secaoOriginal = trechoOriginal.substring(secaoEncontrada.inicio, idxFim);
      const secaoChars = secaoOriginal.length;

      // Extrai tópicos da seção
      const topicos = extrairTopicos(secaoOriginal);

      if (topicos.length > 0) {
        disciplinas.push({
          nome: nomeNormalizado,
          nomeOriginal,
          conteudos: topicos,
        });
        nomesDisciplinas.push(disciplinaOficial);
      }

      // Debug info por disciplina
      porDisciplina.push({
        nome: disciplinaOficial,
        encontrou: true,
        inicio: secaoEncontrada.inicio,
        fim: idxFim,
        chars: secaoChars,
        topicos: topicos.length,
        motivoFalha: topicos.length === 0 ? "Nenhum tópico encontrado na seção" : undefined,
      });
    } else {
      // Disciplina não encontrada
      porDisciplina.push({
        nome: disciplinaOficial,
        encontrou: false,
        inicio: -1,
        fim: -1,
        chars: 0,
        topicos: 0,
        motivoFalha: "Heading da disciplina não encontrado no ANEXO II",
      });
    }
  }

  if (typeof window !== "undefined" && import.meta.env.DEV) {
    console.log(`[parserCanonico] Disciplinas detectadas: ${disciplinas.length}`);
    console.log(`[parserCanonico] Nomes:`, nomesDisciplinas);
    console.log(`[parserCanonico] Debug por disciplina:`, porDisciplina);
  }

  // Construi resultado bruto antes do PASSO H
  const resultadoBruto: ParserResult = {
    disciplinas,
    debug: {
      anexoEncontrado,
      anexoStart: startIdx,
      anexoEnd: endIdx,
      anexoChars: trechoOriginal.length,
      anexoSnippet,
      disciplinasOficiais: disciplinasParaUso,
      disciplinasDetectadas: disciplinas.length,
      nomesDisciplinas,
      porDisciplina,
      quadro1Encontrado: quadro1Result.encontrado,
      quadro1Pesos: quadro1Result.encontrado ? quadro1Result.pesos : undefined,
      quadro1Metodo: quadro1Result.metodo,
      quadro1Aviso: quadro1Result.aviso,
    },
  };

  // PASSO H: Finalização canônica (refina e normaliza resultado)
  return canonicFinalizer(resultadoBruto);
}
