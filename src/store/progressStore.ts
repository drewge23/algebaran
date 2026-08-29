import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { ALL_MISSIONS } from '@/content/rocket';

import { spineOfSystem, systemIdOfLevel } from '@/content/curriculum';
import type { Level } from '@/types/curriculum';

import { persistStorage } from './storage';

export type LessonStatus = 'locked' | 'available' | 'completed';

export interface LessonRecord {
  stars: number;
  bestTimeMs?: number;
}

interface ProgressData {
  completed: Record<string, LessonRecord>;
  /** Kept apart from lessons so project runs never inflate the lesson count. */
  projects: Record<string, LessonRecord>;
}

interface ProgressActions {
  completeLesson: (id: string, stars?: number, timeMs?: number) => void;
  completeProject: (id: string, stars?: number) => void;
  reset: () => void;
}

export type ProgressState = ProgressData & ProgressActions;

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      completed: {},
      projects: {},

      completeProject: (id, stars = 3) =>
        set((s) => ({
          projects: {
            ...s.projects,
            [id]: { stars: Math.max(stars, s.projects[id]?.stars ?? 0) },
          },
        })),

      completeLesson: (id, stars = 1, timeMs) =>
        set((s) => {
          const prev = s.completed[id];
          const bestTimeMs =
            timeMs === undefined
              ? prev?.bestTimeMs
              : Math.min(timeMs, prev?.bestTimeMs ?? Infinity);
          return {
            completed: {
              ...s.completed,
              [id]: {
                stars: Math.max(stars, prev?.stars ?? 0),
                ...(bestTimeMs !== undefined && Number.isFinite(bestTimeMs) ? { bestTimeMs } : {}),
              },
            },
          };
        }),

      reset: () => set({ completed: {}, projects: {} }),
    }),
    {
      name: 'algebaran-progress',
      version: 2,
      storage: persistStorage,
      partialize: (s): ProgressData => ({ completed: s.completed, projects: s.projects }),
      migrate: (persisted, version) => {
        if (version < 2 && persisted && typeof persisted === 'object') {
          return { projects: {}, ...(persisted as object) } as ProgressData;
        }
        return persisted as ProgressData;
      },
    },
  ),
);

// --- Selectors ---

export const selectCompletedCount = (s: ProgressState): number => Object.keys(s.completed).length;

/**
 * Unlock rule: a level is `completed` if recorded, `available` if it is the
 * first level *of its system* or the previous one on that system's spine is done,
 * otherwise `locked`.
 *
 * Unlocking is per-system on purpose. Foundations is optional preparation, so
 * requiring it before the quadratics course would wall off the actual subject
 * behind ten levels of arithmetic.
 */
export function statusForLevel(
  completed: Record<string, LessonRecord>,
  level: Level,
): LessonStatus {
  if (completed[level.id]) return 'completed';
  const systemId = systemIdOfLevel(level);
  const spine = systemId ? spineOfSystem(systemId) : [];
  const idx = spine.findIndex((l) => l.id === level.id);
  if (idx <= 0) return 'available';
  return completed[spine[idx - 1].id] ? 'available' : 'locked';
}

/** The next unfinished level within a system. */
export function nextLevelInStarSystem(
  completed: Record<string, LessonRecord>,
  systemId: string,
): Level | undefined {
  return spineOfSystem(systemId).find((l) => !completed[l.id]);
}

/** Completed / total for a set of levels, for progress bars. */
export function tally(
  completed: Record<string, LessonRecord>,
  levels: Level[],
): { done: number; total: number } {
  return { done: levels.filter((l) => completed[l.id]).length, total: levels.length };
}

/**
 * Every mission of the workshop project finished. Lives here rather than in the
 * workshop screen because the achievements list needs it too.
 */
export const selectProjectComplete = (s: { projects: Record<string, LessonRecord> }) =>
  ALL_MISSIONS.length > 0 && ALL_MISSIONS.every((m) => Boolean(s.projects[m.id]));
