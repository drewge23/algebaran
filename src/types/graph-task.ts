import type { FunctionDef, Pt, Viewport } from '@/lib/graph';

/**
 * A graph exercise, expressed as data.
 *
 * The point of this shape is that adding a new graph lesson or mini-game round
 * should mean writing a `GraphTask`, never editing the graph component. Each
 * kind names an interaction the canvas already supports.
 */
export type GraphTaskKind =
  | 'plot-point' // tap the plane at a coordinate
  | 'plot-roots' // tap every x-intercept
  | 'find-vertex' // tap the turning point
  | 'parameters' // move a, b, c until a condition holds
  | 'identify'; // read the picture, then choose

export interface GraphTarget extends Pt {
  /** Hit radius in graph units; defaults to the task tolerance. */
  radius?: number;
  label?: string;
}

export interface GraphTask {
  kind: GraphTaskKind;
  prompt: string;
  /** Curve under discussion, where the task has one. */
  fn?: FunctionDef;
  /** Extra curves drawn alongside it — comparisons, a target shape. */
  extraFns?: { fn: FunctionDef; role?: 'ghost' | 'target' }[];
  /** Points drawn before the learner does anything. */
  given?: (Pt & { label?: string })[];
  /** For `plot-point`: where the point belongs. */
  expected?: Pt;
  targets?: GraphTarget[];
  viewport?: Viewport;
  /** Grid snapping in graph units; 0 disables it. */
  snapStep?: number;
  /** Match tolerance in graph units. */
  tolerance?: number;
  /** For `parameters`: starting coefficients and what counts as solved. */
  start?: { a: number; b: number; c: number };
  goal?: { kind: 'match-function'; fn: FunctionDef } | { kind: 'hit-targets' };
  /** For `identify`: the choices and which one is right. */
  options?: string[];
  correctIndex?: number;
  hint?: string;
  explanation?: string;
}
