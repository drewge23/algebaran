import type { LessonStep } from '@/types/content';

/**
 * Projects are applied briefs: one real scenario carried end-to-end, using the
 * whole curriculum rather than drilling a single skill. They reuse the lesson
 * engine's step types, so authoring a project is authoring steps.
 *
 * A project unlocks only once its prerequisite lessons are done — the point is
 * to apply knowledge already earned, not to teach it.
 */
export interface Project {
  id: string;
  title: string;
  /** One-line pitch shown on the card. */
  blurb: string;
  /** The scenario, shown before starting. */
  brief: string;
  glyph: string;
  /** Lesson ids that must be completed first. */
  requires: string[];
  rewardPi: number;
  rewardXp: number;
  steps: LessonStep[];
}

export const PROJECTS: Project[] = [
  {
    id: 'rescue-flare',
    title: 'The Rescue Flare',
    blurb: 'Get a signal flare over the ridge — and time the rescue.',
    glyph: '🚀',
    requires: ['coefficients-abc', 'no-b-basics', 'full-discriminant'],
    rewardPi: 120,
    rewardXp: 200,
    brief:
      'A survey team is stranded behind a ridge 15 m high. You fire a signal flare straight up from the valley floor at 20 m/s. Its height after t seconds is h = −5t² + 20t. Work out whether the flare clears the ridge, and when the team will see it.',
    steps: [
      {
        kind: 'info',
        title: 'Mission brief',
        equation: 'h = −5t² + 20t',
        body: 'This is a quadratic in t. Everything you need — coefficients, roots, the discriminant — you already have. Read the equation first: what are a, b and c?',
      },
      {
        kind: 'choice',
        prompt: 'What is a?',
        equation: 'h = −5t² + 20t',
        options: ['−5', '20', '0', '5'],
        correctIndex: 0,
        hint: 'a is whatever multiplies t². Mind the sign — gravity pulls down.',
        explanation: 'a = −5. The negative sign is what makes the flare come back down.',
      },
      {
        kind: 'roots',
        prompt: 'When is the flare at ground level? Solve h = 0.',
        equation: '−5t² + 20t = 0',
        roots: ['0', '4'],
        hint: 'There is no constant term, so factor out the common t: t(−5t + 20) = 0.',
        explanation:
          't = 0 is the launch, t = 4 is the moment it lands. So the flare is airborne for 4 seconds.',
      },
      {
        kind: 'choice',
        prompt: 'The flare peaks halfway between its two ground times. When?',
        options: ['t = 2 s', 't = 4 s', 't = 1 s', 't = 3 s'],
        correctIndex: 0,
        hint: 'A parabola is symmetric. The midpoint of 0 and 4 is where the peak sits.',
        explanation: 'Halfway between t = 0 and t = 4 is t = 2 s.',
      },
      {
        kind: 'input',
        problem: 'Substitute t = 2 into h = −5t² + 20t to get the peak height in metres.',
        prompt: 'Maximum height (just the number)',
        accepted: ['20'],
        hint: '−5·(2)² + 20·(2) = −5·4 + 40.',
        explanation: 'h = −20 + 40 = 20 m. The ridge is 15 m, so the flare clears it.',
      },
      {
        kind: 'choice',
        prompt: 'So does the flare clear the 15 m ridge?',
        options: [
          'Yes — it reaches 20 m',
          'No — it stops at 12 m',
          'Exactly level',
          'Not enough data',
        ],
        correctIndex: 0,
        explanation: 'It peaks at 20 m, a clear 5 m above the ridge. The team will see it.',
      },
      {
        kind: 'info',
        title: 'Mission complete',
        equation: 'D = b² − 4ac = 400',
        body: 'Notice the discriminant was positive all along (400 > 0), which is exactly why there were two ground times — launch and landing. The maths told you the flare would work before you ever fired it.',
      },
    ],
  },
];

export function getProject(id: string): Project | undefined {
  return PROJECTS.find((p) => p.id === id);
}
