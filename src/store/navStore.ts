import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { persistStorage } from './storage';

/**
 * Remembers how deep into the curriculum the learner was.
 *
 * Opening the app should put you back where you left off, not at the system
 * selector — a student returning to the same section every day should not have
 * to re-navigate to it. Going *back* is the only thing that moves you up, and
 * doing so clears the deeper position so the restore does not fight the user.
 *
 * Only browse positions are remembered. A half-finished lesson or duel is
 * deliberately not restored: dropping someone into question three of a lesson
 * they do not remember starting would be disorienting.
 */
interface NavData {
  systemId: string | null;
  planetId: string | null;
}

interface NavActions {
  remember: (patch: Partial<NavData>) => void;
  clear: () => void;
}

export const useNavMemory = create<NavData & NavActions>()(
  persist(
    (set) => ({
      systemId: null,
      planetId: null,
      remember: (patch) => set(patch),
      clear: () => set({ systemId: null, planetId: null }),
    }),
    {
      name: 'algebaran-nav',
      version: 1,
      storage: persistStorage,
      partialize: (s): NavData => ({ systemId: s.systemId, planetId: s.planetId }),
    },
  ),
);

/** The deepest remembered route, or `null` to stay on the system selector. */
export function rememberedPath(state: NavData): string | null {
  if (state.planetId) return `/planet/${state.planetId}`;
  if (state.systemId) return `/system/${state.systemId}`;
  return null;
}
