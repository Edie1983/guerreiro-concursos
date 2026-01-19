// src/services/gamificacaoService.ts
import { addPontos, addMedalha, updateNivel, getUserProfile } from "./userService";

/**
 * IDs das medalhas disponíveis
 */
export const MEDALHAS = {
  PRIMEIRO_EDITAL: "primeiro_edital",
  SETE_DIAS_ATIVO: "sete_dias_ativo",
  GUERREIRO_CONSTANTE: "guerreiro_constante",
  PREMIUM_PRIMEIRA_VEZ: "premium_primeira_vez",
  MAPA_DESBLOQUEADO: "mapa_desbloqueado",
  FLASHCARDS_INICIADOS: "flashcards_iniciados",
  FLASHCARDS_50_RESPOSTAS: "50_respostas",
  FLASHCARDS_100_RESPOSTAS: "100_respostas",
} as const;

/**
 * Concede pontos e verifica medalhas relacionadas
 */
export async function concederPontos(
  uid: string,
  quantidade: number,
  contexto?: { tipo: string; dados?: any }
): Promise<void> {
  await addPontos(uid, quantidade);
  await verificarMedalhas(uid, contexto);
}

/**
 * Verifica e concede medalhas automaticamente baseado no perfil do usuário
 */
export async function verificarMedalhas(
  uid: string,
  contexto?: { tipo: string; dados?: any }
): Promise<void> {
  const profile = await getUserProfile(uid);
  if (!profile) return;

  // Medalha: Primeiro Edital
  if (contexto?.tipo === "edital_processado" && profile.editaisProcessados === 1) {
    await addMedalha(uid, MEDALHAS.PRIMEIRO_EDITAL);
  }

  // Medalha: Sete Dias Ativo
  if (profile.diasAtivos && profile.diasAtivos >= 7) {
    await addMedalha(uid, MEDALHAS.SETE_DIAS_ATIVO);
  }

  // Medalha: Guerreiro Constante (streak de 3 dias)
  if (contexto?.tipo === "streak_3_dias") {
    await addMedalha(uid, MEDALHAS.GUERREIRO_CONSTANTE);
  }

  // Medalha: Premium Primeira Vez
  if (contexto?.tipo === "premium_ativado" && profile.plan === "premium") {
    await addMedalha(uid, MEDALHAS.PREMIUM_PRIMEIRA_VEZ);
  }

  // Medalha: Mapa Desbloqueado
  if (contexto?.tipo === "mapa_aberto") {
    await addMedalha(uid, MEDALHAS.MAPA_DESBLOQUEADO);
  }
}

/**
 * Trigger: Usuário abriu o app
 */
export async function triggerAbrirApp(uid: string): Promise<void> {
  await concederPontos(uid, 5, { tipo: "app_aberto" });
}

/**
 * Trigger: Edital processado
 */
export async function triggerEditalProcessado(uid: string): Promise<void> {
  await concederPontos(uid, 10, { tipo: "edital_processado" });
}

/**
 * Trigger: Mapa Tático aberto
 */
export async function triggerMapaTaticoAberto(uid: string): Promise<void> {
  await concederPontos(uid, 3, { tipo: "mapa_aberto" });
}

/**
 * Trigger: Cronograma aberto
 */
export async function triggerCronogramaAberto(uid: string): Promise<void> {
  await concederPontos(uid, 3, { tipo: "cronograma_aberto" });
}

/**
 * Trigger: Streak de 3 dias completado
 */
export async function triggerStreak3Dias(uid: string): Promise<void> {
  await concederPontos(uid, 20, { tipo: "streak_3_dias" });
}

/**
 * Trigger: Usuário virou Premium
 */
export async function triggerPremiumAtivado(uid: string): Promise<void> {
  await concederPontos(uid, 50, { tipo: "premium_ativado" });
}

