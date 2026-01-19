// src/services/flashcardService.ts
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type { EditalProcessado } from "../mocks/processarEditalMock";

export type DificuldadeFlashcard = "easy" | "medium" | "hard";

export type Flashcard = {
  id: string;
  userId: string;
  disciplina: string;
  topico: string;
  pergunta: string;
  resposta: string;
  dificuldade: DificuldadeFlashcard;
  proximaRevisao: Date;
  acertos: number;
  erros: number;
  createdAt: Date;
  updatedAt: Date;
};

export type FlashcardFirestore = {
  id: string;
  userId: string;
  disciplina: string;
  topico: string;
  pergunta: string;
  resposta: string;
  dificuldade: DificuldadeFlashcard;
  proximaRevisao: Timestamp;
  acertos: number;
  erros: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

/**
 * Gera flashcards automaticamente a partir de um edital processado
 * Extrai perguntas e respostas baseadas nas disciplinas e conteúdos
 */
export async function gerarFlashcardsParaEdital(
  userId: string,
  editalProcessado: EditalProcessado
): Promise<string[]> {
  const cardIds: string[] = [];

  // Itera sobre cada disciplina do edital
  for (const disciplina of editalProcessado.disciplinas || []) {
    const nomeDisciplina = disciplina.nome;
    
    // Itera sobre cada conteúdo/tópico da disciplina
    for (const conteudo of disciplina.conteudos || []) {
      // Gera perguntas baseadas no conteúdo
      const flashcards = gerarFlashcardsDoConteudo(nomeDisciplina, conteudo);
      
      // Salva cada flashcard no Firestore
      for (const card of flashcards) {
        const cardRef = await addDoc(collection(db, "flashcards", userId, "cards"), {
          userId,
          disciplina: nomeDisciplina,
          topico: card.topico,
          pergunta: card.pergunta,
          resposta: card.resposta,
          dificuldade: card.dificuldade,
          proximaRevisao: serverTimestamp(),
          acertos: 0,
          erros: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        cardIds.push(cardRef.id);
      }
    }
  }

  console.log(`[GC/Flashcards] ${cardIds.length} flashcards gerados para edital ${editalProcessado.id}`);
  return cardIds;
}

/**
 * Gera flashcards a partir de um conteúdo/tópico
 * Estratégia: cria perguntas baseadas em conceitos-chave do texto
 */
function gerarFlashcardsDoConteudo(
  disciplina: string,
  conteudo: string
): Array<{ topico: string; pergunta: string; resposta: string; dificuldade: DificuldadeFlashcard }> {
  const flashcards: Array<{ topico: string; pergunta: string; resposta: string; dificuldade: DificuldadeFlashcard }> = [];
  
  // Limpa e normaliza o conteúdo
  const textoLimpo = conteudo.trim();
  if (textoLimpo.length < 20) return flashcards; // Ignora conteúdos muito curtos

  // Extrai o tópico principal (primeiras palavras ou linha)
  const linhas = textoLimpo.split("\n").filter(l => l.trim().length > 0);
  const topico = linhas[0]?.trim().substring(0, 100) || textoLimpo.substring(0, 100);

  // Estratégia 1: Se o conteúdo tem estrutura de lista ou itens
  if (textoLimpo.includes(":") || textoLimpo.includes(";") || textoLimpo.includes("-")) {
    const partes = textoLimpo.split(/[:;]/).filter(p => p.trim().length > 10);
    if (partes.length >= 2) {
      // Primeira parte como pergunta, segunda como resposta
      flashcards.push({
        topico,
        pergunta: `O que é ${partes[0].trim().substring(0, 150)}?`,
        resposta: partes.slice(1).join(" ").trim().substring(0, 500),
        dificuldade: "medium",
      });
    }
  }

  // Estratégia 2: Pergunta direta sobre o conceito
  const conceitoPrincipal = topico.split(" ").slice(0, 5).join(" ");
  flashcards.push({
    topico,
    pergunta: `Explique: ${conceitoPrincipal}`,
    resposta: textoLimpo.substring(0, 500),
    dificuldade: "medium",
  });

  // Estratégia 3: Se contém termos técnicos, cria pergunta de definição
  const termosTecnicos = textoLimpo.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
  if (termosTecnicos && termosTecnicos.length > 0) {
    const termo = termosTecnicos[0];
    flashcards.push({
      topico,
      pergunta: `O que é ${termo}?`,
      resposta: textoLimpo.substring(0, 500),
      dificuldade: "easy",
    });
  }

  // Limita a 3 flashcards por conteúdo para evitar spam
  return flashcards.slice(0, 3);
}

/**
 * Lista flashcards por disciplina
 */
export async function listarFlashcardsPorDisciplina(
  userId: string,
  disciplina?: string
): Promise<Flashcard[]> {
  const cardsRef = collection(db, "flashcards", userId, "cards");
  let q;

  if (disciplina) {
    q = query(cardsRef, where("disciplina", "==", disciplina), orderBy("proximaRevisao", "asc"));
  } else {
    q = query(cardsRef, orderBy("proximaRevisao", "asc"));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data() as FlashcardFirestore;
    return {
      id: doc.id,
      userId: data.userId,
      disciplina: data.disciplina,
      topico: data.topico,
      pergunta: data.pergunta,
      resposta: data.resposta,
      dificuldade: data.dificuldade,
      proximaRevisao: data.proximaRevisao instanceof Timestamp
        ? data.proximaRevisao.toDate()
        : (data.proximaRevisao as any)?.toDate?.() || new Date(),
      acertos: data.acertos || 0,
      erros: data.erros || 0,
      createdAt: data.createdAt instanceof Timestamp
        ? data.createdAt.toDate()
        : (data.createdAt as any)?.toDate?.() || new Date(),
      updatedAt: data.updatedAt instanceof Timestamp
        ? data.updatedAt.toDate()
        : (data.updatedAt as any)?.toDate?.() || new Date(),
    };
  });
}

/**
 * Lista todas as disciplinas que têm flashcards
 */
export async function listarDisciplinasComFlashcards(userId: string): Promise<string[]> {
  const cardsRef = collection(db, "flashcards", userId, "cards");
  const snapshot = await getDocs(cardsRef);
  
  const disciplinasSet = new Set<string>();
  snapshot.docs.forEach((doc) => {
    const data = doc.data() as FlashcardFirestore;
    if (data.disciplina) {
      disciplinasSet.add(data.disciplina);
    }
  });
  
  return Array.from(disciplinasSet).sort();
}

/**
 * Busca flashcards para revisão (próxima revisão <= hoje)
 */
export async function buscarFlashcardsParaRevisao(
  userId: string,
  disciplina?: string,
  limite: number = 10
): Promise<Flashcard[]> {
  const cardsRef = collection(db, "flashcards", userId, "cards");
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const hojeTimestamp = Timestamp.fromDate(hoje);

  let q;
  if (disciplina) {
    q = query(
      cardsRef,
      where("disciplina", "==", disciplina),
      where("proximaRevisao", "<=", hojeTimestamp),
      orderBy("proximaRevisao", "asc")
    );
  } else {
    q = query(
      cardsRef,
      where("proximaRevisao", "<=", hojeTimestamp),
      orderBy("proximaRevisao", "asc")
    );
  }

  const snapshot = await getDocs(q);
  const cards = snapshot.docs
    .slice(0, limite)
    .map((doc) => {
      const data = doc.data() as FlashcardFirestore;
      return {
        id: doc.id,
        userId: data.userId,
        disciplina: data.disciplina,
        topico: data.topico,
        pergunta: data.pergunta,
        resposta: data.resposta,
        dificuldade: data.dificuldade,
        proximaRevisao: data.proximaRevisao instanceof Timestamp
          ? data.proximaRevisao.toDate()
          : (data.proximaRevisao as any)?.toDate?.() || new Date(),
        acertos: data.acertos || 0,
        erros: data.erros || 0,
        createdAt: data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : (data.createdAt as any)?.toDate?.() || new Date(),
        updatedAt: data.updatedAt instanceof Timestamp
          ? data.updatedAt.toDate()
          : (data.updatedAt as any)?.toDate?.() || new Date(),
      };
    });

  return cards;
}

/**
 * Registra resposta do usuário e atualiza o flashcard
 * qualidadeResposta: 0 = errei, 1 = acertei, 2 = fácil
 */
export async function registrarResposta(
  userId: string,
  cardId: string,
  qualidadeResposta: 0 | 1 | 2
): Promise<void> {
  const cardRef = doc(db, "flashcards", userId, "cards", cardId);
  const cardSnap = await getDoc(cardRef);

  if (!cardSnap.exists()) {
    throw new Error("Flashcard não encontrado");
  }

  const data = cardSnap.data() as FlashcardFirestore;
  const acertosAtuais = data.acertos || 0;
  const errosAtuais = data.erros || 0;

  // Atualiza contadores
  let novosAcertos = acertosAtuais;
  let novosErros = errosAtuais;

  if (qualidadeResposta === 0) {
    novosErros = errosAtuais + 1;
  } else {
    novosAcertos = acertosAtuais + 1;
  }

  // Calcula próxima revisão usando algoritmo SM-2 simplificado
  const proximaRevisao = calcularProximaRevisao(
    {
      id: cardId,
      userId: data.userId,
      disciplina: data.disciplina,
      topico: data.topico,
      pergunta: data.pergunta,
      resposta: data.resposta,
      dificuldade: data.dificuldade,
      proximaRevisao: data.proximaRevisao instanceof Timestamp
        ? data.proximaRevisao.toDate()
        : new Date(),
      acertos: acertosAtuais,
      erros: errosAtuais,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    qualidadeResposta
  );

  await updateDoc(cardRef, {
    acertos: novosAcertos,
    erros: novosErros,
    proximaRevisao: Timestamp.fromDate(proximaRevisao),
    updatedAt: serverTimestamp(),
  });

  console.log(`[GC/Flashcards] Resposta registrada para card ${cardId}: qualidade=${qualidadeResposta}`);
}

/**
 * Calcula próxima revisão usando algoritmo SM-2 simplificado
 * qualidadeResposta: 0 = errei, 1 = acertei, 2 = fácil
 */
export function calcularProximaRevisao(
  card: Flashcard,
  qualidadeResposta: 0 | 1 | 2
): Date {
  const agora = new Date();
  agora.setHours(0, 0, 0, 0);

  // Se errou, revisa amanhã
  if (qualidadeResposta === 0) {
    const amanha = new Date(agora);
    amanha.setDate(amanha.getDate() + 1);
    return amanha;
  }

  // Se acertou ou foi fácil, calcula intervalo baseado no histórico
  const totalRespostas = card.acertos + card.erros;
  
  // Primeira vez acertando: revisa em 1 dia
  if (totalRespostas === 0) {
    const amanha = new Date(agora);
    amanha.setDate(amanha.getDate() + 1);
    return amanha;
  }

  // Calcula intervalo baseado em acertos consecutivos
  const taxaAcerto = card.acertos / (totalRespostas || 1);
  let diasIntervalo = 1;

  if (qualidadeResposta === 2) {
    // Fácil: dobra o intervalo
    diasIntervalo = Math.max(1, Math.floor((card.acertos + 1) * 1.5));
  } else if (qualidadeResposta === 1) {
    // Acertou: aumenta progressivamente
    if (taxaAcerto >= 0.8 && card.acertos >= 3) {
      diasIntervalo = Math.max(2, Math.floor(card.acertos * 0.8));
    } else if (taxaAcerto >= 0.6) {
      diasIntervalo = 2;
    } else {
      diasIntervalo = 1;
    }
  }

  // Limita intervalo máximo a 30 dias
  diasIntervalo = Math.min(diasIntervalo, 30);

  const proximaRevisao = new Date(agora);
  proximaRevisao.setDate(proximaRevisao.getDate() + diasIntervalo);

  return proximaRevisao;
}

/**
 * Conta total de flashcards do usuário
 */
export async function contarFlashcards(userId: string): Promise<number> {
  const cardsRef = collection(db, "flashcards", userId, "cards");
  const snapshot = await getDocs(cardsRef);
  return snapshot.size;
}






