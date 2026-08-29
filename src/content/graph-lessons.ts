import type { FunctionDef } from '@/lib/graph';
import type { LessonStep } from '@/types/content';
import type { GraphTask } from '@/types/graph-task';

/**
 * The graph strand of the curriculum (section q8), authored as data.
 *
 * Every exercise here is a `GraphTask`; the player renders it and `lib/graph`
 * marks it. Adding a graph lesson means adding entries to this file — no
 * component changes — which is what keeps the strand cheap to extend.
 *
 * The order is deliberate: the plane is learned before anything is read off it,
 * and each idea (roots, vertex, symmetry, shape) is met on the picture before it
 * is asked for as a number.
 */

/** Shorthand for the parabola y = ax² + bx + c. */
const q = (a: number, b: number, c: number): FunctionDef => ({ kind: 'quadratic', a, b, c });

const graph = (task: GraphTask): LessonStep => ({ kind: 'graph', task });

/** A tighter window, for curves that would otherwise be a thin spike. */
const NEAR = { xMin: -6, xMax: 6, yMin: -6, yMax: 6 };

export const GRAPH_LESSONS: Record<string, LessonStep[]> = {
  // --- q8-1 Points on the Plane --------------------------------------------
  'q8-1': [
    {
      kind: 'info',
      title: 'Two numbers, one place',
      equation: '(x, y)',
      body: 'The plane has two axes: x runs across, y runs up. A point is written (x, y) — always across first, then up. The point (0, 0) where the axes cross is called the origin.',
    },
    graph({
      kind: 'plot-point',
      prompt: 'Tap the plane at the point (3, 2).',
      expected: { x: 3, y: 2 },
      hint: 'Go 3 to the right of the origin, then 2 up.',
      explanation: 'Across 3, up 2.',
    }),
    graph({
      kind: 'plot-point',
      prompt: 'Now place (−4, 0).',
      expected: { x: -4, y: 0 },
      hint: 'A y of 0 means the point sits exactly on the horizontal axis.',
      explanation: 'Every point with y = 0 lies on the x-axis.',
    }),
    graph({
      kind: 'plot-point',
      prompt: 'And (0, −5).',
      expected: { x: 0, y: -5 },
      hint: 'x = 0 puts the point on the vertical axis; −5 means five below the origin.',
      explanation: 'Points with x = 0 lie on the y-axis.',
    }),
    graph({
      kind: 'identify',
      prompt: 'What are the coordinates of the marked point?',
      given: [{ x: -2, y: 3 }],
      options: ['(−2, 3)', '(3, −2)', '(2, 3)', '(−3, 2)'],
      correctIndex: 0,
      explanation:
        'Two to the left, three up: (−2, 3). The order matters — (3, −2) is somewhere else entirely.',
    }),
  ],

  // --- q8-2 Quadratic Functions --------------------------------------------
  'q8-2': [
    {
      kind: 'info',
      title: 'From equation to curve',
      equation: 'y = x²',
      body: 'Feed the equation an x, and it hands back a y. Each pair (x, y) is a point. Plot enough of them and they join into a smooth curve — the graph of the function.',
    },
    graph({
      kind: 'plot-point',
      prompt: 'This is y = x² − 3. Plot the point on the curve where x = 2.',
      fn: q(1, 0, -3),
      hint: 'Put x = 2 into the equation: y = 2² − 3.',
      expected: { x: 2, y: 1 },
      explanation: 'y = 4 − 3 = 1, so the curve passes through (2, 1).',
    }),
    {
      kind: 'choice',
      prompt: 'For the same curve, what is y when x = −1?',
      equation: 'y = x² − 3',
      options: ['−2', '−4', '2', '4'],
      correctIndex: 0,
      explanation: '(−1)² = 1, and 1 − 3 = −2. Squaring kills the minus sign.',
    },
    graph({
      kind: 'plot-point',
      prompt: 'Place that point — where x = −1 — on the curve.',
      fn: q(1, 0, -3),
      expected: { x: -1, y: -2 },
      explanation: 'Left one, down two. Both (2, 1) and (−1, −2) sit on the same curve.',
    }),
  ],

  // --- q8-3 Parabolas -------------------------------------------------------
  'q8-3': [
    {
      kind: 'info',
      title: 'The parabola',
      equation: 'y = ax² + bx + c',
      body: 'Every quadratic draws the same family of curve: a parabola. It is symmetric, it has exactly one turning point, and the sign of a decides which way it opens — up for positive a, down for negative.',
    },
    graph({
      kind: 'identify',
      prompt: 'Which way does this parabola open, and what does that say about a?',
      fn: q(-0.5, 1, 3),
      options: [
        'Downwards, so a < 0',
        'Upwards, so a > 0',
        'Downwards, so a > 0',
        'Upwards, so a < 0',
      ],
      correctIndex: 0,
      explanation: 'The arms point down, which only happens when a is negative.',
    }),
    graph({
      kind: 'identify',
      prompt: 'Which equation could this curve be?',
      fn: q(1, 0, -4),
      options: ['y = x² − 4', 'y = x² + 4', 'y = −x² − 4', 'y = 4x²'],
      correctIndex: 0,
      explanation: 'It opens upwards (a > 0) and crosses the y-axis at −4, which is exactly c.',
      hint: 'Where the curve meets the y-axis, x = 0 — so y = c there.',
    }),
    graph({
      kind: 'identify',
      prompt: 'A steeper parabola comes from which change?',
      fn: q(2, 0, 0),
      extraFns: [{ fn: q(0.5, 0, 0), role: 'ghost' }],
      options: [
        'A larger |a|',
        'A larger c',
        'A larger b',
        'Nothing — every parabola has the same steepness',
      ],
      correctIndex: 0,
      explanation:
        'The solid curve is y = 2x², the dashed one y = 0.5x². Only a changes the narrowness.',
    }),
  ],

  // --- q8-4 Roots as x-Intercepts ------------------------------------------
  'q8-4': [
    {
      kind: 'info',
      title: 'Roots are crossings',
      equation: 'ax² + bx + c = 0',
      body: 'Solving the equation means asking where y = 0 — and y = 0 is exactly the x-axis. So the roots of a quadratic are the x-values where its parabola crosses the horizontal axis. Two crossings, two roots.',
    },
    graph({
      kind: 'plot-roots',
      prompt: 'Tap both places where this curve crosses the x-axis.',
      fn: q(1, 0, -4),
      hint: 'x² − 4 = 0 means x² = 4. Two numbers square to 4.',
      explanation: 'The crossings are at −2 and 2 — the two roots of x² − 4 = 0.',
    }),
    graph({
      kind: 'plot-roots',
      prompt: 'Same again, for this one.',
      fn: q(1, -5, 6),
      viewport: { xMin: -2, xMax: 8, yMin: -4, yMax: 8 },
      hint: 'The curve is y = x² − 5x + 6, which factors as (x − 2)(x − 3).',
      explanation: 'Roots at 2 and 3 — read straight off the picture, no formula needed.',
    }),
    graph({
      kind: 'identify',
      prompt: 'How many real roots does this equation have?',
      fn: q(1, 2, 4),
      options: ['None', 'One', 'Two', 'Infinitely many'],
      correctIndex: 0,
      explanation:
        'The parabola floats entirely above the axis, so it never crosses: no real roots.',
    }),
  ],

  // --- q8-5 Solve Graphically (practice) -----------------------------------
  'q8-5': [
    graph({
      kind: 'plot-roots',
      prompt: 'Solve x² + 2x − 3 = 0 by reading the graph.',
      fn: q(1, 2, -3),
      hint: 'Look for the two crossings, one on each side of the turning point.',
      explanation: 'x = −3 and x = 1.',
    }),
    graph({
      kind: 'plot-roots',
      prompt: 'Now this one: −x² + 4 = 0.',
      fn: q(-1, 0, 4),
      explanation: 'x = −2 and x = 2. A downward parabola has roots just the same.',
    }),
    graph({
      kind: 'plot-roots',
      prompt: 'And this: x² − 6x + 8 = 0.',
      fn: q(1, -6, 8),
      viewport: { xMin: -2, xMax: 8, yMin: -4, yMax: 8 },
      hint: 'Two numbers that multiply to 8 and add to 6.',
      explanation: 'x = 2 and x = 4.',
    }),
    graph({
      kind: 'identify',
      prompt: 'Which equation has these roots?',
      fn: q(1, -1, -6),
      viewport: NEAR,
      options: ['x² − x − 6 = 0', 'x² + x − 6 = 0', 'x² − 5x + 6 = 0', 'x² − x + 6 = 0'],
      correctIndex: 0,
      explanation: 'The crossings are at −2 and 3, and (x + 2)(x − 3) = x² − x − 6.',
    }),
  ],

  // --- q8-6 The Vertex ------------------------------------------------------
  'q8-6': [
    {
      kind: 'info',
      title: 'The turning point',
      equation: 'x = −b / 2a',
      body: 'Every parabola turns exactly once. That point is the vertex — the lowest point when the curve opens up, the highest when it opens down. Its x sits at −b/2a, halfway between the roots; put that x back in to get its y.',
    },
    graph({
      kind: 'find-vertex',
      prompt: 'Tap the vertex of y = x² − 4x + 3.',
      fn: q(1, -4, 3),
      viewport: NEAR,
      hint: 'x = −b/2a = 4/2 = 2. Now work out y at x = 2.',
      explanation: 'The vertex is (2, −1) — the lowest point of the curve.',
    }),
    graph({
      kind: 'find-vertex',
      prompt: 'And this one: y = −x² + 2x + 3.',
      fn: q(-1, 2, 3),
      viewport: NEAR,
      hint: 'a is negative, so the vertex is the highest point. x = −2/(2 · −1) = 1.',
      explanation: 'The vertex is (1, 4) — a maximum this time, because the curve opens downwards.',
    }),
    {
      kind: 'input',
      prompt: 'For y = x² − 6x + 5, what is the x of the vertex?',
      accepted: ['3', 'x=3'],
      hint: 'x = −b/2a, and here b = −6, a = 1.',
      explanation: '−(−6)/(2 · 1) = 3. It sits halfway between the roots 1 and 5.',
    },
  ],

  // --- q8-7 Axis of Symmetry ------------------------------------------------
  'q8-7': [
    {
      kind: 'info',
      title: 'The mirror line',
      equation: 'x = −b / 2a',
      body: 'Fold a parabola down the vertical line through its vertex and the two halves land on each other. That line is the axis of symmetry — and it explains why the roots are always the same distance from the vertex, one on each side.',
    },
    graph({
      kind: 'identify',
      prompt: 'Where is the axis of symmetry of this curve?',
      fn: q(1, -4, 0),
      viewport: NEAR,
      options: ['x = 2', 'x = 0', 'x = 4', 'y = −4'],
      correctIndex: 0,
      explanation: 'The roots are 0 and 4, so the mirror line runs exactly between them at x = 2.',
      hint: 'It is a vertical line, so its equation starts with x =.',
    }),
    graph({
      kind: 'find-vertex',
      prompt: 'The axis of symmetry passes through the vertex. Tap it.',
      fn: q(1, -4, 0),
      viewport: NEAR,
      explanation: 'The vertex is (2, −4), sitting on the line x = 2.',
    }),
    {
      kind: 'choice',
      prompt:
        'One root of a quadratic is 1 and the axis of symmetry is x = 4. What is the other root?',
      options: ['7', '5', '8', '3'],
      correctIndex: 0,
      explanation:
        'The root is 3 to the left of the mirror line, so the other is 3 to the right: 4 + 3 = 7.',
      hint: 'The roots are mirror images: equally far from the axis, on opposite sides.',
    },
  ],

  // --- q8-8 Changing Coefficients ------------------------------------------
  'q8-8': [
    {
      kind: 'info',
      title: 'Three dials',
      equation: 'y = ax² + bx + c',
      body: 'a sets the direction and the narrowness. c lifts or drops the whole curve — it is exactly where the parabola meets the y-axis. b slides the curve sideways as well as down, which is why it is the least obvious of the three.',
    },
    graph({
      kind: 'parameters',
      prompt: 'Move the sliders until the curve becomes y = x² − 4.',
      start: { a: 1, b: 0, c: 0 },
      goal: { kind: 'match-function', fn: q(1, 0, -4) },
      hint: 'Only c needs to move: it is the height of the curve at x = 0.',
      explanation:
        'Changing c slid the whole parabola down by 4, and two roots appeared where before there was one.',
    }),
    graph({
      kind: 'parameters',
      prompt: 'Now make it open downwards through the same two crossings: y = −x² + 4.',
      start: { a: 1, b: 0, c: -4 },
      goal: { kind: 'match-function', fn: q(-1, 0, 4) },
      hint: 'Flip the sign of a, then fix c so the top of the curve is at 4.',
      explanation: 'Same roots, mirrored shape — the roots do not care which way the curve opens.',
    }),
    graph({
      kind: 'identify',
      prompt: 'The dashed curve is y = x². What single change gives the solid one?',
      fn: q(1, 0, 3),
      extraFns: [{ fn: q(1, 0, 0), role: 'ghost' }],
      options: [
        'c went from 0 to 3',
        'a went from 1 to 3',
        'b went from 0 to 3',
        'a became negative',
      ],
      correctIndex: 0,
      explanation: 'The shape is untouched and the whole curve moved up 3 — that is c, on its own.',
    }),
  ],

  // --- q8-9 Graphical Discriminant -----------------------------------------
  'q8-9': [
    {
      kind: 'info',
      title: 'What D looks like',
      equation: 'D = b² − 4ac',
      body: 'The discriminant counts crossings before you solve anything. D > 0: the curve cuts the axis twice. D = 0: it just touches, at the vertex. D < 0: it misses the axis completely, and there are no real roots.',
    },
    graph({
      kind: 'identify',
      prompt: 'What is the sign of D here?',
      fn: q(1, -6, 9),
      viewport: { xMin: -2, xMax: 8, yMin: -4, yMax: 8 },
      options: ['D = 0', 'D > 0', 'D < 0', 'It cannot be told from a picture'],
      correctIndex: 0,
      explanation:
        'The curve touches the axis at exactly one point — the vertex sits on it, so D = 0. (Here D = 36 − 36.)',
    }),
    graph({
      kind: 'identify',
      prompt: 'And here?',
      fn: q(-1, 2, -4),
      viewport: NEAR,
      options: ['D < 0', 'D = 0', 'D > 0', 'D = 1'],
      correctIndex: 0,
      explanation:
        'The whole parabola stays below the axis, so nothing is ever zero: no real roots, D < 0.',
    }),
    graph({
      kind: 'find-vertex',
      prompt: 'When D = 0 the single root is the vertex. Tap it.',
      fn: q(1, -6, 9),
      viewport: { xMin: -2, xMax: 8, yMin: -4, yMax: 8 },
      explanation: 'The vertex (3, 0) is the repeated root of x² − 6x + 9 = 0.',
    }),
  ],

  // --- q8-10 Sketching a Parabola (practice) -------------------------------
  'q8-10': [
    {
      kind: 'info',
      title: 'Three facts are enough',
      body: 'To sketch a parabola you need almost nothing: which way it opens (the sign of a), where it crosses the axis (the roots), and where it turns (the vertex). Find those three and the curve draws itself.',
    },
    graph({
      kind: 'plot-roots',
      prompt: 'Start with the crossings of y = x² − 2x − 3.',
      fn: q(1, -2, -3),
      viewport: NEAR,
      hint: '(x − 3)(x + 1).',
      explanation: 'Roots at −1 and 3.',
    }),
    graph({
      kind: 'find-vertex',
      prompt: 'Now the turning point of the same curve.',
      fn: q(1, -2, -3),
      viewport: NEAR,
      hint: 'Halfway between −1 and 3.',
      explanation: 'The vertex is (1, −4).',
    }),
    graph({
      kind: 'parameters',
      prompt: 'Build a parabola with roots −2 and 2 that opens downwards.',
      start: { a: 1, b: 0, c: 0 },
      goal: { kind: 'match-function', fn: q(-1, 0, 4) },
      hint: 'Downwards means a < 0; roots at ±2 means the curve is 0 when x² = 4.',
      explanation: 'y = −x² + 4 does both: it opens down and crosses at −2 and 2.',
    }),
  ],
};
