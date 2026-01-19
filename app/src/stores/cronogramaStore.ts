// src/stores/cronogramaStore.ts
// Store separado para cronogramas (não mexe no editalStore)

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  CronogramaConfig,
  CronogramaGerado,
} from "../lib/cronograma/types";

type CronogramaState = {
  configs: Record<string, CronogramaConfig>; // editalId -> config
  cronogramas: Record<string, CronogramaGerado>; // editalId -> cronograma gerado

  setConfig: (editalId: string, config: CronogramaConfig) => void;
  getConfig: (editalId: string) => CronogramaConfig | null;
  setCronograma: (editalId: string, cronograma: CronogramaGerado) => void;
  getCronograma: (editalId: string) => CronogramaGerado | null;
  clearCronograma: (editalId: string) => void;
};

export const useCronogramaStore = create<CronogramaState>()(
  persist(
    (set, get) => ({
      configs: {},
      cronogramas: {},

      setConfig: (editalId, config) =>
        set((state) => ({
          configs: { ...state.configs, [editalId]: config },
        })),

      getConfig: (editalId) => {
        return get().configs[editalId] || null;
      },

      setCronograma: (editalId, cronograma) =>
        set((state) => ({
          cronogramas: { ...state.cronogramas, [editalId]: cronograma },
        })),

      getCronograma: (editalId) => {
        return get().cronogramas[editalId] || null;
      },

      clearCronograma: (editalId) =>
        set((state) => {
          const { [editalId]: _, ...restCronogramas } = state.cronogramas;
          return { cronogramas: restCronogramas };
        }),
    }),
    {
      name: "gc_cronograma_store_v1",
      version: 1,
      partialize: (state) => ({
        configs: state.configs,
        cronogramas: state.cronogramas,
      }),
    }
  )
);






