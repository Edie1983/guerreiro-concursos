// src/gc/uxPolicy.ts
// Política de UX do GC (PASSO I - Runtime)
// Função pura que decide ações UI baseada em flags B/C/D/E conforme PASSO H

import type { DiagnosticoPdf } from "../lib/pdf/diagnosticoPdf";

export type GcUxAction = "UPLOAD_OTHER" | "RETRY" | "CONTINUE";

export type GcUxDecision = {
  severity: "ALTA" | "MEDIA" | "BAIXA";
  mode: "BLOCK" | "CONFIRM" | "INFO";
  title: string;
  message: string;
  primary: { label: string; action: GcUxAction };
  secondary?: { label: string; action: GcUxAction };
  otherAlerts?: Array<{ title: string; message: string }>;
  key?: string; // PASSO W.1: Key do motivo principal para telemetria
};

type FlagInfo = {
  key: string;
  severity: "ALTA" | "MEDIA" | "BAIXA";
  title: string;
  message: string;
  primaryAction: GcUxAction;
  secondaryAction: GcUxAction;
};

// Mapeamento de flags para informações (conforme PASSO H - H4)
const FLAGS_MAP: Record<string, FlagInfo> = {
  // PASSO B (classificação)
  fragmentado: {
    key: "fragmentado",
    severity: "MEDIA",
    title: "PDF com texto fragmentado",
    message:
      "Este PDF parece estar com o texto fragmentado. Posso continuar, mas o resultado pode sair incompleto ou fora de ordem.",
    primaryAction: "CONTINUE",
    secondaryAction: "UPLOAD_OTHER",
  },
  escaneado: {
    key: "escaneado",
    severity: "ALTA",
    title: "Não consigo ler este PDF",
    message:
      "Este arquivo parece ser um PDF escaneado (sem texto selecionável). Assim, não dá para extrair o Anexo II com segurança.",
    primaryAction: "UPLOAD_OTHER",
    secondaryAction: "RETRY",
  },
  // PASSO C (fail-safe)
  possivelAnexoPerdido: {
    key: "possivelAnexoPerdido",
    severity: "MEDIA",
    title: "Pode faltar parte do Anexo II",
    message:
      "Encontrei sinais de que o Anexo II pode estar incompleto neste arquivo. Posso tentar, mas o mapa pode ficar faltando itens.",
    primaryAction: "CONTINUE",
    secondaryAction: "UPLOAD_OTHER",
  },
  headingsQuebrados: {
    key: "headingsQuebrados",
    severity: "MEDIA",
    title: "Estrutura do anexo está confusa",
    message:
      "A estrutura de títulos e seções do Anexo II está inconsistente. Posso tentar, mas pode haver classificação errada de disciplinas/tópicos.",
    primaryAction: "CONTINUE",
    secondaryAction: "UPLOAD_OTHER",
  },
  // PASSO D (pré-validação)
  textoInsuficiente: {
    key: "textoInsuficiente",
    severity: "ALTA",
    title: "Conteúdo insuficiente para extração",
    message:
      "O conteúdo extraído é insuficiente para montar o mapa do Anexo II. Tente um PDF com texto selecionável e completo.",
    primaryAction: "UPLOAD_OTHER",
    secondaryAction: "RETRY",
  },
  estruturaQuebrada: {
    key: "estruturaQuebrada",
    severity: "ALTA",
    title: "Não encontrei o Anexo II de forma confiável",
    message:
      "Este PDF não contém o Anexo II de um jeito que eu consiga identificar com segurança. Envie outra versão do edital.",
    primaryAction: "UPLOAD_OTHER",
    secondaryAction: "RETRY",
  },
  densidadeBaixa: {
    key: "densidadeBaixa",
    severity: "MEDIA",
    title: "Qualidade do texto está ruim",
    message:
      "O texto extraído está com muitos ruídos. Posso continuar, mas pode haver erros no resultado.",
    primaryAction: "CONTINUE",
    secondaryAction: "UPLOAD_OTHER",
  },
  semPalavrasChave: {
    key: "semPalavrasChave",
    severity: "MEDIA",
    title: "Estrutura do anexo parece incompleta",
    message:
      "A estrutura do Anexo II parece incompleta. Posso tentar, mas o resultado pode faltar partes.",
    primaryAction: "CONTINUE",
    secondaryAction: "UPLOAD_OTHER",
  },
  ruidoRepetitivo: {
    key: "ruidoRepetitivo",
    severity: "BAIXA",
    title: "Encontrei pequenas inconsistências",
    message:
      "Encontrei pequenas inconsistências no texto, mas nada que impeça continuar.",
    primaryAction: "CONTINUE",
    secondaryAction: "UPLOAD_OTHER",
  },
};

// Status do diagnóstico (PASSO E)
const STATUS_MAP: Record<string, FlagInfo> = {
  pdf_escaneado: {
    key: "status_pdf_escaneado",
    severity: "ALTA",
    title: "Não consigo ler este PDF",
    message:
      "Este arquivo está no formato escaneado (imagem). Preciso de um PDF com texto selecionável para extrair o Anexo II.",
    primaryAction: "UPLOAD_OTHER",
    secondaryAction: "RETRY",
  },
  erro_extracao: {
    key: "status_erro_extracao",
    severity: "ALTA",
    title: "Falha ao extrair o Anexo II",
    message:
      "Não consegui extrair o Anexo II com segurança a partir deste PDF. Tente outro arquivo (ou uma versão com texto selecionável).",
    primaryAction: "UPLOAD_OTHER",
    secondaryAction: "RETRY",
  },
};

/**
 * Extrai todas as flags ativas do diagnóstico
 */
function extrairFlagsAtivas(diagnostico: DiagnosticoPdf): Array<FlagInfo> {
  const flags: Array<FlagInfo> = [];

  // PASSO B (classificação)
  if (diagnostico.classificacao.fragmentado) {
    flags.push(FLAGS_MAP.fragmentado);
  }
  if (diagnostico.classificacao.escaneado) {
    flags.push(FLAGS_MAP.escaneado);
  }

  // PASSO C (fail-safe)
  if (diagnostico.failSafe.possivelAnexoPerdido) {
    flags.push(FLAGS_MAP.possivelAnexoPerdido);
  }
  if (diagnostico.failSafe.headingsQuebrados) {
    flags.push(FLAGS_MAP.headingsQuebrados);
  }

  // PASSO D (pré-validação)
  if (diagnostico.prevalidacao.textoInsuficiente) {
    flags.push(FLAGS_MAP.textoInsuficiente);
  }
  if (diagnostico.prevalidacao.estruturaQuebrada) {
    flags.push(FLAGS_MAP.estruturaQuebrada);
  }
  if (diagnostico.prevalidacao.densidadeBaixa) {
    flags.push(FLAGS_MAP.densidadeBaixa);
  }
  if (diagnostico.prevalidacao.semPalavrasChave) {
    flags.push(FLAGS_MAP.semPalavrasChave);
  }
  if (diagnostico.prevalidacao.ruidoRepetitivo) {
    flags.push(FLAGS_MAP.ruidoRepetitivo);
  }

  // Status do diagnóstico (PASSO E) - tem prioridade
  if (diagnostico.status === "pdf_escaneado" || diagnostico.status === "erro_extracao") {
    flags.unshift(STATUS_MAP[diagnostico.status]); // Adiciona no início (maior prioridade)
  }

  return flags;
}

/**
 * Seleciona o motivo principal conforme regras do PASSO H (H3)
 * Prioridade: ALTA > MEDIA > BAIXA
 * Dentro de cada nível, ordem específica
 */
function selecionarMotivoPrincipal(flags: Array<FlagInfo>): FlagInfo | null {
  if (flags.length === 0) return null;

  // Ordem de prioridade dentro de ALTA (conforme H3)
  const ordemAlta = [
    "estruturaQuebrada", // Falha de integridade
    "status_pdf_escaneado",
    "status_erro_extracao",
    "escaneado", // PDF escaneado
    "textoInsuficiente", // Texto insuficiente
  ];

  // Ordem de prioridade dentro de MEDIA (conforme H3)
  const ordemMedia = [
    "fragmentado", // PDF fragmentado
    "headingsQuebrados", // Headings quebrados
    "possivelAnexoPerdido", // Possível anexo perdido
    "densidadeBaixa",
    "semPalavrasChave",
  ];

  // Separa por severidade
  const altas = flags.filter((f) => f.severity === "ALTA");
  const medias = flags.filter((f) => f.severity === "MEDIA");
  const baixas = flags.filter((f) => f.severity === "BAIXA");

  // ALTA tem prioridade absoluta
  if (altas.length > 0) {
    // Ordena conforme ordem específica
    for (const key of ordemAlta) {
      const flag = altas.find((f) => f.key === key);
      if (flag) return flag;
    }
    // Se não encontrou na ordem específica, retorna a primeira ALTA
    return altas[0];
  }

  // MEDIA vem depois
  if (medias.length > 0) {
    // Ordena conforme ordem específica
    for (const key of ordemMedia) {
      const flag = medias.find((f) => f.key === key);
      if (flag) return flag;
    }
    // Se não encontrou na ordem específica, retorna a primeira MEDIA
    return medias[0];
  }

  // BAIXA por último
  if (baixas.length > 0) {
    return baixas[0];
  }

  return null;
}

/**
 * Constrói decisão UX baseada no diagnóstico (PASSO I)
 * Conforme política oficial do PASSO H
 */
export function buildGcUxDecision(diagnostico: DiagnosticoPdf): GcUxDecision | null {
  // Extrai todas as flags ativas
  const flagsAtivas = extrairFlagsAtivas(diagnostico);

  // Se não houver flags ativas, não precisa de decisão
  if (flagsAtivas.length === 0) {
    // Se status for "ok" sem flags, tudo bem
    if (diagnostico.status === "ok") {
      return null;
    }
    // Caso contrário, verifica status
    if (diagnostico.status === "pdf_escaneado" || diagnostico.status === "erro_extracao") {
      const statusFlag = STATUS_MAP[diagnostico.status];
      return {
        severity: statusFlag.severity,
        mode: "BLOCK",
        title: statusFlag.title,
        message: "Não deu para extrair o Anexo II com segurança.\n\n" + statusFlag.message,
        primary: { label: "Enviar outro PDF", action: statusFlag.primaryAction },
        secondary: { label: "Tentar novamente", action: statusFlag.secondaryAction },
        key: statusFlag.key, // PASSO W.1: Key do status para telemetria
      };
    }
    return null;
  }

  // Seleciona motivo principal (conforme H3)
  const motivoPrincipal = selecionarMotivoPrincipal(flagsAtivas);
  
  // PASSO R: Caso OK_COM_ALERTAS (status "ok" com flags MÉDIA/BAIXA, sem motivo principal específico)
  if (!motivoPrincipal && diagnostico.status === "ok") {
    // Verifica se há flags MÉDIA ou BAIXA (sem ALTA)
    const temMediaOuBaixa = flagsAtivas.some((f) => f.severity === "MEDIA" || f.severity === "BAIXA");
    const temAlta = flagsAtivas.some((f) => f.severity === "ALTA");
    
    if (temMediaOuBaixa && !temAlta) {
      // Retorna decisão OK_COM_ALERTAS (conforme H4/H5)
      return {
        severity: "MEDIA",
        mode: "CONFIRM",
        title: "Posso continuar, mas com risco",
        message: "Posso continuar, mas o resultado pode ficar incompleto.\n\nPosso continuar a extração, porém existem alertas que podem afetar a qualidade do resultado.",
        primary: { label: "Continuar mesmo assim", action: "CONTINUE" },
        secondary: { label: "Trocar PDF", action: "UPLOAD_OTHER" },
        key: "OK_COM_ALERTAS", // PASSO W.1: Key para telemetria
      };
    }
  }
  
  if (!motivoPrincipal) return null;

  // Separa outras flags do mesmo nível (para "Outros alertas")
  const outrasFlags = flagsAtivas.filter((f) => f !== motivoPrincipal && f.severity === motivoPrincipal.severity);
  const otherAlerts = outrasFlags.slice(0, 2).map((f) => ({
    title: f.title,
    message: f.message,
  }));

  // Determina mode baseado em severity
  let mode: "BLOCK" | "CONFIRM" | "INFO";
  if (motivoPrincipal.severity === "ALTA") {
    mode = "BLOCK";
  } else if (motivoPrincipal.severity === "MEDIA") {
    mode = "CONFIRM";
  } else {
    mode = "INFO";
  }

  // Constrói mensagem conforme padrão H5
  let messageFinal: string;
  if (mode === "BLOCK") {
    messageFinal = "Não deu para extrair o Anexo II com segurança.\n\n" + motivoPrincipal.message;
  } else if (mode === "CONFIRM") {
    messageFinal = "Posso continuar, mas o resultado pode ficar incompleto.\n\n" + motivoPrincipal.message;
  } else {
    messageFinal = motivoPrincipal.message;
  }

  // Mapeia ações para labels
  const actionLabels: Record<GcUxAction, string> = {
    UPLOAD_OTHER: "Enviar outro PDF",
    RETRY: "Tentar novamente",
    CONTINUE: mode === "INFO" ? "Entendi" : "Continuar mesmo assim",
  };

  const decision: GcUxDecision = {
    severity: motivoPrincipal.severity,
    mode,
    title: motivoPrincipal.title,
    message: messageFinal,
    primary: {
      label: actionLabels[motivoPrincipal.primaryAction],
      action: motivoPrincipal.primaryAction,
    },
    key: motivoPrincipal.key, // PASSO W.1: Key do motivo principal para telemetria
  };

  // Adiciona secondary apenas se não for INFO
  if (mode !== "INFO" && motivoPrincipal.secondaryAction) {
    decision.secondary = {
      label: actionLabels[motivoPrincipal.secondaryAction],
      action: motivoPrincipal.secondaryAction,
    };
  }

  // Adiciona outros alertas apenas se houver e não for INFO
  if (mode !== "INFO" && otherAlerts.length > 0) {
    decision.otherAlerts = otherAlerts;
  }

  return decision;
}

