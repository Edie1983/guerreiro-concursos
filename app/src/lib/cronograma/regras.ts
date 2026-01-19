// src/lib/cronograma/regras.ts
// Regras determinísticas do Motor de Cronograma

import type { CronogramaConfig } from "./types";
import type { MapaTatico } from "../mapaTatico/gerarMapaTatico";

/**
 * Calcula total de minutos disponíveis por semana
 */
export function calcularTotalMinutosSemana(config: CronogramaConfig): number {
  const minutosPorDia = config.horasPorDia * 60;
  const diasAtivos = config.diasSemanaAtivos.length;
  return minutosPorDia * diasAtivos;
}

/**
 * Aplica piso mínimo de blocos por disciplina por semana
 * Garante que cada disciplina tenha pelo menos `pisoBlocos` blocos por semana (se couber)
 */
export function aplicarPisoMinimoPorDisciplina(
  mapa: MapaTatico,
  minutosSemana: number,
  pisoBlocos: number = 1
): Map<string, number> {
  const minutosPorBloco = 25; // Base de arredondamento
  const minutosPiso = pisoBlocos * minutosPorBloco;
  const totalMinutosPiso = mapa.totalDisciplinas * minutosPiso;

  // Se o piso total exceder os minutos disponíveis, não aplica piso
  if (totalMinutosPiso > minutosSemana) {
    return new Map();
  }

  // Distribui piso mínimo para cada disciplina
  const minutosPorDisciplina = new Map<string, number>();
  mapa.disciplinas.forEach((disciplina) => {
    minutosPorDisciplina.set(disciplina.nome, minutosPiso);
  });

  return minutosPorDisciplina;
}

/**
 * Arredonda duração para múltiplo de base (25 ou 30 minutos)
 * Usa base 25 como padrão (Pomodoro-friendly)
 */
export function arredondarDuracao(min: number, base: number = 25): number {
  if (min <= 0) return base;
  return Math.max(base, Math.round(min / base) * base);
}

