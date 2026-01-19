// src/mocks/processarEditalMock.ts
import { parserCanonico, type Quadro1PesoDisciplina } from "../lib/parser/parserCanonico";
import { pipelinePdf } from "../lib/pdf/pipelinePdf";
import { gerarDiagnosticoPdf } from "../lib/pdf/diagnosticoPdf";

export type DisciplinaProcessada = {
  nome: string;
  conteudos: string[];
};

export type EditalProcessado = {
  id: string;
  titulo: string;
  orgao: string;
  banca: string;
  cargo: string;
  vagas: string;
  disciplinas: DisciplinaProcessada[];
  textoBruto: string;
  criadoEmISO: string;
  quadro1Pesos?: Quadro1PesoDisciplina[];
  totalQuestoesQuadro1?: number;
  debugInfo?: {
    anexoEncontrado: boolean;
    anexoStart: number;
    anexoEnd: number;
    anexoChars: number;
    anexoSnippet: string;
    disciplinasOficiais: string[];
    disciplinasDetectadas: number;
    nomesDisciplinas: string[];
    porDisciplina: Array<{
      nome: string;
      encontrou: boolean;
      inicio: number;
      fim: number;
      chars: number;
      topicos: number;
      motivoFalha?: string;
    }>;
    quadro1Encontrado?: boolean;
    quadro1Pesos?: Quadro1PesoDisciplina[];
    quadro1Metodo?: "questoes" | "pontos" | "fallback_chars" | "nao_encontrado";
    quadro1Aviso?: string;
  };
};

function pickTitleFallback(fileName: string): string {
  const base = fileName.replace(/\.pdf$/i, "").trim();
  return base.length > 0 ? base : "Edital Processado";
}

/**
 * Extrai informações básicas do edital (órgão, banca, cargo) do texto
 * Busca em TODO o texto, não apenas nas primeiras linhas
 */
function extrairInfoBasica(texto: string): {
  orgao: string;
  banca: string;
  cargo: string;
  vagas: string;
} {
  // Usa TODO o texto para busca (não limita a 100 linhas)
  // Mas prioriza as primeiras 500 linhas para informações básicas
  const linhas = texto.split("\n");
  const textoInicial = linhas.slice(0, 500).join(" ").toLowerCase();
  const textoCompleto = texto.toLowerCase();

  // Padrões para órgão
  let orgao = "Órgão não identificado";
  const padroesOrgao = [
    /(?:órgão|orgão|organização):\s*([A-ZÁÉÍÓÚÇ][A-ZÁÉÍÓÚÇa-záéíóúç\s]{5,40})/i,
    /(?:ministério|secretaria|instituto|agência|autarquia)\s+([A-ZÁÉÍÓÚÇ][A-ZÁÉÍÓÚÇa-záéíóúç\s]{5,40})/i,
    /instituto\s+brasileiro\s+de\s+geografia\s+e\s+estatística/i,
  ];

  for (const padrao of padroesOrgao) {
    const match = textoInicial.match(padrao);
    if (match && match[1]) {
      orgao = match[1].trim();
      break;
    } else if (match) {
      // Match direto (ex: IBGE)
      if (padrao.source.includes("instituto brasileiro")) {
        orgao = "Instituto Brasileiro de Geografia e Estatística (IBGE)";
        break;
      }
    }
  }

  // Padrões para banca
  let banca = "Banca não identificada";
  const padroesBanca = [
    /(?:banca|organizadora):\s*([A-ZÁÉÍÓÚÇ][A-ZÁÉÍÓÚÇa-záéíóúç\s]{3,30})/i,
    /(?:cebraspe|cespe|fcc|funesp|vunesp|fgv|cesgranrio|esaf)/i,
  ];

  for (const padrao of padroesBanca) {
    const match = textoInicial.match(padrao);
    if (match && match[1]) {
      banca = match[1].trim();
    } else if (match) {
      // Match direto no nome da banca
      const matchNome = textoInicial.match(/(cebraspe|cespe|fcc|funesp|vunesp|fgv|cesgranrio|esaf)/i);
      if (matchNome) {
        banca = matchNome[1].toUpperCase();
      }
    }
  }

  // Padrões para cargo
  let cargo = "Cargo não identificado";
  const padroesCargo = [
    /(?:cargo|função):\s*([A-ZÁÉÍÓÚÇ][A-ZÁÉÍÓÚÇa-záéíóúç\s]{5,50})/i,
    /(?:para\s+o\s+cargo\s+de|para\s+provimento\s+do\s+cargo)\s+([A-ZÁÉÍÓÚÇ][A-ZÁÉÍÓÚÇa-záéíóúç\s]{5,50})/i,
    /agente\s+de\s+pesquisas\s+e\s+mapeamento/i,
  ];

  for (const padrao of padroesCargo) {
    const match = textoInicial.match(padrao);
    if (match && match[1]) {
      cargo = match[1].trim();
      break;
    } else if (match) {
      // Match direto (ex: APM)
      if (padrao.source.includes("agente de pesquisas")) {
        cargo = "Agente de Pesquisas e Mapeamento (APM)";
        break;
      }
    }
  }

  // Padrões para vagas (busca em todo o texto)
  let vagas = "—";
  const padroesVagas = [
    /(?:vagas?|número\s+de\s+vagas?):\s*(\d+)/i,
    /(\d+)\s+vagas?/i,
  ];

  // Tenta primeiro no texto inicial, depois no texto completo
  for (const padrao of padroesVagas) {
    let match = textoInicial.match(padrao);
    if (!match) {
      match = textoCompleto.match(padrao);
    }
    if (match && match[1]) {
      vagas = match[1];
      break;
    }
  }

  return { orgao, banca, cargo, vagas };
}

/**
 * Detecta motivo de falha no parsing
 */
function detectarMotivoFalha(
  texto: string,
  anexoEncontrado: boolean,
  disciplinasOficiais: string[]
): string {
  if (!anexoEncontrado) {
    return "Anexo II não encontrado no edital";
  }

  const temConteudoProgramatico = /conteúdo\s+programático/i.test(texto);
  if (!temConteudoProgramatico) {
    return "Estrutura de conteúdo programático não reconhecida";
  }

  // Verifica se pelo menos uma disciplina oficial está no texto
  const temDisciplinas = disciplinasOficiais.some((disciplina) =>
    new RegExp(disciplina.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(
      texto
    )
  );

  if (!temDisciplinas) {
    return "Nenhuma disciplina do Quadro 1 foi encontrada no texto";
  }

  return "Estrutura não reconhecida pelo parser";
}

/**
 * Processa um edital usando o Parser Canônico v1 (Pipeline Passo B)
 */
export async function processarEditalMock(params: {
  file: File;
  fileName: string;
}): Promise<EditalProcessado> {
  const { file, fileName } = params;

  // Simula "tempo de IA"
  await new Promise((r) => setTimeout(r, 900));

  const id = crypto.randomUUID();

  // Usa Pipeline Inteligente (Passo C): extractPdfText → classificarPdf → preprocessarTexto → parserCanonico
  const resultado = await pipelinePdf(file);

  // Roteamento baseado em status (PASSO C)
  if (resultado.status === "pdf_escaneado") {
    const textoOriginal = resultado.textoOriginal;
    
    // Log DEV-only
    if (typeof window !== "undefined" && import.meta.env.DEV) {
      console.warn(`[processarEditalMock] PDF escaneado detectado: ${resultado.mensagem}`, {
        flags: resultado.flags,
      });
    }

    // Retorna objeto com erro no debug
    return {
      id,
      titulo: pickTitleFallback(fileName),
      orgao: "Órgão não identificado",
      banca: "Banca não identificada",
      cargo: "Cargo não identificado",
      vagas: "—",
      disciplinas: [
        {
          nome: "Erro no Processamento",
          conteudos: [
            resultado.mensagem,
            "O PDF parece estar escaneado (imagem).",
            "Utilize uma versão do edital com texto selecionável.",
          ],
        },
      ],
      textoBruto: textoOriginal,
      criadoEmISO: new Date().toISOString(),
      debugInfo:
        typeof window !== "undefined" && import.meta.env.DEV
          ? {
              anexoEncontrado: false,
              anexoStart: -1,
              anexoEnd: -1,
              anexoChars: 0,
              anexoSnippet: "",
              disciplinasOficiais: [],
              disciplinasDetectadas: 0,
              nomesDisciplinas: [],
              porDisciplina: [],
              quadro1Encontrado: false,
            }
          : undefined,
    };
  }

  // Se erro de extração, retorna similar
  if (resultado.status === "erro_extracao") {
    const textoOriginal = resultado.textoOriginal;

    if (typeof window !== "undefined" && import.meta.env.DEV) {
      console.error(`[processarEditalMock] Erro no pipeline: ${resultado.mensagem}`, {
        flags: resultado.flags,
      });
    }

    return {
      id,
      titulo: pickTitleFallback(fileName),
      orgao: "Órgão não identificado",
      banca: "Banca não identificada",
      cargo: "Cargo não identificado",
      vagas: "—",
      disciplinas: [
        {
          nome: "Erro no Processamento",
          conteudos: [resultado.mensagem, "Erro ao processar o PDF."],
        },
      ],
      textoBruto: textoOriginal,
      criadoEmISO: new Date().toISOString(),
      debugInfo:
        typeof window !== "undefined" && import.meta.env.DEV
          ? {
              anexoEncontrado: false,
              anexoStart: -1,
              anexoEnd: -1,
              anexoChars: 0,
              anexoSnippet: "",
              disciplinasOficiais: [],
              disciplinasDetectadas: 0,
              nomesDisciplinas: [],
              porDisciplina: [],
              quadro1Encontrado: false,
            }
          : undefined,
    };
  }

  // Pipeline bem-sucedida (status === "ok"): usa resultado do parser
  const { resultadoParser, textoOriginal, flags } = resultado;
  const { disciplinas: disciplinasExtraidas, debug } = resultadoParser;

  // Extrai informações básicas (usa texto original para extrairInfoBasica)
  const infoBasica = extrairInfoBasica(textoOriginal);

  // Log de debug: valida que o texto completo chegou (PASSO C)
  if (typeof window !== "undefined" && import.meta.env.DEV) {
    console.log(`[processarEditalMock] Pipeline OK`, {
      tamanhoTexto: textoOriginal.length,
      contemAnexo: /anexo/i.test(textoOriginal),
      contemConteudoProgramatico: /conteúdo\s+programático/i.test(textoOriginal),
      flags,
    });
  }

  // Se o parser encontrou pelo menos 1 disciplina, usa as encontradas
  // Só cai em fallback se encontrar 0 disciplinas
  const disciplinas: DisciplinaProcessada[] =
    disciplinasExtraidas.length > 0
      ? disciplinasExtraidas
      : [
          {
            nome: "Conteúdo Programático",
            conteudos: [
              detectarMotivoFalha(
                textoOriginal,
                debug.anexoEncontrado,
                debug.disciplinasOficiais
              ),
              "O parser não conseguiu identificar a estrutura de disciplinas.",
              "Verifique se o PDF contém o ANEXO II com conteúdo programático.",
            ],
          },
        ];

  // Calcula totalQuestoesQuadro1 se houver pesos
  const totalQuestoesQuadro1 =
    debug.quadro1Pesos && debug.quadro1Metodo === "questoes"
      ? debug.quadro1Pesos.reduce((total, p) => total + (p.questoes || 0), 0)
      : undefined;

  // Diagnóstico DEV-only: usa flags do pipeline (PASSO C + D)
  if (
    typeof window !== "undefined" &&
    import.meta.env.DEV &&
    (flags.headingsQuebrados || flags.possivelAnexoPerdido || flags.fragmentado ||
     flags.textoInsuficiente || flags.densidadeBaixa || flags.semPalavrasChave ||
     flags.estruturaQuebrada || flags.ruidoRepetitivo)
  ) {
    console.warn(
      `[processarEditalMock] ⚠️ Flags de diagnóstico disparadas (PASSO C + D)`,
      {
        flags,
        anexoEncontrado: debug.anexoEncontrado,
        disciplinasDetectadas: debug.disciplinasDetectadas,
        disciplinasOficiais: debug.disciplinasOficiais.length,
      }
    );
  }

  // Gera diagnóstico consolidado (PASSO E)
  const diagnosticoPdf = gerarDiagnosticoPdf(resultado);

  // Info de debug (apenas em dev) - repassa debug completo do parser + flags + diagnóstico (PASSO D + E)
  const debugInfo =
    typeof window !== "undefined" && import.meta.env.DEV
      ? {
          anexoEncontrado: debug.anexoEncontrado,
          anexoStart: debug.anexoStart,
          anexoEnd: debug.anexoEnd,
          anexoChars: debug.anexoChars,
          anexoSnippet: debug.anexoSnippet,
          disciplinasOficiais: debug.disciplinasOficiais,
          disciplinasDetectadas: debug.disciplinasDetectadas,
          nomesDisciplinas: debug.nomesDisciplinas,
          porDisciplina: debug.porDisciplina,
          quadro1Encontrado: debug.quadro1Encontrado,
          quadro1Pesos: debug.quadro1Pesos,
          quadro1Metodo: debug.quadro1Metodo,
          quadro1Aviso: debug.quadro1Aviso,
          // Flags do PASSO D (pré-validação)
          flagsPrevalidacao: {
            textoInsuficiente: flags.textoInsuficiente,
            densidadeBaixa: flags.densidadeBaixa,
            semPalavrasChave: flags.semPalavrasChave,
            estruturaQuebrada: flags.estruturaQuebrada,
            ruidoRepetitivo: flags.ruidoRepetitivo,
          },
          // Diagnóstico consolidado (PASSO E)
          diagnosticoPdf,
        }
      : undefined;

  return {
    id,
    titulo: pickTitleFallback(fileName),
    orgao: infoBasica.orgao,
    banca: infoBasica.banca,
    cargo: infoBasica.cargo,
    vagas: infoBasica.vagas,
    disciplinas,
    textoBruto: textoOriginal, // Mantém texto original (não processado) para referência
    criadoEmISO: new Date().toISOString(),
    quadro1Pesos: debug.quadro1Pesos,
    totalQuestoesQuadro1,
    debugInfo,
  };
}
