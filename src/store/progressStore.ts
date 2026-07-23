import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { ORDERED_LESSONS } from '@/content/lessons';
import type { Lesson } from '@/types/content';

import { persistStorage } from './storage';

export type LessonStatus = 'locked' | 'available' | 'completed';

export interface LessonRecord {
  stars: number;
  bestTimeMs?: number;
}

interface ProgressData {
  completed: Record<string, LessonRecord>;
}

interface ProgressActions {
  completeLesson: (id: string, stars?: number, timeMs?: number) => void;
  reset: () => void;
}

export type ProgressState = ProgressData & ProgressActions;

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      completed: {},

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

      reset: () => set({ completed: {} }),
    }),
    {
      name: 'algebaran-progress',
      version: 1,
      storage: persistStorage,
      partialize: (s): ProgressData => ({ completed: s.completed }),
    },
  ),
);

// --- Selectors ---

export const selectCompletedCount = (s: ProgressState): number => Object.keys(s.completed).length;

/**
 * Unlock rule: a lesson is `completed` if recorded, `available` if it is the
 * first lesson or the previous lesson (in curriculum order) is completed,
 * otherwise `locked`.
 */
export function statusForLesson(
  completed: Record<string, LessonRecord>,
  lesson: Lesson,
): LessonStatus {
  if (completed[lesson.id]) return 'completed';
  const idx = ORDERED_LESSONS.findIndex((l) => l.id === lesson.id);
  if (idx <= 0) return 'available';
  const previous = ORDERED_LESSONS[idx - 1];
  return completed[previous.id] ? 'available' : 'locked';
}
