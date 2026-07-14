// ============================================================
// FeedForge — Goal Manager
// ============================================================

import type { Goal, GoalMode } from '../shared/types';
import { GOAL_PRESETS } from '../shared/constants';
import { generateId } from '../shared/utils';
import { getGoals, saveGoals } from '../storage/chrome-storage';

// ─── CRUD ────────────────────────────────────────────────────

export async function getAllGoals(): Promise<Goal[]> {
  return getGoals();
}

export async function getActiveGoals(): Promise<Goal[]> {
  const goals = await getGoals();
  return goals.filter(g => g.isActive);
}

export async function createGoal(params: {
  name: string;
  description?: string;
  mode: GoalMode;
  weight: number;
  keywords: string[];
}): Promise<Goal> {
  const goals = await getGoals();

  const newGoal: Goal = {
    id: generateId(),
    name: params.name,
    description: params.description ?? '',
    mode: params.mode,
    weight: params.weight,
    keywords: params.keywords,
    isActive: true,
    createdAt: Date.now(),
  };

  goals.push(newGoal);
  await saveGoals(normalizeWeights(goals));
  return newGoal;
}

export async function updateGoal(
  id: string,
  updates: Partial<Omit<Goal, 'id' | 'createdAt'>>,
): Promise<Goal | null> {
  const goals = await getGoals();
  const index = goals.findIndex(g => g.id === id);
  if (index === -1) return null;

  goals[index] = { ...goals[index], ...updates };
  await saveGoals(normalizeWeights(goals));
  return goals[index];
}

export async function deleteGoal(id: string): Promise<void> {
  const goals = await getGoals();
  const filtered = goals.filter(g => g.id !== id);
  await saveGoals(normalizeWeights(filtered));
}

export async function toggleGoal(id: string): Promise<void> {
  const goals = await getGoals();
  const goal = goals.find(g => g.id === id);
  if (goal) {
    goal.isActive = !goal.isActive;
    await saveGoals(goals);
  }
}

// ─── Presets ─────────────────────────────────────────────────

export function getGoalPresets() {
  return GOAL_PRESETS;
}

export async function addGoalFromPreset(mode: GoalMode, weight = 50): Promise<Goal> {
  const preset = GOAL_PRESETS.find(p => p.mode === mode);
  if (!preset) throw new Error(`Unknown goal mode: ${mode}`);

  return createGoal({
    name: preset.name,
    description: preset.description,
    mode: preset.mode,
    weight,
    keywords: [...preset.keywords],
  });
}

// ─── Weight Normalization ────────────────────────────────────

/**
 * Normalize goal weights so active goals sum to 100.
 * Inactive goals keep their weights unchanged.
 */
export function normalizeWeights(goals: Goal[]): Goal[] {
  const active = goals.filter(g => g.isActive);
  const totalWeight = active.reduce((sum, g) => sum + g.weight, 0);

  if (totalWeight === 0 || active.length === 0) return goals;

  return goals.map(g => {
    if (!g.isActive) return g;
    return { ...g, weight: Math.round((g.weight / totalWeight) * 100) };
  });
}

/** Get normalized weights as a map of goalId → normalized weight (0–1) */
export function getWeightMap(goals: Goal[]): Map<string, number> {
  const active = goals.filter(g => g.isActive);
  const total = active.reduce((sum, g) => sum + g.weight, 0);
  const map = new Map<string, number>();
  for (const goal of active) {
    map.set(goal.id, total > 0 ? goal.weight / total : 0);
  }
  return map;
}
