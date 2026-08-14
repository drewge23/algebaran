import {
  REWARDS,
  type Level,
  type LevelKind,
  type Section,
  type SectionKind,
  type World,
} from '@/types/curriculum';

/**
 * The whole curriculum, as data.
 *
 * Levels are declared in a compact tuple form and expanded below — with ~130 of
 * them, an object-per-level would bury the shape of the course in punctuation.
 * Ids are stable and meaningful (`q4-2`, `f3`) because they key both the
 * authored steps in `lesson-steps.ts` and the server's `rewards` table.
 */

export const WORLDS: World[] = [
  {
    id: 'foundations',
    title: 'Foundations',
    blurb: 'The arithmetic and algebra everything else stands on.',
    glyph: '🌍',
    order: 1,
    available: true,
  },
  {
    id: 'quadratics',
    title: 'Quadratic Equations',
    blurb: 'From "what is this" to olympiad problems.',
    glyph: '🪐',
    order: 2,
    available: true,
  },
  {
    id: 'functions',
    title: 'Functions',
    blurb: 'Graphs, transformations and behaviour.',
    glyph: '📈',
    order: 3,
    available: false,
    unlockNote: 'Charting this world next.',
  },
  {
    id: 'systems',
    title: 'Systems',
    blurb: 'Several equations, solved together.',
    glyph: '🛰️',
    order: 4,
    available: false,
    unlockNote: 'Not yet surveyed.',
  },
  {
    id: 'geometry',
    title: 'Geometry',
    blurb: 'Shape, space and measurement.',
    glyph: '📐',
    order: 5,
    available: false,
    unlockNote: 'Not yet surveyed.',
  },
];

/** [id, title, blurb, glyph, kind] */
type SectionSpec = [string, string, string, string, SectionKind];

const SECTION_SPECS: Record<string, SectionSpec[]> = {
  foundations: [['f', 'Getting Started', 'Symbols, numbers and the basics.', '🧱', 'core']],
  quadratics: [
    ['q1', 'What Is a Quadratic?', 'Recognise them and name their parts.', '❓', 'core'],
    ['q2', 'First Ways to Solve', 'Inspection, roots and factoring.', '🔑', 'core'],
    ['q3', 'Practice Block I', 'Factoring, until it is automatic.', '🔁', 'practice'],
    ['q4', 'The Quadratic Formula', 'The method that always works.', '🧮', 'core'],
    ['q5', 'The Discriminant', 'Know the answer before you solve.', '🔍', 'core'],
    ['q6', 'Complete Solutions', 'Every case, end to end.', '✅', 'core'],
    ['q7', 'Practice Block II', 'Formula drills and mixed signs.', '🔁', 'practice'],
    ['q8', 'Graphical Meaning', 'Where the maths becomes a picture.', '📊', 'bonus'],
    ['q9', "Vieta's Formulas", 'Sum and product of the roots.', '🧠', 'bonus'],
    ['q10', 'Completing the Square', 'The method behind the formula.', '⬛', 'bonus'],
    ['q11', 'Vertex & Geometry', 'Peaks, symmetry and minimums.', '⛰️', 'core'],
    ['q12', 'Applications', 'Where quadratics show up in real life.', '🌉', 'apply'],
    ['q13', 'Mastery', 'Everything, mixed together.', '🎯', 'practice'],
    ['q14', 'Hard Levels', 'Parameters and inequalities.', '🔥', 'hard'],
    ['q15', 'Olympiad', 'Clever structure, non-obvious moves.', '🏅', 'olympiad'],
    ['q16', 'Exams', 'Assessed checkpoints.', '📜', 'exam'],
  ],
};

export const SECTIONS: Section[] = Object.entries(SECTION_SPECS).flatMap(([worldId, specs]) =>
  specs.map(([id, title, blurb, glyph, kind], i) => ({
    id,
    worldId,
    title,
    blurb,
    glyph,
    kind,
    order: i + 1,
  })),
);

/** [id, title, subtitle, kind?] — kind defaults per section below. */
type LevelSpec = [string, string, string, LevelKind?];

const LEVEL_SPECS: Record<string, { defaultKind: LevelKind; levels: LevelSpec[] }> = {
  // --- Foundations ---------------------------------------------------------
  f: {
    defaultKind: 'learn',
    levels: [
      ['f1', 'Reading Expressions', 'Symbols, operations and parentheses.'],
      ['f2', 'Order of Operations', 'What gets calculated first.'],
      ['f3', 'Negative Numbers', 'Adding, subtracting and multiplying below zero.'],
      ['f4', 'Fractions', 'Adding and simplifying.'],
      ['f5', 'Powers', 'Squares and small exponents.'],
      ['f6', 'Square Roots', 'What a root actually asks for.'],
      ['f7', 'Variables', 'Letters standing in for numbers.'],
      ['f8', 'Simple Equations', 'One and two step solving.'],
      ['f9', 'Substitution', 'Putting values back in.'],
      ['f10', 'The Coordinate Plane', 'Axes, points and pairs.'],
    ],
  },

  // --- Stage 1: What Is a Quadratic? ---------------------------------------
  q1: {
    defaultKind: 'learn',
    levels: [
      ['q1-1', 'Meet the Quadratic', 'What makes an equation quadratic.'],
      ['q1-2', 'Quadratic or Not?', 'Tell them apart at a glance.', 'practice'],
      ['q1-3', 'The Standard Form', 'ax² + bx + c = 0.'],
      ['q1-4', 'Finding a, b and c', 'Read the coefficients off.'],
      ['q1-5', 'Special Cases', 'When a coefficient is zero.'],
    ],
  },

  // --- Stage 2: First Ways to Solve ----------------------------------------
  q2: {
    defaultKind: 'learn',
    levels: [
      ['q2-1', 'Solve by Inspection', 'Some answers you can just see.'],
      ['q2-2', 'Square Roots', 'Solving x² = k.'],
      ['q2-3', 'No x-Term', 'Solving ax² + c = 0.'],
      ['q2-4', 'Factoring Basics', 'Multiplying two brackets out.'],
      ['q2-5', 'Factoring a Quadratic', 'Going the other way.'],
      ['q2-6', 'The Zero Product Rule', 'If AB = 0, one of them is zero.'],
      ['q2-7', 'Solving by Factoring', 'Putting both ideas together.'],
    ],
  },

  // --- Stage 3: Practice Block I -------------------------------------------
  q3: {
    defaultKind: 'practice',
    levels: [
      ['q3-1', 'Factoring Practice', 'Straightforward positives.'],
      ['q3-2', 'Mixed Factoring', 'Both signs in play.'],
      ['q3-3', 'Negative Coefficients', 'Minding the minus signs.'],
      ['q3-4', 'Large Coefficients', 'Bigger numbers, same method.'],
      ['q3-5', 'Choose the Easy Method', 'Roots or factoring?'],
    ],
  },

  // --- Stage 4: The Quadratic Formula --------------------------------------
  q4: {
    defaultKind: 'learn',
    levels: [
      ['q4-1', 'Why We Need It', 'When factoring simply will not work.'],
      ['q4-2', 'Meet the Formula', 'x = (−b ± √(b² − 4ac)) / 2a.'],
      ['q4-3', 'Step by Step', 'One stage at a time.'],
      ['q4-4', 'Substituting a, b, c', 'Getting the values in correctly.', 'practice'],
      ['q4-5', 'Handling Negatives', 'Where the signs go wrong.'],
      ['q4-6', 'The ± Symbol', 'Why there are two answers.'],
      ['q4-7', 'Simplifying Roots', 'Tidying √72 and friends.'],
      ['q4-8', 'Putting It Together', 'A full solution, unaided.', 'practice'],
    ],
  },

  // --- Stage 5: The Discriminant -------------------------------------------
  q5: {
    defaultKind: 'learn',
    levels: [
      ['q5-1', 'Discovering D', 'D = b² − 4ac.'],
      ['q5-2', 'When D > 0', 'Two real roots.'],
      ['q5-3', 'When D = 0', 'One repeated root.'],
      ['q5-4', 'When D < 0', 'No real roots.'],
      ['q5-5', 'How Many Solutions?', 'Counting without solving.', 'practice'],
      ['q5-6', 'Using D First', 'Predicting the kind of answer.', 'practice'],
    ],
  },

  // --- Stage 6: Complete Solutions -----------------------------------------
  q6: {
    defaultKind: 'practice',
    levels: [
      ['q6-1', 'Positive Discriminant', 'Two roots, in full.'],
      ['q6-2', 'Zero Discriminant', 'The repeated case.'],
      ['q6-3', 'Negative Discriminant', 'Recognising "no real solution".'],
      ['q6-4', 'Fractions in the Formula', 'When the answer is not whole.'],
      ['q6-5', 'Large Numbers', 'Keeping the arithmetic straight.'],
      ['q6-6', 'Sign Traps', 'Negative leading coefficients.'],
      ['q6-7', 'From Scratch', 'No scaffolding this time.'],
    ],
  },

  // --- Stage 7: Practice Block II ------------------------------------------
  q7: {
    defaultKind: 'practice',
    levels: [
      ['q7-1', 'Formula Drill', 'Speed and accuracy.'],
      ['q7-2', 'Mixed Signs', 'Every combination.'],
      ['q7-3', 'Large Coefficients', 'Awkward numbers.'],
      ['q7-4', 'Fractional Roots', 'Answers that are not integers.'],
      ['q7-5', 'Choose Your Method', 'Factoring or formula.'],
      ['q7-6', 'Fastest Method', 'Reward for spotting the shortcut.'],
    ],
  },

  // --- Stage 8: Graphical Meaning ------------------------------------------
  q8: {
    defaultKind: 'learn',
    levels: [
      ['q8-1', 'Quadratic Functions', 'From equation to graph.'],
      ['q8-2', 'Parabolas', 'The shape and its properties.'],
      ['q8-3', 'Roots as x-Intercepts', 'Where the curve meets the axis.'],
      ['q8-4', 'Solve Graphically', 'Reading answers off a picture.', 'practice'],
      ['q8-5', 'Changing Coefficients', 'What a, b and c do to the curve.'],
      ['q8-6', 'Graphical Discriminant', 'Seeing the number of roots.'],
    ],
  },

  // --- Stage 9: Vieta's Formulas -------------------------------------------
  q9: {
    defaultKind: 'learn',
    levels: [
      ['q9-1', 'Sum of Roots', 'x₁ + x₂ = −b/a.'],
      ['q9-2', 'Product of Roots', 'x₁x₂ = c/a.'],
      ['q9-3', 'Find Roots with Vieta', 'Two numbers, a sum and a product.', 'practice'],
      ['q9-4', 'Constructing Quadratics', 'Building an equation from its roots.'],
      ['q9-5', 'Missing Coefficient', 'One root known, find the rest.', 'practice'],
      ['q9-6', 'Vieta vs Formula', 'Picking the quicker route.', 'practice'],
    ],
  },

  // --- Stage 10: Completing the Square -------------------------------------
  q10: {
    defaultKind: 'learn',
    levels: [
      ['q10-1', 'Perfect Squares', 'Recognising x² + 6x + 9.'],
      ['q10-2', 'Completing the Square', 'Making one on purpose.'],
      ['q10-3', 'Solving This Way', 'A third route to the roots.', 'practice'],
      ['q10-4', 'Compare Methods', 'The same equation, two ways.', 'practice'],
    ],
  },

  // --- Stage 11: Vertex & Geometry -----------------------------------------
  q11: {
    defaultKind: 'learn',
    levels: [
      ['q11-1', 'The Vertex', 'The turning point.'],
      ['q11-2', 'Axis of Symmetry', 'The mirror line.'],
      ['q11-3', 'Maximum & Minimum', 'The best or worst value.'],
      ['q11-4', 'Vertex Form', 'y = a(x − h)² + k.'],
    ],
  },

  // --- Stage 12: Applications ----------------------------------------------
  q12: {
    defaultKind: 'apply',
    levels: [
      ['q12-1', 'Story to Equation', 'Turning words into symbols.'],
      ['q12-2', 'Area Problems', 'Rectangles and their sides.'],
      ['q12-3', 'Geometry', 'Squares, lengths and areas.'],
      ['q12-4', 'Projectile Motion', 'Things thrown into the air.'],
      ['q12-5', 'Revenue & Profit', 'Where a business breaks even.'],
      ['q12-6', 'Architecture', 'Arches and spans.'],
    ],
  },

  // --- Stage 14: Mastery ---------------------------------------------------
  q13: {
    defaultKind: 'practice',
    levels: [
      ['q13-1', 'Mixed Basic', 'Anything from the early stages.'],
      ['q13-2', 'Mixed Formula', 'Anything the formula solves.'],
      ['q13-3', 'Choose Your Method', 'Fastest route wins.'],
      ['q13-4', 'Spot the Mistake', 'Find the error in the working.'],
      ['q13-5', 'Complete the Step', 'Fill in what is missing.'],
      ['q13-6', 'Solve From Scratch', 'No help at all.'],
      ['q13-7', 'Mixed Word Problems', 'Real situations, mixed methods.', 'apply'],
    ],
  },

  // --- Stage 15: Hard Levels -----------------------------------------------
  q14: {
    defaultKind: 'challenge',
    levels: [
      ['q14-1', 'Parameter Basics', 'For which k are there two roots?'],
      ['q14-2', 'Parameters & D', 'Conditions on the discriminant.'],
      ['q14-3', 'Root Relationships', 'Building from known roots.'],
      ['q14-4', 'Symmetry Problems', 'Axis from the roots.'],
      ['q14-5', 'Min / Max Conditions', 'Smallest k that still works.'],
      ['q14-6', 'Quadratic Inequalities', 'Where the curve sits below zero.'],
      ['q14-7', 'Parametric Equations', 'When a itself is unknown.'],
      ['q14-8', 'Two Quadratics', 'Equations that share a root.'],
    ],
  },

  // --- Stage 16: Olympiad --------------------------------------------------
  q15: {
    defaultKind: 'challenge',
    levels: [
      ['q15-1', 'Clever Factoring', 'x⁴ − 5x² + 4 = 0.'],
      ['q15-2', 'Substitution', 'Hiding a quadratic inside a quartic.'],
      ['q15-3', 'Symmetric Forms', 'x + 1/x and its relatives.'],
      ['q15-4', 'Root Conditions', 'Both roots positive.'],
      ['q15-5', 'Quadratic Inequality', 'Solution sets, precisely.'],
      ['q15-6', 'Geometry & Quadratics', 'Area and diagonal together.'],
      ['q15-7', 'Nested Problems', 'Roots that differ by one.'],
      ['q15-8', 'Olympiad Challenge', 'The full test of everything.'],
    ],
  },

  // --- Stage 17: Exams -----------------------------------------------------
  q16: {
    defaultKind: 'exam',
    levels: [
      ['q16-1', 'Exam 1 — Foundations', 'Standard form, coefficients, factoring.'],
      ['q16-2', 'Exam 2 — Formula', 'Substitution, signs, discriminant.'],
      ['q16-3', 'Exam 3 — Methods', 'Choose the best approach.'],
      ['q16-4', 'Exam 4 — Applications', 'Word problems under assessment.'],
      ['q16-5', 'Exam 5 — Mastery', 'Mixed course problems.'],
      ['q16-6', 'Final Quadratic Trial', 'No hints. Three lives.'],
    ],
  },
};

export const LEVELS: Level[] = Object.entries(LEVEL_SPECS).flatMap(
  ([sectionId, { defaultKind, levels }]) =>
    levels.map(([id, title, subtitle, kind], i) => {
      const k = kind ?? defaultKind;
      return {
        id,
        sectionId,
        title,
        subtitle,
        order: i + 1,
        kind: k,
        rewardPi: REWARDS[k].pi,
        rewardXp: REWARDS[k].xp,
      };
    }),
);

// --- lookups ---------------------------------------------------------------

export const getWorld = (id: string) => WORLDS.find((w) => w.id === id);
export const getSection = (id: string) => SECTIONS.find((s) => s.id === id);
export const getLevel = (id: string) => LEVELS.find((l) => l.id === id);

export const sectionsOfWorld = (worldId: string) =>
  SECTIONS.filter((s) => s.worldId === worldId).sort((a, b) => a.order - b.order);

export const levelsOfSection = (sectionId: string) =>
  LEVELS.filter((l) => l.sectionId === sectionId).sort((a, b) => a.order - b.order);

export const levelsOfWorld = (worldId: string) =>
  sectionsOfWorld(worldId).flatMap((s) => levelsOfSection(s.id));

/**
 * Each world has its own ordered spine, and unlocking walks *that* — not one
 * global list. Foundations is explicitly optional (Stage 0, for learners who
 * want the run-up), so it must never gate the quadratics course. Within a world
 * the order still runs straight through section boundaries, so there is always
 * exactly one next level.
 */
const SPINES = new Map<string, Level[]>(
  WORLDS.filter((w) => w.available).map((w) => [w.id, levelsOfWorld(w.id)]),
);

export const worldIdOfLevel = (level: Level): string | undefined =>
  getSection(level.sectionId)?.worldId;

export const spineOfWorld = (worldId: string): Level[] => SPINES.get(worldId) ?? [];

/** Every level in every available world, worlds in order. */
export const ORDERED_LEVELS: Level[] = WORLDS.filter((w) => w.available)
  .sort((a, b) => a.order - b.order)
  .flatMap((w) => levelsOfWorld(w.id));
