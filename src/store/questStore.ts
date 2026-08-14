import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  DAILY_COUNT,
  DAILY_POOL,
  MONTHLY_COUNT,
  MONTHLY_POOL,
  type QuestDef,
  type QuestMetric,
} from '@/content/quests';
import { monthKey, todayISO } from '@/lib/date';
import { pickDistinct, seededRandom } from '@/lib/random';

import { persistStorage } from './storage';

export interface ActiveQuest extends QuestDef {
  progress: number;
  claimed: boolean;
}

interface QuestData {
  /** ISO date the daily set was generated for. */
  dailyKey: string;
  daily: ActiveQuest[];
  /** `YYYY-MM` the monthly set was generated for. */
  monthlyKey: string;
  monthly: ActiveQuest[];
}

interface QuestActions {
  /** Regenerates whichever sets have rolled over. Safe to call on every mount. */
  refresh: (today?: string, month?: string) => void;
  /** Adds to a metric across all active quests. */
  track: (metric: QuestMetric, amount?: number) => void;
  /** Claims a finished quest, returning the π to pay out (0 if not claimable). */
  claim: (id: string) => number;
  reset: () => void;
}

export type QuestState = QuestData & QuestActions;

/**
 * Quests are drawn from the pools with the date as the seed, so the same day
 * always yields the same set — reopening the app must not reroll them.
 */
function generate(pool: QuestDef[], count: number, seed: string): ActiveQuest[] {
  const rng = seededRandom(seed);
  return pickDistinct(pool, count, rng).map((def) => ({ ...def, progress: 0, claimed: false }));
}

const EMPTY: QuestData = { dailyKey: '', daily: [], monthlyKey: '', monthly: [] };

export const useQuestStore = create<QuestState>()(
  persist(
    (set, get) => ({
      ...EMPTY,

      refresh: (today = todayISO(), month = monthKey()) => {
        const s = get();
        const patch: Partial<QuestData> = {};
        if (s.dailyKey !== today) {
          patch.dailyKey = today;
          patch.daily = generate(DAILY_POOL, DAILY_COUNT, `daily-${today}`);
        }
        if (s.monthlyKey !== month) {
          patch.monthlyKey = month;
          patch.monthly = generate(MONTHLY_POOL, MONTHLY_COUNT, `monthly-${month}`);
        }
        if (Object.keys(patch).length > 0) set(patch);
      },

      track: (metric, amount = 1) => {
        if (amount <= 0) return;
        const bump = (q: ActiveQuest) =>
          q.metric === metric && !q.claimed
            ? { ...q, progress: Math.min(q.target, q.progress + amount) }
            : q;
        set((s) => ({ daily: s.daily.map(bump), monthly: s.monthly.map(bump) }));
      },

      claim: (id) => {
        const s = get();
        const quest = [...s.daily, ...s.monthly].find((q) => q.id === id);
        if (!quest || quest.claimed || quest.progress < quest.target) return 0;
        const mark = (q: ActiveQuest) => (q.id === id ? { ...q, claimed: true } : q);
        set({ daily: s.daily.map(mark), monthly: s.monthly.map(mark) });
        return quest.reward;
      },

      reset: () => set({ ...EMPTY }),
    }),
    {
      name: 'algebaran-quests',
      version: 1,
      storage: persistStorage,
      partialize: (s): QuestData => ({
        dailyKey: s.dailyKey,
        daily: s.daily,
        monthlyKey: s.monthlyKey,
        monthly: s.monthly,
      }),
    },
  ),
);

/** Convenience for callers outside React (stores, event handlers). */
export const trackQuest = (metric: QuestMetric, amount = 1) =>
  useQuestStore.getState().track(metric, amount);

export const selectClaimable = (s: QuestState): number =>
  [...s.daily, ...s.monthly].filter((q) => !q.claimed && q.progress >= q.target).length;
