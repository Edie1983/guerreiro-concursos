// src/stores/useEditalStore.ts
import { create } from "zustand";

export type EditalStatus = "PENDING" | "PROCESSING" | "COMPLETED";

export type Edital = {
  id: string;
  nome_concurso: string;
  status: EditalStatus;
  progress: number; // 0-100
  createdAt: number;
};

type State = {
  editais: Edital[];
  actions: {
    addEdital: (nome_concurso: string) => Edital;
    updateEdital: (id: string, patch: Partial<Edital>) => void;
    removeEdital: (id: string) => void;
    seedIfEmpty: () => void;
  };
};

const uid = () => Math.random().toString(36).slice(2, 10);

export const useEditalStore = create<State>((set, get) => ({
  editais: [],

  actions: {
    addEdital: (nome_concurso: string) => {
      const novo: Edital = {
        id: uid(),
        nome_concurso,
        status: "PENDING",
        progress: 0,
        createdAt: Date.now(),
      };

      set((s) => ({ editais: [novo, ...s.editais] }));
      return novo;
    },

    updateEdital: (id, patch) => {
      set((s) => ({
        editais: s.editais.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      }));
    },

    removeEdital: (id) => {
      set((s) => ({ editais: s.editais.filter((e) => e.id !== id) }));
    },

    seedIfEmpty: () => {
      const { editais } = get();
      if (editais.length > 0) return;

      set({
        editais: [
          {
            id: uid(),
            nome_concurso: "TJ - Técnico Judiciário",
            status: "COMPLETED",
            progress: 72,
            createdAt: Date.now() - 86400000 * 5,
          },
          {
            id: uid(),
            nome_concurso: "Polícia Civil - Investigador",
            status: "PROCESSING",
            progress: 35,
            createdAt: Date.now() - 86400000 * 2,
          },
          {
            id: uid(),
            nome_concurso: "INSS - Técnico do Seguro Social",
            status: "PENDING",
            progress: 0,
            createdAt: Date.now() - 86400000 * 1,
          },
        ],
      });
    },
  },
}));
