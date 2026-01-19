import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "./firebase";
import type { EditalProcessado } from "../mocks/processarEditalMock";
import { cleanFirestoreData } from "./firestoreClean";

// Tipo para edital no Firestore (sem textoBruto completo, mas com data completa)
export type EditalFirestore = Omit<EditalProcessado, "textoBruto" | "id" | "criadoEmISO"> & {
  id: string;
  userId: string;
  fileName?: string;
  createdAt: Timestamp | any; // any para permitir serverTimestamp() na criação
  updatedAt: Timestamp | any;
};

// Tipo para criar edital (sem campos gerados pelo servidor)
export type EditalCreateInput = Omit<EditalProcessado, "textoBruto" | "id" | "criadoEmISO">;

/**
 * Cria um novo edital no Firestore
 */
export async function createEdital({
  userId,
  data,
  fileName,
}: {
  userId: string;
  data: EditalCreateInput;
  fileName?: string;
}): Promise<string> {
  // Limpa recursivamente todos os campos undefined antes de enviar ao Firestore
  const cleanedData = cleanFirestoreData(data);
  
  const editalData = {
    ...cleanedData,
    userId,
    fileName: fileName || data.titulo || "edital.pdf",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // Log temporário em DEV para inspecionar objeto antes de salvar
  if (typeof window !== "undefined" && import.meta.env.DEV) {
    console.log("[GC Firestore] Objeto antes de salvar:", JSON.stringify(editalData, null, 2));
    
    // Verifica se ainda há undefined no objeto
    const hasUndefined = JSON.stringify(editalData).includes("undefined");
    if (hasUndefined) {
      console.error("[GC Firestore] ⚠️ AINDA EXISTE undefined no objeto após limpeza!");
    }
  }

  try {
    const docRef = await addDoc(collection(db, "editais"), editalData);
    return docRef.id;
  } catch (error: any) {
    // Log detalhado do erro em DEV
    if (typeof window !== "undefined" && import.meta.env.DEV) {
      console.error("[GC Firestore] Erro ao salvar edital:", {
        error: error.message,
        errorCode: error.code,
        dataEnviada: editalData,
      });
    }
    throw error;
  }
}

/**
 * Lista todos os editais do usuário, ordenados por data de criação (mais recente primeiro)
 */
export async function listEditais(userId: string): Promise<EditalFirestore[]> {
  const q = query(
    collection(db, "editais"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as EditalFirestore[];
}

/**
 * Busca um edital específico por ID (apenas se pertencer ao usuário)
 */
export async function getEditalById(
  userId: string,
  id: string
): Promise<EditalFirestore | null> {
  const docRef = doc(db, "editais", id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data() as EditalFirestore;
  // Validação de segurança: só retorna se pertencer ao usuário
  if (data.userId !== userId) {
    return null;
  }

  return {
    ...data,
    id: docSnap.id,
  };
}

/**
 * Atualiza campos de um edital (apenas se pertencer ao usuário)
 */
export async function updateEdital(
  userId: string,
  id: string,
  patch: Partial<Omit<EditalFirestore, "id" | "userId" | "createdAt">>
): Promise<void> {
  const docRef = doc(db, "editais", id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error("Edital não encontrado");
  }

  const data = docSnap.data() as EditalFirestore;
  if (data.userId !== userId) {
    throw new Error("Acesso negado: edital não pertence ao usuário");
  }

  // Limpa recursivamente todos os campos undefined antes de enviar ao Firestore
  const cleanedPatch = cleanFirestoreData(patch);
  
  // Log temporário em DEV para inspecionar patch antes de atualizar
  if (typeof window !== "undefined" && import.meta.env.DEV) {
    console.log("[GC Firestore] Patch antes de atualizar:", JSON.stringify(cleanedPatch, null, 2));
  }

  try {
    await updateDoc(docRef, {
      ...cleanedPatch,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    // Log detalhado do erro em DEV
    if (typeof window !== "undefined" && import.meta.env.DEV) {
      console.error("[GC Firestore] Erro ao atualizar edital:", {
        error: error.message,
        errorCode: error.code,
        patchEnviado: cleanedPatch,
      });
    }
    throw error;
  }
}

/**
 * Deleta um edital (apenas se pertencer ao usuário)
 */
export async function deleteEdital(userId: string, id: string): Promise<void> {
  const docRef = doc(db, "editais", id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error("Edital não encontrado");
  }

  const data = docSnap.data() as EditalFirestore;
  if (data.userId !== userId) {
    throw new Error("Acesso negado: edital não pertence ao usuário");
  }

  await deleteDoc(docRef);
}

/**
 * Upload de arquivo PDF para Storage (mantido para compatibilidade)
 */
export async function uploadEditalFile(file: File, userId: string): Promise<string> {
  const storageRef = ref(storage, `editais/${userId}/${Date.now()}_${file.name}`);
  const uploadResult = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(uploadResult.ref);
  return downloadURL;
}
