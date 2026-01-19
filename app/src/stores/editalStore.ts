// src/stores/editalStore.ts
import { create } from "zustand";
import type { EditalProcessado } from "../mocks/processarEditalMock";
import {
  createEdital,
  listEditais,
  getEditalById as getEditalByIdService,
  updateEdital as updateEditalService,
  deleteEdital as deleteEditalService,
} from "../services/editalService";
import { incrementEditaisProcessados } from "../services/userService";
import { triggerEditalProcessado } from "../services/gamificacaoService";
import { gerarFlashcardsParaEdital } from "../services/flashcardService";
import { auth } from "../services/firebase";
import { Timestamp } from "firebase/firestore";

type PendingUpload = {
  file: File;
  fileName: string;
  startedAtISO: string;
};

type EditalState = {
  editais: Record<string, EditalProcessado>;
  ultimoEditalId: string | null;
  pendingUpload: PendingUpload | null;
  loading: boolean;
  error: string | null;

  // Upload pendente
  setPendingUpload: (file: File) => void;
  clearPendingUpload: () => void;

  // CRUD Firestore
  loadEditais: (userId: string) => Promise<void>;
  salvarEdital: (edital: EditalProcessado) => void;
  salvarEditalProcessado: (edital: EditalProcessado) => Promise<string>;
  getEditalById: (id: string) => EditalProcessado | null;
  getEditalByIdAsync: (userId: string, id: string) => Promise<EditalProcessado | null>;
  updateEdital: (userId: string, id: string, patch: Partial<EditalProcessado>) => Promise<void>;
  deleteEdital: (userId: string, id: string) => Promise<void>;

  // Cache local (para compatibilidade)
  _setEditalLocal: (edital: EditalProcessado) => void;
};

/**
 * Converte EditalFirestore para EditalProcessado
 */
function firestoreToEditalProcessado(
  firestoreData: any,
  id: string
): EditalProcessado {
  const { userId, fileName, createdAt, updatedAt, ...resto } = firestoreData;

  // Converte Timestamp para ISO string
  let criadoEmISO = new Date().toISOString();
  if (createdAt) {
    if (createdAt instanceof Timestamp) {
      criadoEmISO = createdAt.toDate().toISOString();
    } else if (createdAt?.toDate) {
      criadoEmISO = createdAt.toDate().toISOString();
    }
  }

  return {
    ...resto,
    id,
    criadoEmISO,
    // textoBruto não é salvo no Firestore, então adiciona string vazia
    textoBruto: "",
  };
}

export const useEditalStore = create<EditalState>((set, get) => ({
  pendingUpload: null,
  editais: {},
  ultimoEditalId: null,
  loading: false,
  error: null,

  setPendingUpload: (file) =>
    set({
      pendingUpload: {
        file,
        fileName: file.name || "edital.pdf",
        startedAtISO: new Date().toISOString(),
      },
    }),

  clearPendingUpload: () => set({ pendingUpload: null }),

  salvarEdital: (edital) =>
    set((state) => ({
      editais: { ...state.editais, [edital.id]: edital },
      ultimoEditalId: edital.id,
    })),

  salvarEditalProcessado: async (edital: EditalProcessado): Promise<string> => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Usuário não autenticado");
    }

    set({ loading: true, error: null });

    try {
      // Remove id, criadoEmISO e textoBruto do payload (textoBruto não é salvo no Firestore)
      const { id: _id, criadoEmISO: _criadoEmISO, textoBruto: _textoBruto, ...data } = edital;

      const firestoreId = await createEdital({
        userId: user.uid,
        data,
        fileName: edital.titulo || "edital.pdf",
      });

      // Incrementa contador de editais processados
      try {
        await incrementEditaisProcessados(user.uid);
        // Trigger: Edital processado (pontos + medalhas)
        await triggerEditalProcessado(user.uid);
      } catch (error) {
        console.error("[GC/EditalStore] Erro ao incrementar contador de editais:", error);
        // Não falha o processo se o contador não atualizar
      }

      // Gera flashcards automaticamente a partir do edital processado
      try {
        await gerarFlashcardsParaEdital(user.uid, edital);
      } catch (error) {
        console.error("[GC/EditalStore] Erro ao gerar flashcards:", error);
        // Não falha o processo se os flashcards não forem gerados
      }

      // Atualiza cache local com o ID do Firestore
      const editalComId: EditalProcessado = {
        ...edital,
        id: firestoreId,
      };

      set((state) => ({
        editais: { ...state.editais, [firestoreId]: editalComId },
        ultimoEditalId: firestoreId,
        loading: false,
      }));

      return firestoreId;
    } catch (error: any) {
      set({ loading: false, error: error?.message || "Erro ao salvar edital" });
      throw error;
    }
  },

  getEditalById: (id: string) => {
    const e = get().editais[id];
    return e ?? null;
  },

  getEditalByIdAsync: async (userId: string, id: string): Promise<EditalProcessado | null> => {
    // Tenta cache local primeiro
    const cached = get().editais[id];
    if (cached) {
      return cached;
    }

    set({ loading: true, error: null });

    try {
      const firestoreData = await getEditalByIdService(userId, id);
      if (!firestoreData) {
        set({ loading: false });
        return null;
      }

      const edital = firestoreToEditalProcessado(firestoreData, id);

      // Atualiza cache
      set((state) => ({
        editais: { ...state.editais, [id]: edital },
        loading: false,
      }));

      return edital;
    } catch (error: any) {
      set({ loading: false, error: error?.message || "Erro ao buscar edital" });
      return null;
    }
  },

  loadEditais: async (userId: string) => {
    set({ loading: true, error: null });

    try {
      const firestoreEditais = await listEditais(userId);

      const editaisMap: Record<string, EditalProcessado> = {};
      for (const firestoreData of firestoreEditais) {
        const edital = firestoreToEditalProcessado(firestoreData, firestoreData.id);
        editaisMap[edital.id] = edital;
      }

      set({
        editais: editaisMap,
        loading: false,
      });
    } catch (error: any) {
      set({ loading: false, error: error?.message || "Erro ao carregar editais" });
    }
  },

  updateEdital: async (
    userId: string,
    id: string,
    patch: Partial<EditalProcessado>
  ): Promise<void> => {
    set({ loading: true, error: null });

    try {
      // Remove campos que não devem ser atualizados no Firestore
      const { id: _id, criadoEmISO: _criadoEmISO, ...patchClean } = patch;

      await updateEditalService(userId, id, patchClean);

      // Atualiza cache local
      const editalAtual = get().editais[id];
      if (editalAtual) {
        set((state) => ({
          editais: {
            ...state.editais,
            [id]: { ...editalAtual, ...patch },
          },
          loading: false,
        }));
      } else {
        set({ loading: false });
      }
    } catch (error: any) {
      set({ loading: false, error: error?.message || "Erro ao atualizar edital" });
      throw error;
    }
  },

  deleteEdital: async (userId: string, id: string): Promise<void> => {
    set({ loading: true, error: null });

    try {
      await deleteEditalService(userId, id);

      // Remove do cache local
      set((state) => {
        const { [id]: _removed, ...restEditais } = state.editais;
        return {
          editais: restEditais,
          ultimoEditalId: state.ultimoEditalId === id ? null : state.ultimoEditalId,
          loading: false,
        };
      });
    } catch (error: any) {
      set({ loading: false, error: error?.message || "Erro ao deletar edital" });
      throw error;
    }
  },

  _setEditalLocal: (edital: EditalProcessado) => {
    set((state) => ({
      editais: { ...state.editais, [edital.id]: edital },
      ultimoEditalId: edital.id,
    }));
  },
}));
