import type { LessonStep } from '@/types/content';

/**
 * Authored, interactive lesson content, keyed by lesson id. Lessons without an
 * entry here fall back to the "coming soon" placeholder. As each lesson is
 * written, add its steps below — this is the single seam for lesson authoring.
 *
 * English-first (see LessonStep). Equations use Unicode `²` and the true minus
 * sign `−` (U+2212) so they render crisply without a math renderer.
 */
export const LESSON_STEPS: Record<string, LessonStep[]> = {
  'coefficients-abc': [
    {
      kind: 'info',
      title: 'The standard form',
      equation: 'ax² + bx + c = 0',
      body: 'Every quadratic equation can be arranged into this shape. The numbers a, b and c are called the coefficients: a sits with x², b sits with x, and c stands alone.',
    },
    {
      kind: 'choice',
      prompt: 'What is a?',
      equation: '3x² + 5x − 2 = 0',
      options: ['3', '5', '−2', '2'],
      correctIndex: 0,
      explanation: 'a is the coefficient of x² — here that is 3.',
    },
    {
      kind: 'choice',
      prompt: 'What is b?',
      equation: '3x² + 5x − 2 = 0',
      options: ['3', '5', '−2', '1'],
      correctIndex: 1,
      explanation: 'b is the coefficient of x — here that is 5.',
    },
    {
      kind: 'choice',
      prompt: 'What is c?',
      equation: '3x² + 5x − 2 = 0',
      options: ['3', '5', '−2', '2'],
      correctIndex: 2,
      explanation: 'c is the constant term — the number on its own, here −2.',
    },
    {
      kind: 'choice',
      prompt: 'Careful — what is b here?',
      equation: 'x² − 7 = 0',
      options: ['1', '−7', '0', '7'],
      correctIndex: 2,
      explanation: 'There is no x term, so b = 0. (And a = 1, since x² means 1x².)',
    },
  ],

  'why-intro': [
    {
      kind: 'info',
      title: 'Curves all around us',
      equation: 'y = x²',
      body: 'A thrown ball, a fountain’s arc, a satellite dish — they all trace a parabola, the graph of a quadratic. Quadratics describe how things speed up, fall and curve.',
    },
    {
      kind: 'choice',
      prompt: 'Which path does a thrown ball follow?',
      options: ['A straight line', 'A parabola', 'A circle', 'A zigzag'],
      correctIndex: 1,
      explanation: 'Under gravity, a thrown ball traces a parabola — a quadratic curve.',
    },
    {
      kind: 'choice',
      prompt: 'What makes an equation “quadratic”?',
      options: ['It has an x² term', 'It has only x', 'It has no x', 'It has x³'],
      correctIndex: 0,
      explanation: 'Quadratic means the highest power of x is 2 — the x² term.',
    },
  ],

  'vieta-intro': [
    {
      kind: 'info',
      title: 'Vieta’s shortcut',
      equation: 'x² + px + q = 0',
      body: 'If this equation has roots x₁ and x₂, then their sum is −p and their product is q — a fast way to check answers without fully solving.',
    },
    {
      kind: 'choice',
      prompt: 'What is the sum of the roots?',
      equation: 'x² − 5x + 6 = 0',
      options: ['−5', '5', '6', '−6'],
      correctIndex: 1,
      explanation: 'Sum of roots = −p. Here p = −5, so the sum is 5. (The roots are 2 and 3.)',
    },
    {
      kind: 'choice',
      prompt: 'And the product of the roots?',
      equation: 'x² − 5x + 6 = 0',
      options: ['5', '6', '−6', '−5'],
      correctIndex: 1,
      explanation: 'Product of roots = q = 6, since 2 × 3 = 6.',
    },
  ],

  'problem-basics': [
    {
      kind: 'info',
      title: 'From words to symbols',
      body: 'Give the unknown a name — usually x — then translate each phrase into symbols, piece by piece.',
    },
    {
      kind: 'input',
      problem: 'A square has side length x, and its area is 49.',
      prompt: 'Write the equation.',
      accepted: ['x²=49', 'x^2=49'],
      explanation: 'The area of a square is side², so x² = 49.',
    },
    {
      kind: 'input',
      problem: 'A number x is squared, then twice the number is added, giving 15.',
      prompt: 'Write the equation (start with the x² term).',
      accepted: ['x²+2x=15', 'x^2+2x=15', '2x+x²=15'],
      explanation: 'x squared is x², twice the number is 2x: x² + 2x = 15.',
    },
  ],

  'no-b-basics': [
    {
      kind: 'info',
      title: 'No middle term',
      equation: 'ax² + c = 0',
      body: 'With no bx term, isolate x² by moving c across and dividing, then take the square root — and remember it has two answers, ±.',
    },
    {
      kind: 'input',
      problem: 'Start from x² − 9 = 0. Isolate the x² term.',
      prompt: 'Write x² = ▢',
      accepted: ['x²=9', 'x^2=9'],
      explanation: 'Add 9 to both sides: x² = 9.',
    },
    {
      kind: 'choice',
      prompt: 'So what is x?',
      equation: 'x² = 9',
      options: ['x = 3', 'x = ±3', 'x = 9', 'x = ±9'],
      correctIndex: 1,
      explanation: '√9 = 3, and squaring loses the sign, so x = ±3.',
    },
  ],

  'no-c-basics': [
    {
      kind: 'info',
      title: 'No constant',
      equation: 'ax² + bx = 0',
      body: 'With no constant term, factor out the common x: x(ax + b) = 0. A product is zero exactly when one of its factors is zero.',
    },
    {
      kind: 'choice',
      prompt: 'Factor x² − 5x.',
      options: ['x(x − 5)', 'x(x + 5)', 'x²(1 − 5)', '(x − 5)(x − 5)'],
      correctIndex: 0,
      explanation: 'Take out the common x: x·x − 5·x = x(x − 5).',
    },
    {
      kind: 'choice',
      prompt: 'So x(x − 5) = 0 gives which solutions?',
      equation: 'x(x − 5) = 0',
      options: ['x = 5 only', 'x = 0 or x = 5', 'x = 0 only', 'x = −5 or 5'],
      correctIndex: 1,
      explanation: 'Either x = 0 or x − 5 = 0, so x = 0 or x = 5.',
    },
  ],
};

export function stepsForLesson(id: string): LessonStep[] | undefined {
  return LESSON_STEPS[id];
}
