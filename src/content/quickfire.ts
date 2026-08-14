/**
 * Question bank for the timed "Beat the Clock" round. Deliberately separate from
 * the lesson catalogue: these are short recall drills tuned to be answerable in
 * a couple of seconds, not teaching steps.
 */
export interface QuickQuestion {
  /** Rendered in the maths face; keep it short enough to read at a glance. */
  equation: string;
  prompt: string;
  options: string[];
  correctIndex: number;
}

export const QUICKFIRE: QuickQuestion[] = [
  { equation: '3x² + 5x − 2 = 0', prompt: 'a =', options: ['3', '5', '−2'], correctIndex: 0 },
  { equation: '3x² + 5x − 2 = 0', prompt: 'b =', options: ['3', '5', '−2'], correctIndex: 1 },
  { equation: '3x² + 5x − 2 = 0', prompt: 'c =', options: ['3', '5', '−2'], correctIndex: 2 },
  { equation: 'x² − 7 = 0', prompt: 'b =', options: ['1', '0', '−7'], correctIndex: 1 },
  { equation: '4x² + x = 0', prompt: 'c =', options: ['0', '1', '4'], correctIndex: 0 },
  { equation: 'x² = 25', prompt: 'x =', options: ['±5', '5', '±25'], correctIndex: 0 },
  { equation: 'x² = 49', prompt: 'x =', options: ['7', '±7', '±49'], correctIndex: 1 },
  {
    equation: 'x(x − 4) = 0',
    prompt: 'roots',
    options: ['0 and 4', '4 only', '−4 and 0'],
    correctIndex: 0,
  },
  {
    equation: 'x(x + 3) = 0',
    prompt: 'roots',
    options: ['0 and 3', '0 and −3', '3 only'],
    correctIndex: 1,
  },
  { equation: 'x² − 4x + 4 = 0', prompt: 'D =', options: ['0', '16', '32'], correctIndex: 0 },
  { equation: 'x² + 2x + 5 = 0', prompt: 'D =', options: ['−16', '24', '16'], correctIndex: 0 },
  { equation: 'x² − 5x + 6 = 0', prompt: 'D =', options: ['1', '49', '−1'], correctIndex: 0 },
  {
    equation: 'x² − 5x + 6 = 0',
    prompt: 'sum of roots',
    options: ['5', '−5', '6'],
    correctIndex: 0,
  },
  {
    equation: 'x² − 5x + 6 = 0',
    prompt: 'product of roots',
    options: ['5', '6', '−6'],
    correctIndex: 1,
  },
  {
    equation: 'x² + 3x − 10 = 0',
    prompt: 'product of roots',
    options: ['−10', '10', '3'],
    correctIndex: 0,
  },
  { equation: 'D < 0', prompt: 'how many roots?', options: ['0', '1', '2'], correctIndex: 0 },
  { equation: 'D = 0', prompt: 'how many roots?', options: ['0', '1', '2'], correctIndex: 1 },
  { equation: 'D > 0', prompt: 'how many roots?', options: ['0', '1', '2'], correctIndex: 2 },
];
