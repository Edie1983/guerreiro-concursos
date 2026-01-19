// src/lib/mapaTatico/gerarMapaTatico.ts
// Mapa Tático Canônico - Fase A + B + C
// Fase A: Peso por caracteres (chars)
// Fase B: Peso por questões do Quadro 1 (quando disponível)
// Fase C: Priorização estratégica (score cruzando questões + chars)
// Trabalha EXCLUSIVAMENTE com dados já processados (disciplinas + tópicos)
// NÃO lê PDF, NÃO usa IA, NÃO acessa textoBruto, NÃO recalcula parser

import type {
  EditalProcessado,
  DisciplinaProcessada,
} from "../../mocks/processarEditalMock";

export type MapaTaticoDisciplina = {
  nome: string;
  totalTopicos: number;
  totalChars: number;
  questoes?: number;
  pesoQuestoes?: number; // % por questões (2 casas)
  pesoChars: number; // % por chars (2 casas) — sempre calculado
  pesoRelativo: number; // Peso principal (questoes se houver, senão chars)
  metodoPeso: "questoes" | "chars";
  prioridade: "ALTA" | "MEDIA" | "BAIXA";
  scorePrioridade: number; // Score 0..100 (Fase C: cruzamento questões + chars)
  rank: number; // Posição 1..N após ordenar por scorePrioridade
};

export type MapaTaticoValidacao = {
  alinhamentoQuadro1?: {
    disciplinasQuadro1SemMatch: string[];
    aviso?: string;
  };
  totalQuestoesDiscrepancia?: {
    totalCalculado: number;
    totalInformado: number;
    diferenca: number;
    aviso?: string;
  };
};

export type MapaTatico = {
  totalDisciplinas: number;
  totalTopicos: number;
  totalChars: number;
  totalQuestoes?: number;
  metodoPeso: "questoes" | "chars";
  disciplinas: MapaTaticoDisciplina[];
  validacao?: MapaTaticoValidacao; // DEV-only, não persistido
};

/**
 * Calcula o total de caracteres de uma disciplina (soma dos caracteres de todos os tópicos)
 */
function calcularCharsDisciplina(disciplina: DisciplinaProcessada): number {
  return disciplina.conteudos.reduce((total, topico) => total + topico.length, 0);
}

/**
 * Define a prioridade baseada no peso relativo
 */
function definirPrioridade(pesoRelativo: number): "ALTA" | "MEDIA" | "BAIXA" {
  if (pesoRelativo >= 25) {
    return "ALTA";
  }
  if (pesoRelativo >= 10) {
    return "MEDIA";
  }
  return "BAIXA";
}

/**
 * Calcula score de prioridade estratégica (Fase C)
 * 
 * REGRAS:
 * - Se metodoPeso="questoes": score = 70% pesoQuestoes + 30% pesoChars
 * - Se metodoPeso="chars": score = 100% pesoChars (mantém Fase A como baseline)
 * 
 * O score varia de 0 a 100, onde 100 = maior prioridade.
 * 
 * @param pesoQuestoes - Peso por questões (0..100) ou undefined
 * @param pesoChars - Peso por chars (0..100)
 * @param metodoPeso - Método de peso usado
 * @returns Score de prioridade (0..100)
 */
function calcularScorePrioridade(
  pesoQuestoes: number | undefined,
  pesoChars: number,
  metodoPeso: "questoes" | "chars"
): number {
  if (metodoPeso === "questoes" && pesoQuestoes !== undefined) {
    // Fase C: cruzamento 70% questões + 30% chars
    return pesoQuestoes * 0.7 + pesoChars * 0.3;
  }
  // Fallback: 100% chars (Fase A baseline)
  return pesoChars;
}

/**
 * Gera o Mapa Tático estratégico a partir de um edital processado
 * 
 * FASE C: Priorização estratégica cruzando questões (70%) + chars (30%)
 * FASE B: Usa peso por questões do Quadro 1 quando disponível
 * FASE A (fallback): Usa peso por caracteres se Quadro 1 não estiver disponível
 * 
 * @param edital - Edital processado com disciplinas e tópicos
 * @returns Mapa Tático completo com estatísticas, prioridades e scores
 */
export function gerarMapaTatico(edital: EditalProcessado): MapaTatico {
  const { disciplinas, quadro1Pesos, totalQuestoesQuadro1 } = edital;

  // Calcula totais gerais
  let totalChars = 0;
  let totalTopicos = 0;

  // Primeira passagem: calcula totais
  for (const disciplina of disciplinas) {
    const charsDisciplina = calcularCharsDisciplina(disciplina);
    totalChars += charsDisciplina;
    totalTopicos += disciplina.conteudos.length;
  }

  // Validações de sanidade (DEV-only) - executadas antes para usar totalCalculado se necessário
  const validacao: MapaTaticoValidacao | undefined =
    typeof window !== "undefined" && import.meta.env.DEV
      ? validarMapaTatico(disciplinas, quadro1Pesos, totalQuestoesQuadro1)
      : undefined;

  // 4.2) Se houver discrepância, usa totalCalculado como total efetivo (runtime)
  let totalQuestoesEfetivo = totalQuestoesQuadro1;
  if (
    validacao?.totalQuestoesDiscrepancia &&
    validacao.totalQuestoesDiscrepancia.diferenca > 0
  ) {
    totalQuestoesEfetivo = validacao.totalQuestoesDiscrepancia.totalCalculado;
  }

  // Determina método de peso
  const temQuadro1Questoes =
    quadro1Pesos && quadro1Pesos.length > 0 && totalQuestoesEfetivo && totalQuestoesEfetivo > 0;
  const metodoPeso = temQuadro1Questoes ? "questoes" : "chars";

  // Segunda passagem: gera mapa por disciplina
  const disciplinasMapa: MapaTaticoDisciplina[] = disciplinas.map((disciplina) => {
    const totalTopicosDisciplina = disciplina.conteudos.length;
    const totalCharsDisciplina = calcularCharsDisciplina(disciplina);

    // Calcula pesoChars (sempre, para transparência)
    const pesoChars = totalChars > 0 ? (totalCharsDisciplina / totalChars) * 100 : 0;

    // Busca questões do Quadro 1 para esta disciplina
    const pesoQuadro1 = quadro1Pesos?.find(
      (p) => normalizarNome(p.disciplina) === normalizarNome(disciplina.nome)
    );
    const questoes = pesoQuadro1?.questoes;

    // Calcula pesoQuestoes se houver questões (usa totalQuestoesEfetivo se houver discrepância)
    let pesoQuestoes: number | undefined;
    if (temQuadro1Questoes && questoes !== undefined && totalQuestoesEfetivo) {
      pesoQuestoes = (questoes / totalQuestoesEfetivo) * 100;
    }

    // Define peso relativo principal e prioridade
    const pesoRelativo = metodoPeso === "questoes" && pesoQuestoes !== undefined ? pesoQuestoes : pesoChars;
    const prioridade = definirPrioridade(pesoRelativo);

    // Fase C: Calcula score de prioridade estratégica
    const scorePrioridade = calcularScorePrioridade(pesoQuestoes, pesoChars, metodoPeso);

    return {
      nome: disciplina.nome,
      totalTopicos: totalTopicosDisciplina,
      totalChars: totalCharsDisciplina,
      questoes,
      pesoQuestoes: pesoQuestoes !== undefined ? Math.round(pesoQuestoes * 100) / 100 : undefined,
      pesoChars: Math.round(pesoChars * 100) / 100,
      pesoRelativo: Math.round(pesoRelativo * 100) / 100,
      metodoPeso,
      prioridade,
      scorePrioridade: Math.round(scorePrioridade * 100) / 100,
      rank: 0, // Será preenchido após ordenação
    };
  });

  // Ordena disciplinas pelo score de prioridade (Fase C)
  disciplinasMapa.sort((a, b) => b.scorePrioridade - a.scorePrioridade);

  // Atribui rank após ordenação
  disciplinasMapa.forEach((disciplina, index) => {
    disciplina.rank = index + 1;
  });

  return {
    totalDisciplinas: disciplinas.length,
    totalTopicos,
    totalChars,
    totalQuestoes: totalQuestoesEfetivo || totalQuestoesQuadro1,
    metodoPeso,
    disciplinas: disciplinasMapa,
    validacao,
  };
}

/**
 * Validações de sanidade do Mapa Tático (DEV-only)
 * 
 * 4.1) Validação de alinhamento Quadro1 vs ANEXO II
 * 4.2) Validação de totalQuestoesQuadro1
 */
function validarMapaTatico(
  disciplinas: DisciplinaProcessada[],
  quadro1Pesos: EditalProcessado["quadro1Pesos"],
  totalQuestoesQuadro1: EditalProcessado["totalQuestoesQuadro1"]
): MapaTaticoValidacao {
  const validacao: MapaTaticoValidacao = {};

  // 4.1) Validação de alinhamento Quadro1 vs ANEXO II
  if (quadro1Pesos && quadro1Pesos.length > 0) {
    const nomesDisciplinasProcessadas = new Set(
      disciplinas.map((d) => normalizarNome(d.nome))
    );
    const disciplinasQuadro1SemMatch: string[] = [];

    for (const pesoQuadro1 of quadro1Pesos) {
      const nomeNormalizado = normalizarNome(pesoQuadro1.disciplina);
      if (!nomesDisciplinasProcessadas.has(nomeNormalizado)) {
        disciplinasQuadro1SemMatch.push(pesoQuadro1.disciplina);
      }
    }

    if (disciplinasQuadro1SemMatch.length > 0) {
      validacao.alinhamentoQuadro1 = {
        disciplinasQuadro1SemMatch,
        aviso: `${disciplinasQuadro1SemMatch.length} disciplina(s) do Quadro 1 não foram encontradas no ANEXO II: ${disciplinasQuadro1SemMatch.join(", ")}`,
      };
      console.warn(
        `[gerarMapaTatico] ⚠️ Alinhamento Quadro1 vs ANEXO II:`,
        validacao.alinhamentoQuadro1.aviso
      );
    }
  }

  // 4.2) Validação de totalQuestoesQuadro1
  if (quadro1Pesos && quadro1Pesos.length > 0 && totalQuestoesQuadro1 !== undefined) {
    const totalCalculado = quadro1Pesos.reduce((total, p) => total + (p.questoes || 0), 0);
    const diferenca = Math.abs(totalCalculado - totalQuestoesQuadro1);

    if (diferenca > 0) {
      validacao.totalQuestoesDiscrepancia = {
        totalCalculado,
        totalInformado: totalQuestoesQuadro1,
        diferenca,
        aviso: `Discrepância detectada: soma real=${totalCalculado}, informado=${totalQuestoesQuadro1}, diferença=${diferenca}`,
      };
      console.warn(
        `[gerarMapaTatico] ⚠️ Discrepância totalQuestoesQuadro1:`,
        validacao.totalQuestoesDiscrepancia.aviso
      );
    }
  }

  return validacao;
}

/**
 * Normaliza nome de disciplina para comparação (remove acentos, lowercase)
 */
function normalizarNome(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
