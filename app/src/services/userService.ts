// src/services/userService.ts
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Remove campos undefined de um objeto (Firestore não aceita undefined)
 * Mantém null (que é válido no Firestore)
 */
function removeUndefinedFields<T extends Record<string, any>>(obj: T): Partial<T> {
  const cleaned: Partial<T> = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key) && obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  }
  return cleaned;
}

export type UserPlan = "free" | "premium";

export type UserDoc = {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  plan: UserPlan;
  isTester?: boolean;
  premiumUntil?: Timestamp | null;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: "active" | "canceled" | "past_due" | "incomplete" | "trialing" | "unpaid" | "unknown";
  lastActivity?: Timestamp | null;
  editaisProcessados?: number;
  diasAtivos?: number;
  disciplinasVistas?: number;
  semanasCriadas?: number;
  cartasEstudadas?: number;
  historicoAtividade?: Array<{ date: string; count: number }>;
  // Gamificação
  pontos?: number;
  nivel?: number;
  medalhas?: string[];
  progressaoNivel?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type UserProfile = {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  plan: UserPlan;
  isTester?: boolean;
  premiumUntil: Date | null;
  subscriptionStatus: "active" | "canceled" | "past_due" | "incomplete" | "trialing" | "unpaid" | "unknown" | "free";
  lastActivity?: Date | null;
  editaisProcessados?: number;
  diasAtivos?: number;
  disciplinasVistas?: number;
  semanasCriadas?: number;
  cartasEstudadas?: number;
  historicoAtividade?: Array<{ date: string; count: number }>;
  // Gamificação
  pontos?: number;
  nivel?: number;
  medalhas?: string[];
  progressaoNivel?: number;
};

export type UserPlanInfo = {
  plan: UserPlan;
  isTester?: boolean;
  premiumUntil?: Date | null;
  subscriptionStatus?: "active" | "canceled" | "past_due" | "incomplete" | "trialing" | "unpaid" | "unknown";
};

/**
 * Cria um novo perfil de usuário no Firestore
 * @param uid - ID do usuário
 * @param email - Email do usuário
 * @returns Promise<void>
 */
export async function createUserProfile(uid: string, email: string): Promise<void> {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  // Se já existe, não sobrescreve
  if (userSnap.exists()) {
    console.log(`[GC/UserService] Perfil já existe para ${uid}`);
    return;
  }

  const newUserData: Omit<UserDoc, "createdAt" | "updatedAt"> & { createdAt: any; updatedAt: any } = {
    uid,
    email,
    plan: "free",
    isTester: false,
    premiumUntil: null,
    subscriptionStatus: undefined,
    editaisProcessados: 0,
    diasAtivos: 0,
    disciplinasVistas: 0,
    semanasCriadas: 0,
    cartasEstudadas: 0,
    historicoAtividade: [],
    pontos: 0,
    nivel: 1,
    medalhas: [],
    progressaoNivel: 0,
    lastActivity: serverTimestamp() as any,
    createdAt: serverTimestamp() as any,
    updatedAt: serverTimestamp() as any,
  };

  await setDoc(userRef, newUserData);
  console.log(`[GC/UserService] Perfil criado para ${uid}`);
}

/**
 * Busca o perfil completo do usuário no Firestore
 * @param uid - ID do usuário
 * @returns Promise<UserProfile | null>
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return null;
  }

  const data = userSnap.data() as UserDoc;
  
  // Converte Timestamp para Date
  const createdAt = data.createdAt instanceof Timestamp
    ? data.createdAt.toDate()
    : (data.createdAt as any)?.toDate?.() || new Date();

  const premiumUntil = data.premiumUntil
    ? (data.premiumUntil instanceof Timestamp
        ? data.premiumUntil.toDate()
        : (data.premiumUntil as any)?.toDate?.() || null)
    : null;

  const lastActivity = data.lastActivity
    ? (data.lastActivity instanceof Timestamp
        ? data.lastActivity.toDate()
        : (data.lastActivity as any)?.toDate?.() || null)
    : null;

  return {
    uid: data.uid,
    email: data.email || "",
    displayName: data.displayName,
    photoURL: data.photoURL,
    createdAt,
    plan: data.plan || "free",
    isTester: data.isTester || false,
    premiumUntil,
    subscriptionStatus: data.subscriptionStatus || "free",
    lastActivity,
    editaisProcessados: data.editaisProcessados || 0,
    diasAtivos: data.diasAtivos || 0,
    disciplinasVistas: data.disciplinasVistas || 0,
    semanasCriadas: data.semanasCriadas || 0,
    cartasEstudadas: data.cartasEstudadas || 0,
    historicoAtividade: data.historicoAtividade || [],
    pontos: data.pontos || 0,
    nivel: data.nivel || 1,
    medalhas: data.medalhas || [],
    progressaoNivel: data.progressaoNivel || 0,
  };
}

/**
 * Atualiza o perfil do usuário no Firestore
 * @param uid - ID do usuário
 * @param data - Dados parciais para atualizar
 * @returns Promise<void>
 */
export async function updateUserProfile(
  uid: string,
  data: Partial<{
    email: string;
    displayName: string;
    photoURL: string;
    plan: UserPlan;
    isTester: boolean;
    premiumUntil: Date | null;
    subscriptionStatus: "active" | "canceled" | "past_due" | "incomplete" | "trialing" | "unpaid" | "unknown";
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    lastActivity: Date | null;
    editaisProcessados: number;
    diasAtivos: number;
    disciplinasVistas: number;
    semanasCriadas: number;
    cartasEstudadas: number;
    historicoAtividade: Array<{ date: string; count: number }>;
    pontos: number;
    nivel: number;
    medalhas: string[];
    progressaoNivel: number;
  }>
): Promise<void> {
  const userRef = doc(db, "users", uid);
  const updateData: any = {
    updatedAt: serverTimestamp(),
  };

  // Converte Date para Timestamp quando necessário
  if (data.email !== undefined) updateData.email = data.email;
  if (data.displayName !== undefined) updateData.displayName = data.displayName;
  if (data.photoURL !== undefined) updateData.photoURL = data.photoURL;
  if (data.plan !== undefined) updateData.plan = data.plan;
  if (data.isTester !== undefined) updateData.isTester = data.isTester;
  if (data.premiumUntil !== undefined) {
    updateData.premiumUntil = data.premiumUntil ? Timestamp.fromDate(data.premiumUntil) : null;
  }
  if (data.subscriptionStatus !== undefined) updateData.subscriptionStatus = data.subscriptionStatus;
  if (data.stripeCustomerId !== undefined) updateData.stripeCustomerId = data.stripeCustomerId;
  if (data.stripeSubscriptionId !== undefined) updateData.stripeSubscriptionId = data.stripeSubscriptionId;
  if (data.lastActivity !== undefined) {
    updateData.lastActivity = data.lastActivity ? Timestamp.fromDate(data.lastActivity) : serverTimestamp();
  }
  if (data.editaisProcessados !== undefined) updateData.editaisProcessados = data.editaisProcessados;
  if (data.diasAtivos !== undefined) updateData.diasAtivos = data.diasAtivos;
  if (data.disciplinasVistas !== undefined) updateData.disciplinasVistas = data.disciplinasVistas;
  if (data.semanasCriadas !== undefined) updateData.semanasCriadas = data.semanasCriadas;
  if (data.cartasEstudadas !== undefined) updateData.cartasEstudadas = data.cartasEstudadas;
  if (data.historicoAtividade !== undefined) updateData.historicoAtividade = data.historicoAtividade;
  if (data.pontos !== undefined) updateData.pontos = data.pontos;
  if (data.nivel !== undefined) updateData.nivel = data.nivel;
  if (data.medalhas !== undefined) updateData.medalhas = data.medalhas;
  if (data.progressaoNivel !== undefined) updateData.progressaoNivel = data.progressaoNivel;

  // Remove campos undefined antes de enviar ao Firestore
  const cleaned = removeUndefinedFields(updateData);
  await setDoc(userRef, cleaned, { merge: true });
  console.log(`[GC/UserService] Perfil atualizado para ${uid}`, cleaned);
}

/**
 * Garante que o documento do usuário existe no Firestore
 */
export async function ensureUserDoc(uid: string, email?: string): Promise<void> {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    // Cria documento inicial com plano free
    const newUserData = {
      uid,
      email: email || null,
      plan: "free" as const,
      isTester: false,
      premiumUntil: null,
      editaisProcessados: 0,
      diasAtivos: 0,
      disciplinasVistas: 0,
      semanasCriadas: 0,
      cartasEstudadas: 0,
      historicoAtividade: [],
      pontos: 0,
      nivel: 1,
      medalhas: [],
      progressaoNivel: 0,
      lastActivity: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(userRef, newUserData);
  } else {
    // Atualiza email se fornecido e diferente
    const data = userSnap.data() as UserDoc;
    if (email && data.email !== email) {
      const updateData = {
        email,
        updatedAt: serverTimestamp(),
      };
      // Remove undefined antes de enviar (mesmo que não deva ter, garantimos)
      const cleaned = removeUndefinedFields(updateData);
      await setDoc(userRef, cleaned, { merge: true });
    }
  }
}

/**
 * Busca informações do plano do usuário
 */
export async function getUserPlan(uid: string): Promise<UserPlanInfo | null> {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return null;
  }

  const data = userSnap.data() as UserDoc;
  const premiumUntil = data.premiumUntil
    ? (data.premiumUntil instanceof Timestamp
        ? data.premiumUntil.toDate()
        : (data.premiumUntil as any).toDate?.() || null)
    : null;

  return {
    plan: data.plan || "free",
    isTester: data.isTester || false,
    premiumUntil,
    subscriptionStatus: data.subscriptionStatus || undefined,
  };
}

/**
 * Define o plano do usuário (DEV/admin manual por enquanto)
 */
export async function setUserPlan(
  uid: string,
  plan: UserPlan,
  premiumUntil?: Date | null
): Promise<void> {
  const userRef = doc(db, "users", uid);
  const updateData: any = {
    plan,
    updatedAt: serverTimestamp(),
  };

  if (plan === "premium" && premiumUntil) {
    updateData.premiumUntil = Timestamp.fromDate(premiumUntil);
  } else if (plan === "free") {
    updateData.premiumUntil = null;
  }

  // Remove campos undefined antes de enviar ao Firestore
  const cleaned = removeUndefinedFields(updateData);
  await setDoc(userRef, cleaned, { merge: true });
}

/**
 * Incrementa o contador de editais processados
 */
export async function incrementEditaisProcessados(uid: string): Promise<void> {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    // Se o documento não existe, cria com contador 1
    await setDoc(userRef, {
      uid,
      editaisProcessados: 1,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return;
  }

  const data = userSnap.data() as UserDoc;
  const currentCount = data.editaisProcessados || 0;

  await setDoc(userRef, {
    editaisProcessados: currentCount + 1,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/**
 * Incrementa o contador de disciplinas vistas
 */
export async function incrementDisciplinasVistas(uid: string): Promise<void> {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid,
      disciplinasVistas: 1,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return;
  }

  const data = userSnap.data() as UserDoc;
  const currentCount = data.disciplinasVistas || 0;  await setDoc(userRef, {
    disciplinasVistas: currentCount + 1,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}/**
 * Incrementa o contador de semanas criadas
 */
export async function incrementSemanasCriadas(uid: string): Promise<void> {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid,
      semanasCriadas: 1,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return;
  }

  const data = userSnap.data() as UserDoc;
  const currentCount = data.semanasCriadas || 0;  await setDoc(userRef, {
    semanasCriadas: currentCount + 1,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}/**
 * Atualiza o histórico de atividade (últimos 7 dias)
 */
export async function updateHistoricoAtividade(uid: string): Promise<void> {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return;
  }

  const data = userSnap.data() as UserDoc;
  const historico = data.historicoAtividade || [];
  
  // Data de hoje no formato YYYY-MM-DD
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const hojeStr = hoje.toISOString().split('T')[0];

  // Encontra ou cria entrada para hoje
  let historicoAtualizado = [...historico];
  const indexHoje = historicoAtualizado.findIndex(h => h.date === hojeStr);
  
  if (indexHoje >= 0) {
    historicoAtualizado[indexHoje] = {
      date: hojeStr,
      count: historicoAtualizado[indexHoje].count + 1,
    };
  } else {
    historicoAtualizado.push({ date: hojeStr, count: 1 });
  }  // Mantém apenas últimos 7 dias
  const seteDiasAtras = new Date(hoje);
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
  
  historicoAtualizado = historicoAtualizado.filter(h => {
    const dataEntrada = new Date(h.date);
    return dataEntrada >= seteDiasAtras;
  });

  // Ordena por data
  historicoAtualizado.sort((a, b) => a.date.localeCompare(b.date));

  await setDoc(userRef, {
    historicoAtividade: historicoAtualizado,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/**
 * Calcula e atualiza dias ativos (streak)
 */
export async function updateDiasAtivos(uid: string, lastActivity: Date, createdAt: Date): Promise<void> {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return;
  }

  const data = userSnap.data() as UserDoc;
  const diasAtivosAtual = data.diasAtivos || 0;  // Calcula diferença em dias entre createdAt e lastActivity
  const diffTime = lastActivity.getTime() - createdAt.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Se a diferença for maior que o contador atual, atualiza
  if (diffDays > diasAtivosAtual) {
    await setDoc(userRef, {
      diasAtivos: diffDays,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }
}

/**
 * Calcula o nível baseado nos pontos
 * Nível 1: 0-99 pontos
 * Nível 2: 100-249 pontos
 * Nível 3: 250-499 pontos
 * Nível 4: 500-999 pontos
 * Nível 5: 1000+ pontos
 */
function calcularNivel(pontos: number): { nivel: number; progressaoNivel: number } {
  if (pontos < 100) {
    return { nivel: 1, progressaoNivel: Math.min(100, (pontos / 100) * 100) };
  } else if (pontos < 250) {
    const progresso = ((pontos - 100) / 150) * 100;
    return { nivel: 2, progressaoNivel: Math.min(100, progresso) };
  } else if (pontos < 500) {
    const progresso = ((pontos - 250) / 250) * 100;
    return { nivel: 3, progressaoNivel: Math.min(100, progresso) };
  } else if (pontos < 1000) {
    const progresso = ((pontos - 500) / 500) * 100;
    return { nivel: 4, progressaoNivel: Math.min(100, progresso) };
  } else {
    return { nivel: 5, progressaoNivel: 100 };
  }
}/**
 * Adiciona pontos ao usuário e atualiza nível automaticamente
 */
export async function addPontos(uid: string, quantidade: number): Promise<void> {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    console.warn(`[GC/Gamificacao] Usuário ${uid} não encontrado ao adicionar pontos`);
    return;
  }

  const data = userSnap.data() as UserDoc;
  const pontosAtuais = data.pontos || 0;
  const novosPontos = pontosAtuais + quantidade;

  // Calcula novo nível e progressão
  const { nivel, progressaoNivel } = calcularNivel(novosPontos);  await setDoc(userRef, {
    pontos: novosPontos,
    nivel: nivel,
    progressaoNivel: progressaoNivel,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  console.log(`[GC/Gamificacao] ${quantidade} pontos adicionados para ${uid}. Total: ${novosPontos}, Nível: ${nivel}`);
}

/**
 * Atualiza o nível do usuário baseado nos pontos atuais
 */
export async function updateNivel(uid: string): Promise<void> {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return;
  }

  const data = userSnap.data() as UserDoc;
  const pontos = data.pontos || 0;
  const { nivel, progressaoNivel } = calcularNivel(pontos);

  await setDoc(userRef, {
    nivel: nivel,
    progressaoNivel: progressaoNivel,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/**
 * Adiciona uma medalha ao usuário (se ainda não tiver)
 */
export async function addMedalha(uid: string, medalhaId: string): Promise<boolean> {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    console.warn(`[GC/Gamificacao] Usuário ${uid} não encontrado ao adicionar medalha`);
    return false;
  }

  const data = userSnap.data() as UserDoc;
  const medalhasAtuais = data.medalhas || [];  // Se já tem a medalha, não adiciona novamente
  if (medalhasAtuais.includes(medalhaId)) {
    return false;
  }

  const novasMedalhas = [...medalhasAtuais, medalhaId];

  await setDoc(userRef, {
    medalhas: novasMedalhas,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  console.log(`[GC/Gamificacao] Medalha "${medalhaId}" adicionada para ${uid}`);
  return true;
}

/**
 * Busca informações de recompensas do usuário
 */
export async function getRecompensas(uid: string): Promise<{
  pontos: number;
  nivel: number;
  progressaoNivel: number;
  medalhas: string[];
} | null> {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return null;
  }  const data = userSnap.data() as UserDoc;
  return {
    pontos: data.pontos || 0,
    nivel: data.nivel || 1,
    progressaoNivel: data.progressaoNivel || 0,
    medalhas: data.medalhas || [],
  };
}

/**
 * Incrementa o contador de cartas estudadas
 */
export async function incrementCartasEstudadas(uid: string): Promise<void> {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid,
      cartasEstudadas: 1,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return;
  }  const data = userSnap.data() as UserDoc;
  const currentCount = data.cartasEstudadas || 0;

  await setDoc(userRef, {
    cartasEstudadas: currentCount + 1,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/**
 * Busca status Premium completo do usuário
 * Retorna informações detalhadas sobre o status Premium
 */
export async function getPremiumStatus(uid: string): Promise<{
  isPremium: boolean;
  plan: UserPlan;
  isTester: boolean;
  subscriptionStatus?: "active" | "canceled" | "past_due" | "incomplete" | "trialing" | "unpaid" | "unknown";
  premiumUntil: Date | null;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
} | null> {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return null;
  }

  const data = userSnap.data() as UserDoc;
  const premiumUntil = data.premiumUntil
    ? (data.premiumUntil instanceof Timestamp
        ? data.premiumUntil.toDate()
        : (data.premiumUntil as any).toDate?.() || null)
    : null;

  const subscriptionStatus = data.subscriptionStatus;
  const plan = data.plan || "free";
  const isTester = data.isTester || false;

  // Calcula isPremium: subscriptionStatus === 'active' OU premiumUntil > now
  const now = new Date();
  let isPremium = false;

  if (isTester) {
    isPremium = true;
  } else if (subscriptionStatus === "active") {
    isPremium = true;
  } else if (premiumUntil) {
    const premiumDate = premiumUntil instanceof Date ? premiumUntil : new Date(premiumUntil);
    if (!isNaN(premiumDate.getTime()) && premiumDate > now) {
      isPremium = true;
    }
  }

  return {
    isPremium,
    plan,
    isTester,
    subscriptionStatus,
    premiumUntil,
    stripeCustomerId: data.stripeCustomerId,
    stripeSubscriptionId: data.stripeSubscriptionId,
  };
}

/**
 * Verifica se o usuário é Premium
 * Retorna true somente quando:
 * - subscriptionStatus === 'active' OU
 * - premiumUntil existe e é maior que a data atual
 */
export async function isPremium(uid: string): Promise<boolean> {
  const status = await getPremiumStatus(uid);
  return status?.isPremium || false;
}
