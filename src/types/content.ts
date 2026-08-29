import type { GraphTask } from '@/types/graph-task';

/**
 * Content model types. Lesson *authoring* (the actual problems, hints and
 * validators) lands in a later phase; for now these types describe the shape of
 * the catalogue that the navigation/economy scaffold renders against.
 */

/** The quadratic-equations curriculum, mirroring the project plan. */
export type SectionId =
  | 'why' // why do we need them in real life?
  | 'problem-to-eq' // text problem given → equation expected
  | 'coefficients' // reading a, b, c
  | 'no-b' // ax² + c = 0
  | 'no-c' // ax² + bx = 0
  | 'full' // ax² + bx + c = 0
  | 'vieta' // Vieta's formulas
  | 'beat-the-clock'; // timed bonus round

export interface Section {
  id: SectionId;
  title: string;
  blurb: string;
  /** Emoji/icon placeholder until the design phase supplies real art. */
  glyph: string;
}

/** The kind of interaction a lesson uses (drives which player we render). */
export type LessonKind = 'concept' | 'input-equation' | 'multiple-choice' | 'timed';

export interface Lesson {
  id: string;
  sectionId: SectionId;
  title: string;
  /** Ordering within the whole curriculum; also gates unlock order. */
  order: number;
  kind: LessonKind;
  /** Base rewards, before the income multiplier is applied. */
  rewardPi: number;
  rewardXp: number;
}

/**
 * A single interactive step inside a lesson. The lesson player renders one step
 * at a time. `equation` strings use real Unicode (e.g. `x²`, the minus sign `−`)
 * so they render without a math engine.
 *
 * Content is English-first; when we localise lessons, these strings move behind
 * a per-language loader (the UI chrome is already routed through i18n).
 */
export type LessonStep =
  | {
      kind: 'info';
      title?: string;
      equation?: string;
      body: string;
    }
  | {
      kind: 'choice';
      prompt: string;
      equation?: string;
      options: string[];
      correctIndex: number;
      explanation?: string;
      /** Revealed on demand via the Theory button, before answering. */
      hint?: string;
    }
  | {
      kind: 'input';
      prompt: string;
      /** Optional word problem shown above the prompt. */
      problem?: string;
      /** Acceptable answers; compared after normalisation (see lib/answer). */
      accepted: string[];
      explanation?: string;
      hint?: string;
    }
  | {
      /** An interactive graph exercise; see types/graph-task.ts. */
      kind: 'graph';
      task: GraphTask;
    }
  | {
      /** Solve for both roots — the x₁ / x₂ pair from the lesson design. */
      kind: 'roots';
      prompt: string;
      equation: string;
      /** The expected roots; matched order-insensitively (see checkRoots). */
      roots: [string, string];
      explanation?: string;
      hint?: string;
    }
  | {
      /**
       * Several labelled blanks answered in one pass — a = ▢, D = ▢, x₁ = ▢ —
       * so a whole method is worked through on one screen instead of one value
       * per step. Each blank is marked on its own.
       */
      kind: 'fields';
      prompt: string;
      equation?: string;
      blanks: { label: string; accepted: string[] }[];
      explanation?: string;
      hint?: string;
    }
  | {
      /**
       * A blank worksheet: the learner writes the left-hand side as well as the
       * right, so nothing on screen says which quantity to find first. That is
       * the difference from `fields` — here, naming the step is part of the
       * answer.
       */
      kind: 'canvas';
      prompt: string;
      equation?: string;
      /**
       * The lines the working must contain. Matched in any order: writing the
       * discriminant before the coefficients is a different route, not a
       * mistake. `name` lists acceptable spellings of the left-hand side.
       */
      work: { name: string[]; accepted: string[] }[];
      /** Closing lines whose labels are printed for them, e.g. x₁ / x₂. */
      roots?: [string, string];
      explanation?: string;
      hint?: string;
    };

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  glyph: string;
  cost: number;
  /** How much this item adds to the π income multiplier. */
  multiplier: number;
  /** avatar/collectable are cosmetic; consumable is one-shot; key unlocks a keyboard key. */
  kind: 'avatar' | 'collectable' | 'consumable' | 'key';
  /** For `key` items: the keyboard key id this purchase unlocks. */
  keyId?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  glyph: string;
}
