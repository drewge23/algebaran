import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { persistStorage } from './storage';

/**
 * Remembers how deep into the curriculum the learner was.
 *
 * Opening the app should put you back where you left off, not at the world
 * selector — a student returning to the same section every day should not have
 * to re-navigate to it. Going *back* is the only thing that moves you up, and
 * doing so clears the deeper position so the restore does not fight the user.
 *
 * Only browse positions are remembered. A half-finished lesson or duel is
 * deliberately not restored: dropping someone into question three of a lesson
 * they do not remember starting would be disorienting.
 */
interface NavData {
  worldId: string | null;
  regionId: string | null;
}

interface NavActions {
  remember: (patch: Partial<NavData>) => void;
  clear: () => void;
}

export const useNavMemory = create<NavData & NavActions>()(
  persist(
    (set) => ({
      worldId: null,
      regionId: null,
      remember: (patch) => set(patch),
      clear: () => set({ worldId: null, regionId: null }),
    }),
    {
      name: 'algebaran-nav',
      version: 1,
      storage: persistStorage,
      partialize: (s): NavData => ({ worldId: s.worldId, regionId: s.regionId }),
    },
  ),
);

/** The deepest remembered route, or `null` to stay on the world selector. */
export function rememberedPath(state: NavData): string | null {
  if (state.regionId) return `/region/${state.regionId}`;
  if (state.worldId) return `/world/${state.worldId}`;
  return null;
}
