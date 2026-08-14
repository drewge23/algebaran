import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { getShopItem } from '@/content/shop';
import { streakTransition, todayISO } from '@/lib/date';
import { applyRatingDelta, STARTING_RATING, type DuelOutcome } from '@/lib/duel';
import { applyMultiplier, computeMultiplier, levelForXp } from '@/lib/economy';

import { persistStorage } from './storage';

export const DEFAULT_AVATAR_ID = 'starter-star';

interface PlayerData {
  /** Soft currency, displayed as π. */
  pi: number;
  /** Total experience points; level is derived from this. */
  xp: number;
  streakCount: number;
  /** ISO calendar date (`YYYY-MM-DD`) of the last day activity was recorded. */
  lastActiveISODate: string | null;
  /** Purchased avatars/collectables (consumables are not retained here). */
  ownedItemIds: string[];
  equippedAvatarId: string;
  /** Unlockable keyboard keys the player has earned/bought. */
  unlockedKeyIds: string[];
  /** Manual language override; `null` means "follow the browser". */
  language: string | null;
  /** Elo-style duel rating. */
  rating: number;
  duelWins: number;
  duelLosses: number;
}

interface PlayerActions {
  /** Awards `base` π after applying the income multiplier. Returns the amount granted. */
  earnPi: (base: number) => number;
  addPi: (amount: number) => void;
  /** Spends π if affordable; returns whether the spend succeeded. */
  spendPi: (amount: number) => boolean;
  addXp: (amount: number) => void;
  /** Records that the player was active (drives the daily streak). */
  registerActivity: (today?: string) => void;
  /** Buys a shop item if affordable and not already owned. */
  purchaseItem: (id: string) => boolean;
  equipAvatar: (id: string) => void;
  unlockKey: (id: string) => void;
  setLanguage: (lang: string) => void;
  /** Applies a duel result, returning the new rating. */
  applyDuelResult: (outcome: DuelOutcome, delta: number) => number;
  reset: () => void;
}

export type PlayerState = PlayerData & PlayerActions;

const INITIAL: PlayerData = {
  pi: 0,
  xp: 0,
  streakCount: 0,
  lastActiveISODate: null,
  ownedItemIds: [],
  equippedAvatarId: DEFAULT_AVATAR_ID,
  unlockedKeyIds: [],
  language: null,
  rating: STARTING_RATING,
  duelWins: 0,
  duelLosses: 0,
};

// --- Selectors (derive values from raw state) ---

/** Total π income multiplier from owned collectables/skins. */
export const selectMultiplier = (s: PlayerState): number =>
  computeMultiplier(s.ownedItemIds.map((id) => getShopItem(id)?.multiplier ?? 0));

/** Current level, derived from total XP. */
export const selectLevel = (s: PlayerState): number => levelForXp(s.xp);

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      ...INITIAL,

      earnPi: (base) => {
        const state = get();
        const awarded = applyMultiplier(base, selectMultiplier(state));
        set({ pi: state.pi + awarded });
        return awarded;
      },

      addPi: (amount) => set((s) => ({ pi: s.pi + amount })),

      spendPi: (amount) => {
        const { pi } = get();
        if (pi < amount) return false;
        set({ pi: pi - amount });
        return true;
      },

      addXp: (amount) => set((s) => ({ xp: s.xp + amount })),

      registerActivity: (today = todayISO()) => {
        const { lastActiveISODate, streakCount } = get();
        const transition = streakTransition(lastActiveISODate, today);
        if (transition === 'same') return;
        set({
          streakCount: transition === 'increment' ? streakCount + 1 : 1,
          lastActiveISODate: today,
        });
      },

      purchaseItem: (id) => {
        const item = getShopItem(id);
        if (!item) return false;
        const state = get();
        if (state.pi < item.cost) return false;
        if (item.kind !== 'consumable' && state.ownedItemIds.includes(id)) return false;
        set({
          pi: state.pi - item.cost,
          ownedItemIds:
            item.kind === 'consumable' ? state.ownedItemIds : [...state.ownedItemIds, id],
        });
        return true;
      },

      equipAvatar: (id) => set({ equippedAvatarId: id }),

      unlockKey: (id) =>
        set((s) =>
          s.unlockedKeyIds.includes(id) ? s : { unlockedKeyIds: [...s.unlockedKeyIds, id] },
        ),

      setLanguage: (lang) => set({ language: lang }),

      applyDuelResult: (outcome, delta) => {
        const next = applyRatingDelta(get().rating, delta);
        set((s) => ({
          rating: next,
          duelWins: outcome === 'win' ? s.duelWins + 1 : s.duelWins,
          duelLosses: outcome === 'loss' ? s.duelLosses + 1 : s.duelLosses,
        }));
        return next;
      },

      reset: () => set({ ...INITIAL }),
    }),
    {
      name: 'algebaran-player',
      version: 3,
      storage: persistStorage,
      partialize: (s): PlayerData => ({
        pi: s.pi,
        xp: s.xp,
        streakCount: s.streakCount,
        lastActiveISODate: s.lastActiveISODate,
        ownedItemIds: s.ownedItemIds,
        equippedAvatarId: s.equippedAvatarId,
        unlockedKeyIds: s.unlockedKeyIds,
        language: s.language,
        rating: s.rating,
        duelWins: s.duelWins,
        duelLosses: s.duelLosses,
      }),
      migrate: (persisted, version) => {
        if (!persisted || typeof persisted !== 'object') return persisted as PlayerData;
        const old = persisted as Record<string, unknown>;
        const next = { ...(persisted as object) } as PlayerData;
        // v1 (the Expo build) called the currency `stardust`.
        if (version < 2) {
          next.pi = typeof old.stardust === 'number' ? old.stardust : 0;
          next.language = null;
        }
        // v3 introduced duel ratings.
        if (version < 3) {
          next.rating = STARTING_RATING;
          next.duelWins = 0;
          next.duelLosses = 0;
        }
        return next;
      },
    },
  ),
);
