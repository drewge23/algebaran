/**
 * Quest definitions. A quest watches one counter (a `QuestMetric`) and completes
 * when it reaches `target`. Metrics are incremented by `useQuestStore.track`
 * from wherever the event actually happens, so nothing polls.
 */
export type QuestMetric =
  | 'lessonsCompleted'
  | 'piEarned'
  | 'duelsWon'
  | 'duelsPlayed'
  | 'clockRounds'
  | 'clockCorrect'
  | 'graphRounds'
  | 'perfectLessons'
  | 'projectSteps';

export interface QuestDef {
  id: string;
  metric: QuestMetric;
  target: number;
  /** π paid out when claimed. */
  reward: number;
  /** i18n key under `quests.defs`. */
  labelKey: string;
}

/** Pool for daily quests — each should be achievable in one sitting. */
export const DAILY_POOL: QuestDef[] = [
  { id: 'd-lessons-1', metric: 'lessonsCompleted', target: 1, reward: 15, labelKey: 'lessons_1' },
  { id: 'd-lessons-2', metric: 'lessonsCompleted', target: 2, reward: 25, labelKey: 'lessons_2' },
  { id: 'd-pi-40', metric: 'piEarned', target: 40, reward: 15, labelKey: 'pi_40' },
  { id: 'd-pi-80', metric: 'piEarned', target: 80, reward: 25, labelKey: 'pi_80' },
  { id: 'd-clock-1', metric: 'clockRounds', target: 1, reward: 15, labelKey: 'clock_1' },
  {
    id: 'd-clock-correct-10',
    metric: 'clockCorrect',
    target: 10,
    reward: 25,
    labelKey: 'clock_correct_10',
  },
  { id: 'd-duel-1', metric: 'duelsPlayed', target: 1, reward: 15, labelKey: 'duel_played_1' },
  { id: 'd-duel-win-1', metric: 'duelsWon', target: 1, reward: 30, labelKey: 'duel_won_1' },
  { id: 'd-perfect-1', metric: 'perfectLessons', target: 1, reward: 25, labelKey: 'perfect_1' },
  { id: 'd-graph-5', metric: 'graphRounds', target: 5, reward: 25, labelKey: 'graph_5' },
];

/** Pool for monthly quests — bigger commitments, bigger payouts. */
export const MONTHLY_POOL: QuestDef[] = [
  { id: 'm-lessons-8', metric: 'lessonsCompleted', target: 8, reward: 120, labelKey: 'lessons_8' },
  { id: 'm-pi-600', metric: 'piEarned', target: 600, reward: 150, labelKey: 'pi_600' },
  { id: 'm-duel-win-10', metric: 'duelsWon', target: 10, reward: 200, labelKey: 'duel_won_10' },
  { id: 'm-clock-15', metric: 'clockRounds', target: 15, reward: 150, labelKey: 'clock_15' },
  { id: 'm-perfect-5', metric: 'perfectLessons', target: 5, reward: 180, labelKey: 'perfect_5' },
  { id: 'm-project-4', metric: 'projectSteps', target: 4, reward: 200, labelKey: 'project_4' },
  { id: 'm-graph-40', metric: 'graphRounds', target: 40, reward: 180, labelKey: 'graph_40' },
];

export const DAILY_COUNT = 3;
export const MONTHLY_COUNT = 2;
