// src/services/iaService.ts
// Mocks de IA + Store (Zustand) para desenvolvimento local (sem backend)

import { create } from "zustand";

// Tipos leves (pra não te travar com TypeScript agora)
export type EstruturaEdital = {
  concurso?: string;
  orgao?: string;
  cargo?: string;
  disciplinas: Array<{
    id: string;
    nome: string;
    conteudos: Array<{
      id: string;
      titulo: string;
      descricao?: string;
      ordem?: number;
    }>;
  }>;
};

export type MapaTaticoItem = {
  id: string;
  disciplinaId: string;
  conteudoId: string;
  titulo: string;
  prioridade: "alta" | "media" | "baixa";
  peso: number; // 0-1
  horasSugeridas: number;
  status: "pendente" | "em_andamento" | "concluido";
};

export type Flashcard = {
  id: string;
  conteudoId: string;
  pergunta: string;
  resposta: string;
  nivel: 1 | 2 | 3;
};

export type Questao = {
  id: string;
  conteudoId: string;
  enunciado: string;
  alternativas: string[];
  gabarito: number; // índice da alternativa correta
};

export type EditalStatus = "PROCESSING" | "COMPLETED";

export type EditalResumo = {
  id: string;
  nome_concurso: string;
  progress: number; // 0-100
  status: EditalStatus;
  createdAt: number;
};

const uid = () => Math.random().toString(36).slice(2, 10);

// 1) Estrutura do edital (mock)
export const generateEditalStructureMock = (pdfText?: string): EstruturaEdital => {
  // (pdfText fica pra depois, quando você plugar extração real)
  return {
    concurso: "Concurso Exemplo",
    orgao: "Órgão Exemplo",
    cargo: "Cargo Exemplo",
    disciplinas: [
      {
        id: "disc-pt",
        nome: "Português",
        conteudos: [
          { id: "pt-1", titulo: "Interpretação de texto", descricao: "Leitura, inferência e coesão", ordem: 1 },
          { id: "pt-2", titulo: "Gramática essencial", descricao: "Classes, concordância e regência", ordem: 2 },
        ],
      },
      {
        id: "disc-rlm",
        nome: "RLM",
        conteudos: [
          { id: "rlm-1", titulo: "Proposições e conectivos", descricao: "Tabela-verdade e equivalências", ordem: 1 },
          { id: "rlm-2", titulo: "Conjuntos", descricao: "Operações e diagramas", ordem: 2 },
        ],
      },
      {
        id: "disc-dir",
        nome: "Direito Constitucional",
        conteudos: [
          { id: "dir-1", titulo: "Direitos e garantias", descricao: "Art. 5º e princípios", ordem: 1 },
          { id: "dir-2", titulo: "Organização do Estado", descricao: "União, estados e municípios", ordem: 2 },
        ],
      },
    ],
  };
};

// 2) Mapa tático (mock)
export const generateMapaMock = (estrutura: EstruturaEdital): MapaTaticoItem[] => {
  const items: MapaTaticoItem[] = [];

  estrutura.disciplinas.forEach((d) => {
    d.conteudos.forEach((c) => {
      const peso = Math.min(1, Math.max(0.2, Math.random())); // 0.2 a 1
      const horas = Math.round(1 + peso * 4); // 1 a 5

      const prioridade: MapaTaticoItem["prioridade"] =
        peso > 0.75 ? "alta" : peso > 0.45 ? "media" : "baixa";

      items.push({
        id: `map-${uid()}`,
        disciplinaId: d.id,
        conteudoId: c.id,
        titulo: c.titulo,
        prioridade,
        peso,
        horasSugeridas: horas,
        status: "pendente",
      });
    });
  });

  return items;
};

// 3) Flashcards (mock)
export const generateFlashcardsMock = (estrutura: EstruturaEdital): Flashcard[] => {
  const cards: Flashcard[] = [];

  estrutura.disciplinas.forEach((d) => {
    d.conteudos.forEach((c) => {
      cards.push({
        id: `fc-${uid()}`,
        conteudoId: c.id,
        pergunta: `Explique o conceito: ${c.titulo}`,
        resposta: `Resumo rápido e objetivo sobre "${c.titulo}". (mock)`,
        nivel: Math.ceil(Math.random() * 3) as 1 | 2 | 3,
      });

      cards.push({
        id: `fc-${uid()}`,
        conteudoId: c.id,
        pergunta: `Qual é o ponto-chave de ${c.titulo}?`,
        resposta: `Ponto-chave: definição + exemplo prático. (mock)`,
        nivel: Math.ceil(Math.random() * 3) as 1 | 2 | 3,
      });
    });
  });

  return cards;
};

// 4) Questões (mock)
export const generateQuestoesMock = (estrutura: EstruturaEdital): Questao[] => {
  const qs: Questao[] = [];

  estrutura.disciplinas.forEach((d) => {
    d.conteudos.forEach((c) => {
      const alternativas = [
        `Alternativa A (sobre ${c.titulo})`,
        `Alternativa B (sobre ${c.titulo})`,
        `Alternativa C (sobre ${c.titulo})`,
        `Alternativa D (sobre ${c.titulo})`,
      ];
      const gabarito = Math.floor(Math.random() * alternativas.length);

      qs.push({
        id: `q-${uid()}`,
        conteudoId: c.id,
        enunciado: `Questão (mock): sobre ${c.titulo}. Assinale a alternativa correta.`,
        alternativas,
        gabarito,
      });
    });
  });

  return qs;
};

// ---------------------------
// Store (Zustand) do app
// ---------------------------

type EditalStoreState = {
  editais: EditalResumo[];
  actions: {
    addEdital: (nomeConcurso: string) => EditalResumo;
    updateEdital: (id: string, patch: Partial<EditalResumo>) => void;
    removeEdital: (id: string) => void;
    markCompleted: (id: string) => void;
    seedDemo: () => void;
    clearAll: () => void;
  };
};

// Hook que sua Home importa: `useEditalStore(...)`
export const useEditalStore = create<EditalStoreState>((set, get) => ({
  editais: [
    {
      id: `ed-${uid()}`,
      nome_concurso: "TJ - Analista (Demo)",
      progress: 32,
      status: "PROCESSING",
      createdAt: Date.now() - 1000 * 60 * 60 * 5,
    },
    {
      id: `ed-${uid()}`,
      nome_concurso: "PM - Soldado (Demo)",
      progress: 78,
      status: "COMPLETED",
      createdAt: Date.now() - 1000 * 60 * 60 * 24,
    },
  ],

  actions: {
    addEdital: (nomeConcurso: string) => {
      const novo: EditalResumo = {
        id: `ed-${uid()}`,
        nome_concurso: nomeConcurso.trim(),
        progress: 0,
        status: "PROCESSING",
        createdAt: Date.now(),
      };

      set((state) => ({ editais: [novo, ...state.editais] }));
      return novo;
    },

    updateEdital: (id, patch) => {
      set((state) => ({
        editais: state.editais.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      }));
    },

    removeEdital: (id) => {
      set((state) => ({ editais: state.editais.filter((e) => e.id !== id) }));
    },

    markCompleted: (id) => {
      set((state) => ({
        editais: state.editais.map((e) =>
          e.id === id ? { ...e, status: "COMPLETED", progress: Math.max(e.progress, 100) } : e
        ),
      }));
    },

    seedDemo: () => {
      const demo: EditalResumo[] = [
        { id: `ed-${uid()}`, nome_concurso: "INSS - Técnico (Demo)", progress: 12, status: "PROCESSING", createdAt: Date.now() },
        { id: `ed-${uid()}`, nome_concurso: "PF - Agente (Demo)", progress: 55, status: "PROCESSING", createdAt: Date.now() - 1000 * 60 * 60 },
        { id: `ed-${uid()}`, nome_concurso: "PC - Investigador (Demo)", progress: 100, status: "COMPLETED", createdAt: Date.now() - 1000 * 60 * 60 * 2 },
      ];
      set({ editais: demo });
    },

    clearAll: () => set({ editais: [] }),
  },
}));
