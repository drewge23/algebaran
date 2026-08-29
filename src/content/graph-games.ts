import { evaluate, vertex, type FunctionDef, type Viewport } from '@/lib/graph';
import type { GraphTask } from '@/types/graph-task';

/**
 * The graph mini-games.
 *
 * Each game is a generator, not a fixed question list: a round is built from a
 * seeded RNG and a difficulty that climbs as the run goes on, so replaying is
 * practice rather than recall. Rounds are `GraphTask`s, which means the games
 * and the lessons are marked by exactly the same code.
 */

export type Rng = () => number;

export interface GraphGame {
  id: string;
  title: string;
  blurb: string;
  glyph: string;
  /** Seconds for the whole run. */
  seconds: number;
  /** π per correct round, before the player's income multiplier. */
  piPerCorrect: number;
  /** `difficulty` climbs 0 → 1 across a run. */
  build: (rng: Rng, difficulty: number) => GraphTask;
}

// --- helpers ---------------------------------------------------------------

const q = (a: number, b: number, c: number): FunctionDef => ({ kind: 'quadratic', a, b, c });

/** Inclusive integer draw from the supplied RNG. */
const int = (rng: Rng, min: number, max: number) => min + Math.floor(rng() * (max - min + 1));

const pick = <T>(rng: Rng, items: readonly T[]): T => items[Math.floor(rng() * items.length)];

/**
 * Builds a multiple choice from the right answer and a list of candidate
 * decoys, then shuffles.
 *
 * Decoys are deduplicated against the answer and each other, because a
 * generator that flips a coefficient can easily land back on the right answer
 * (flipping b when b = 0) or on another decoy — and a repeated option gives the
 * game away. Candidates are tried in order until `count` options are filled, so
 * the strongest misconception goes first and the rest are padding.
 */
function choices(rng: Rng, correct: string, candidates: string[], count = 4) {
  const out = [correct];
  for (const candidate of candidates) {
    if (out.length >= count) break;
    if (!out.includes(candidate)) out.push(candidate);
  }
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return { options: out, correctIndex: out.indexOf(correct) };
}

/**
 * A parabola with whole-number roots, so every answer sits on the lattice and a
 * near-miss tap is the learner's error rather than the grid's.
 */
function withRoots(rng: Rng, spread: number, allowNegativeA: boolean) {
  let r1 = int(rng, -spread, spread);
  let r2 = int(rng, -spread, spread);
  if (r1 === r2) r2 = r1 + 1 > spread ? r1 - 1 : r1 + 1;
  if (r1 > r2) [r1, r2] = [r2, r1];
  const a = allowNegativeA && rng() < 0.4 ? -1 : 1;
  // (x − r1)(x − r2), scaled by a.
  return { fn: q(a, -a * (r1 + r2), a * r1 * r2), r1, r2 };
}

/** A window that comfortably contains the given x-range and the curve's turn. */
function frame(fn: FunctionDef, xs: number[]): Viewport {
  const v = vertex(fn);
  const ys = [0, ...(v ? [v.y] : []), ...xs.map((x) => evaluate(fn, x))];
  const xMax = Math.max(4, ...xs.map(Math.abs), ...(v ? [Math.abs(v.x)] : [])) + 2;
  const yMax = Math.max(4, ...ys.map(Math.abs)) + 2;
  return { xMin: -xMax, xMax, yMin: -yMax, yMax };
}

const fmt = (n: number) => (n < 0 ? `−${Math.abs(n)}` : `${n}`);

/** Writes y = ax² + bx + c the way a textbook would. */
function label(fn: FunctionDef): string {
  if (fn.kind === 'linear') return `y = ${fn.m}x ${fn.c < 0 ? '−' : '+'} ${Math.abs(fn.c)}`;
  const a = fn.a === 1 ? '' : fn.a === -1 ? '−' : fmt(fn.a);
  const b =
    fn.b === 0 ? '' : ` ${fn.b < 0 ? '−' : '+'} ${Math.abs(fn.b) === 1 ? '' : Math.abs(fn.b)}x`;
  const c = fn.c === 0 ? '' : ` ${fn.c < 0 ? '−' : '+'} ${Math.abs(fn.c)}`;
  return `y = ${a}x²${b}${c}`;
}

// --- the games -------------------------------------------------------------

export const GRAPH_GAMES: GraphGame[] = [
  {
    id: 'root-hunt',
    title: 'Root Hunt',
    blurb: 'Tap every place the curve crosses the axis.',
    glyph: '🎯',
    seconds: 75,
    piPerCorrect: 4,
    build: (rng, d) => {
      const spread = d < 0.4 ? 3 : d < 0.75 ? 4 : 5;
      const { fn, r1, r2 } = withRoots(rng, spread, d > 0.5);
      return {
        kind: 'plot-roots',
        prompt: 'Tap both roots.',
        fn,
        viewport: frame(fn, [r1, r2]),
      };
    },
  },

  {
    id: 'trajectory',
    title: 'Trajectory',
    blurb: 'Shape a curve that flies through every target.',
    glyph: '🚀',
    seconds: 120,
    piPerCorrect: 8,
    build: (rng, d) => {
      // Build the answer first, then hand over its targets: a reachable puzzle
      // by construction, rather than one that happens to have a solution.
      const a = pick(rng, d < 0.5 ? [-1, -0.5] : [-1, -0.5, -1.5, 0.5]);
      const b = int(rng, -4, 4);
      const c = int(rng, -3, 5);
      const answer = q(a, b, c);
      const xs = [int(rng, -4, -1), int(rng, 1, 4)].slice(0, d < 0.5 ? 1 : 2);
      const targets = xs.map((x) => ({ x, y: Number(evaluate(answer, x).toFixed(2)) }));
      return {
        kind: 'parameters',
        prompt: targets.length === 1 ? 'Fly the curve through the target.' : 'Hit both targets.',
        start: { a: 1, b: 0, c: 0 },
        goal: { kind: 'hit-targets' },
        targets,
        viewport: frame(answer, xs),
      };
    },
  },

  {
    id: 'vertex-rush',
    title: 'Vertex Rush',
    blurb: 'Find the turning point before the clock does.',
    glyph: '⛰️',
    seconds: 75,
    piPerCorrect: 5,
    build: (rng, d) => {
      // Even b keeps the vertex on the lattice while the learner is new to it.
      const a = d > 0.6 && rng() < 0.4 ? -1 : 1;
      const b = int(rng, -3, 3) * 2 * a;
      const c = int(rng, -4, 4);
      const fn = q(a, b, c);
      const v = vertex(fn)!;
      return {
        kind: 'find-vertex',
        prompt: `Tap the vertex of ${label(fn)}.`,
        fn,
        viewport: frame(fn, [v.x - 2, v.x + 2]),
      };
    },
  },

  {
    id: 'coordinate-dash',
    title: 'Coordinate Dash',
    blurb: 'Plot the point before it gets away.',
    glyph: '📍',
    seconds: 60,
    piPerCorrect: 3,
    build: (rng, d) => {
      const reach = d < 0.5 ? 4 : 6;
      const p = { x: int(rng, -reach, reach), y: int(rng, -reach, reach) };
      return {
        kind: 'plot-point',
        prompt: `Plot (${fmt(p.x)}, ${fmt(p.y)}).`,
        expected: p,
        viewport: { xMin: -reach - 1, xMax: reach + 1, yMin: -reach - 1, yMax: reach + 1 },
      };
    },
  },

  {
    id: 'read-off',
    title: 'Read-Off',
    blurb: 'Name the coordinates of the marked point.',
    glyph: '👀',
    seconds: 60,
    piPerCorrect: 3,
    build: (rng, d) => {
      const reach = d < 0.5 ? 4 : 6;
      const p = { x: int(rng, -reach, reach), y: int(rng, -reach, reach) };
      const coord = (x: number, y: number) => `(${fmt(x)}, ${fmt(y)})`;
      // Nudges stay inside the visible window, so no decoy is dismissable just
      // for naming a point that is plainly off the plane.
      const near = (v: number) => (v >= reach ? v - 1 : v + 1);
      const right = coord(p.x, p.y);
      return {
        kind: 'identify',
        prompt: 'Where is the marked point?',
        given: [p],
        viewport: { xMin: -reach - 1, xMax: reach + 1, yMin: -reach - 1, yMax: reach + 1 },
        ...choices(rng, right, [
          coord(p.y, p.x), // the classic swap
          coord(-p.x, p.y),
          coord(p.x, -p.y),
          coord(-p.x, -p.y),
          coord(near(p.x), p.y),
          coord(p.x, near(p.y)),
        ]),
      };
    },
  },

  {
    id: 'match-curve',
    title: 'Curve Match',
    blurb: 'Slide a, b and c until the curves agree.',
    glyph: '🎚️',
    seconds: 120,
    piPerCorrect: 8,
    build: (rng, d) => {
      const a = pick(rng, d < 0.5 ? [1, -1] : [1, -1, 0.5, 2, -0.5]);
      const b = d < 0.35 ? 0 : int(rng, -4, 4);
      const c = int(rng, -5, 5);
      const target = q(a, b, c);
      return {
        kind: 'parameters',
        prompt: 'Match the dashed curve.',
        start: { a: 1, b: 0, c: 0 },
        goal: { kind: 'match-function', fn: target },
        extraFns: [{ fn: target, role: 'target' }],
        viewport: frame(target, [-4, 4]),
      };
    },
  },

  {
    id: 'count-roots',
    title: 'How Many Roots?',
    blurb: 'Judge the discriminant from the picture alone.',
    glyph: '🔢',
    seconds: 60,
    piPerCorrect: 4,
    build: (rng, d) => {
      const wanted = pick(rng, d < 0.4 ? [2, 0] : [2, 1, 0]);
      let fn: FunctionDef;
      if (wanted === 2) fn = withRoots(rng, 4, true).fn;
      else if (wanted === 1) {
        const r = int(rng, -3, 3);
        const a = rng() < 0.5 ? 1 : -1;
        fn = q(a, -2 * a * r, a * r * r); // (x − r)²
      } else {
        const a = rng() < 0.5 ? 1 : -1;
        fn = q(a, int(rng, -2, 2), a * int(rng, 2, 6)); // never reaches the axis
      }
      const right = wanted === 2 ? 'Two roots' : wanted === 1 ? 'One root' : 'No real roots';
      return {
        kind: 'identify',
        prompt: 'How many real roots?',
        fn,
        viewport: frame(fn, [-4, 4]),
        ...choices(rng, right, ['Two roots', 'One root', 'No real roots'], 3),
      };
    },
  },

  {
    id: 'which-equation',
    title: 'Which Equation?',
    blurb: 'Pick the equation that drew this curve.',
    glyph: '🧩',
    seconds: 75,
    piPerCorrect: 5,
    build: (rng, d) => {
      const { fn, r1, r2 } = withRoots(rng, d < 0.5 ? 3 : 4, d > 0.5);
      const base = fn as Extract<FunctionDef, { kind: 'quadratic' }>;
      const right = label(base);
      return {
        kind: 'identify',
        prompt: 'Which equation is this?',
        fn,
        viewport: frame(fn, [r1, r2]),
        // Decoys flip or nudge exactly one coefficient, so the picture has to be
        // read rather than eyeballed for general shape.
        ...choices(rng, right, [
          label(q(base.a, -base.b, base.c)),
          label(q(-base.a, base.b, base.c)),
          label(q(base.a, base.b, -base.c)),
          label(q(base.a, base.b + 2, base.c)),
          label(q(base.a, base.b, base.c + 2)),
          label(q(base.a, base.b - 2, base.c)),
        ]),
      };
    },
  },
];

export const getGraphGame = (id: string) => GRAPH_GAMES.find((g) => g.id === id);

/** Levels that open a mini-game instead of a lesson. */
export const GAME_FOR_LEVEL: Record<string, string> = {
  'q8-11': 'root-hunt',
  'q8-12': 'trajectory',
};

/** How many rounds a run lasts. */
export const ROUNDS_PER_RUN = 8;
