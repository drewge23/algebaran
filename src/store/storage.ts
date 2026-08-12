import { createJSONStorage } from 'zustand/middleware';

/**
 * Shared persistence backend for all stores. `localStorage` is synchronous, so
 * rehydration finishes before first paint and no loading gate is needed — the
 * app opens straight onto saved progress.
 */
export const persistStorage = createJSONStorage(() => localStorage);
