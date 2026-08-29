/**
 * Graph mathematics — pure, so every graph interaction can be validated by
 * meaning rather than by pixels.
 *
 * Nothing here knows about SVG or React. A learner who places a point at
 * (2.03, −0.01) has found the root at (2, 0); a learner who draws a visually
 * similar curve with the wrong vertex has not. Tolerances are expressed in
 * graph units for exactly that reason.
 */

export interface Pt {
  x: number;
  y: number;
}

export interface Viewport {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export type FunctionDef =
  { kind: 'quadratic'; a: number; b: number; c: number } | { kind: 'linear'; m: number; c: number };

export const DEFAULT_VIEWPORT: Viewport = { xMin: -8, xMax: 8, yMin: -8, yMax: 8 };

// --- evaluation -------------------------------------------------------------

export function evaluate(fn: FunctionDef, x: number): number {
  return fn.kind === 'quadratic' ? fn.a * x * x + fn.b * x + fn.c : fn.m * x + fn.c;
}

export function discriminant(fn: FunctionDef): number | null {
  if (fn.kind !== 'quadratic') return null;
  return fn.b * fn.b - 4 * fn.a * fn.c;
}

/** Real roots, ascending. A repeated root is returned once. */
export function roots(fn: FunctionDef): number[] {
  if (fn.kind === 'linear') return fn.m === 0 ? [] : [-fn.c / fn.m];
  const { a, b, c } = fn;
  if (a === 0) return b === 0 ? [] : [-c / b];
  const d = b * b - 4 * a * c;
  if (d < 0) return [];
  if (d === 0) return [-b / (2 * a)];
  const sq = Math.sqrt(d);
  return [(-b - sq) / (2 * a), (-b + sq) / (2 * a)].sort((p, q) => p - q);
}

/** Turning point. Straight lines have none. */
export function vertex(fn: FunctionDef): Pt | null {
  if (fn.kind !== 'quadratic' || fn.a === 0) return null;
  const x = -fn.b / (2 * fn.a);
  return { x, y: evaluate(fn, x) };
}

/**
 * Samples the curve across the viewport for drawing. Points outside the visible
 * y-range are kept so the path leaves the frame cleanly rather than stopping at
 * the edge.
 */
export function samplePath(fn: FunctionDef, view: Viewport, steps = 160): Pt[] {
  const out: Pt[] = [];
  const dx = (view.xMax - view.xMin) / steps;
  for (let i = 0; i <= steps; i++) {
    const x = view.xMin + i * dx;
    out.push({ x, y: evaluate(fn, x) });
  }
  return out;
}

// --- viewport transforms ----------------------------------------------------

/** Graph coordinates → SVG coordinates (y flips: maths goes up, SVG goes down). */
export function toSvg(p: Pt, view: Viewport, width: number, height: number): Pt {
  return {
    x: ((p.x - view.xMin) / (view.xMax - view.xMin)) * width,
    y: height - ((p.y - view.yMin) / (view.yMax - view.yMin)) * height,
  };
}

/** SVG coordinates → graph coordinates. Used for taps and drags. */
export function toMath(p: Pt, view: Viewport, width: number, height: number): Pt {
  return {
    x: view.xMin + (p.x / width) * (view.xMax - view.xMin),
    y: view.yMin + ((height - p.y) / height) * (view.yMax - view.yMin),
  };
}

export function snap(value: number, step: number): number {
  return step <= 0 ? value : Math.round(value / step) * step;
}

export function snapPoint(p: Pt, step: number): Pt {
  return { x: snap(p.x, step), y: snap(p.y, step) };
}

/** Grid spacing that stays readable as the viewport changes. */
export function niceStep(range: number, target = 10): number {
  const raw = range / target;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10;
  return step * mag;
}

/** Zooms about the viewport centre, clamped so the axes stay usable. */
export function zoomViewport(view: Viewport, factor: number): Viewport {
  const cx = (view.xMin + view.xMax) / 2;
  const cy = (view.yMin + view.yMax) / 2;
  const halfW = ((view.xMax - view.xMin) / 2) * factor;
  const halfH = ((view.yMax - view.yMin) / 2) * factor;
  const clampedW = Math.min(60, Math.max(2, halfW));
  const clampedH = Math.min(60, Math.max(2, halfH));
  return {
    xMin: cx - clampedW,
    xMax: cx + clampedW,
    yMin: cy - clampedH,
    yMax: cy + clampedH,
  };
}

export function panViewport(view: Viewport, dx: number, dy: number): Viewport {
  return {
    xMin: view.xMin + dx,
    xMax: view.xMax + dx,
    yMin: view.yMin + dy,
    yMax: view.yMax + dy,
  };
}

// --- validation -------------------------------------------------------------

/**
 * All validators take a tolerance in graph units. The default of 0.35 is a
 * little under half a grid square: close enough that a deliberate tap on the
 * right intersection counts, far enough that the neighbouring lattice point
 * does not.
 */
export const DEFAULT_TOLERANCE = 0.35;

export function validatePoint(user: Pt, expected: Pt, tol = DEFAULT_TOLERANCE): boolean {
  return Math.abs(user.x - expected.x) <= tol && Math.abs(user.y - expected.y) <= tol;
}

/** True when the x lands on any real root of the function. */
export function validateRoot(userX: number, fn: FunctionDef, tol = DEFAULT_TOLERANCE): boolean {
  return roots(fn).some((r) => Math.abs(userX - r) <= tol);
}

/**
 * Every expected root found exactly once — so tapping the same intercept twice
 * does not pass a two-root question.
 */
export function validateRoots(userPoints: Pt[], fn: FunctionDef, tol = DEFAULT_TOLERANCE): boolean {
  const expected = roots(fn);
  if (userPoints.length !== expected.length) return false;
  const remaining = [...expected];
  for (const p of userPoints) {
    // Roots sit on the x-axis, so y must be near zero too.
    if (Math.abs(p.y) > tol) return false;
    const idx = remaining.findIndex((r) => Math.abs(p.x - r) <= tol);
    if (idx === -1) return false;
    remaining.splice(idx, 1);
  }
  return remaining.length === 0;
}

export function validateVertex(user: Pt, fn: FunctionDef, tol = DEFAULT_TOLERANCE): boolean {
  const v = vertex(fn);
  return v ? validatePoint(user, v, tol) : false;
}

/**
 * A trajectory counts as hitting a target when it passes within the target's
 * radius — compared as a curve, never as a drawing.
 */
export function validateTrajectory(
  fn: FunctionDef,
  targets: (Pt & { radius?: number })[],
  defaultRadius = 0.6,
): boolean {
  return targets.every((target) => {
    const radius = target.radius ?? defaultRadius;
    return Math.abs(evaluate(fn, target.x) - target.y) <= radius;
  });
}

/**
 * Compares two functions by what they mean rather than their coefficients, so a
 * learner who reaches the right curve by a different route still passes.
 */
export function functionsMatch(a: FunctionDef, b: FunctionDef, tol = 0.15): boolean {
  const sampleXs = [-3, -1.5, 0, 1.5, 3];
  return sampleXs.every((x) => Math.abs(evaluate(a, x) - evaluate(b, x)) <= tol);
}
