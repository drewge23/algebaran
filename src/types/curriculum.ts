/**
 * Curriculum structure: Systems → Sections → Levels → (steps).
 *
 * The shape matters as much as the content. A learner should never meet a wall
 * of 130 levels; each screen shows exactly one layer, and lessons alternate
 * between teaching, guided practice, free practice, application and challenge so
 * the loop is learn → try → succeed → use → practise → discover → challenge.
 */

/** What a level asks of the learner — drives its icon and how it is gated. */
export type LevelKind =
  | 'learn' // new theory
  | 'practice' // no new theory, repetition
  | 'apply' // word problems and real situations
  | 'project' // multi-step mission
  | 'exam' // assessed, visually distinct
  | 'challenge' // hard / olympiad
  | 'game'; // mini-game reusing the same engine

/** Sections are grouped so bonus routes read as optional side-paths. */
export type SectionKind = 'core' | 'practice' | 'bonus' | 'apply' | 'hard' | 'olympiad' | 'exam';

export interface StarSystem {
  id: string;
  title: string;
  blurb: string;
  /** Large central illustration stand-in until system art exists. */
  glyph: string;
  order: number;
  /** Systems beyond the first are planned but not yet authored. */
  available: boolean;
  /** Shown on a locked system instead of progress. */
  unlockNote?: string;
}

export interface Section {
  id: string;
  systemId: string;
  title: string;
  blurb: string;
  glyph: string;
  kind: SectionKind;
  order: number;
}

export interface Level {
  id: string;
  sectionId: string;
  title: string;
  /** One line describing the task; shown under the title in the level list. */
  subtitle: string;
  order: number;
  kind: LevelKind;
  rewardPi: number;
  rewardXp: number;
}

/** Default payouts by level kind, so rewards stay consistent across 130 levels. */
export const REWARDS: Record<LevelKind, { pi: number; xp: number }> = {
  learn: { pi: 20, xp: 30 },
  practice: { pi: 15, xp: 25 },
  apply: { pi: 30, xp: 50 },
  project: { pi: 60, xp: 100 },
  exam: { pi: 80, xp: 150 },
  challenge: { pi: 50, xp: 90 },
  game: { pi: 25, xp: 40 },
};
