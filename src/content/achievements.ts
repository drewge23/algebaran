import type { Achievement } from '@/types/content';

/** Snapshot of player stats that achievement predicates are evaluated against. */
export interface AchievementStats {
  lessonsCompleted: number;
  streakCount: number;
  level: number;
  pi: number;
  /** True once every mission of the workshop project is finished. */
  projectComplete: boolean;
}

export interface AchievementDef extends Achievement {
  isUnlocked: (stats: AchievementStats) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Complete your first lesson.',
    glyph: '👣',
    isUnlocked: (s) => s.lessonsCompleted >= 1,
  },
  {
    id: 'on-fire',
    name: 'On Fire',
    description: 'Keep a 3-day streak.',
    glyph: '🔥',
    isUnlocked: (s) => s.streakCount >= 3,
  },
  {
    id: 'rising-star',
    name: 'Rising Star',
    description: 'Reach level 5.',
    glyph: '⭐',
    isUnlocked: (s) => s.level >= 5,
  },
  {
    id: 'stargazer',
    name: 'Stargazer',
    description: 'Complete 4 lessons.',
    glyph: '🔭',
    isUnlocked: (s) => s.lessonsCompleted >= 4,
  },
  {
    id: 'rich-as-a-star',
    name: 'Rich as a Star',
    description: 'Hold 500 π at once.',
    glyph: '💫',
    isUnlocked: (s) => s.pi >= 500,
  },
  {
    id: 'shipwright',
    name: 'Shipwright',
    description: 'Build REACH ALGEbaran and fly it home.',
    glyph: '🚀',
    isUnlocked: (s) => s.projectComplete,
  },
];
