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
    }
  | {
      kind: 'input';
      prompt: string;
      /** Optional word problem shown above the prompt. */
      problem?: string;
      /** Acceptable answers; compared after normalisation (see lib/answer). */
      accepted: string[];
      explanation?: string;
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
