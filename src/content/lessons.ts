import type { Lesson, Section, SectionId } from '@/types/content';

/**
 * The quadratic-equations curriculum. This is a placeholder catalogue: the
 * sections and ordering are real, but the per-lesson problem content is authored
 * in a later phase. Titles are English-first; when we localise lesson content
 * they will move to a dedicated content-localisation pipeline (the UI chrome is
 * already routed through i18n).
 */

export const SECTIONS: Section[] = [
  { id: 'why', title: 'Why quadratics?', blurb: 'Where they hide in real life.', glyph: '🌍' },
  {
    id: 'problem-to-eq',
    title: 'Story → equation',
    blurb: 'Turn words into an equation.',
    glyph: '📖',
  },
  { id: 'coefficients', title: 'Coefficients', blurb: 'Spot a, b and c.', glyph: '🔤' },
  { id: 'no-b', title: 'No middle term', blurb: 'Solve ax² + c = 0.', glyph: '➗' },
  { id: 'no-c', title: 'No constant', blurb: 'Solve ax² + bx = 0.', glyph: '✖️' },
  { id: 'full', title: 'The full equation', blurb: 'ax² + bx + c = 0.', glyph: '🧮' },
  { id: 'vieta', title: "Vieta's formulas", blurb: 'Sum and product of roots.', glyph: '🧠' },
  { id: 'beat-the-clock', title: 'Beat the clock', blurb: 'Timed bonus round.', glyph: '⚡' },
];

export const LESSONS: Lesson[] = [
  {
    id: 'why-intro',
    sectionId: 'why',
    title: 'Parabolas everywhere',
    order: 1,
    kind: 'concept',
    rewardPi: 20,
    rewardXp: 30,
  },
  {
    id: 'problem-basics',
    sectionId: 'problem-to-eq',
    title: 'From a story to symbols',
    order: 2,
    kind: 'input-equation',
    rewardPi: 25,
    rewardXp: 40,
  },
  {
    id: 'coefficients-abc',
    sectionId: 'coefficients',
    title: 'Meet a, b and c',
    order: 3,
    kind: 'multiple-choice',
    rewardPi: 25,
    rewardXp: 40,
  },
  {
    id: 'no-b-basics',
    sectionId: 'no-b',
    title: 'Isolating x²',
    order: 4,
    kind: 'input-equation',
    rewardPi: 30,
    rewardXp: 50,
  },
  {
    id: 'no-c-basics',
    sectionId: 'no-c',
    title: 'Factor out x',
    order: 5,
    kind: 'input-equation',
    rewardPi: 30,
    rewardXp: 50,
  },
  {
    id: 'full-discriminant',
    sectionId: 'full',
    title: 'The discriminant',
    order: 6,
    kind: 'input-equation',
    rewardPi: 40,
    rewardXp: 70,
  },
  {
    id: 'vieta-intro',
    sectionId: 'vieta',
    title: 'Sum and product of roots',
    order: 7,
    kind: 'multiple-choice',
    rewardPi: 40,
    rewardXp: 70,
  },
  {
    id: 'beat-the-clock-1',
    sectionId: 'beat-the-clock',
    title: 'Meteor shower',
    order: 8,
    kind: 'timed',
    rewardPi: 60,
    rewardXp: 100,
  },
];

export function getLesson(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

export function lessonsForSection(sectionId: SectionId): Lesson[] {
  return LESSONS.filter((l) => l.sectionId === sectionId).sort((a, b) => a.order - b.order);
}

/** The whole curriculum in play order. */
export const ORDERED_LESSONS: Lesson[] = [...LESSONS].sort((a, b) => a.order - b.order);
