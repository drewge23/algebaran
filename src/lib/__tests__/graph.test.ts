import { describe, expect, test } from 'vitest';

import {
  DEFAULT_VIEWPORT,
  discriminant,
  evaluate,
  functionsMatch,
  niceStep,
  roots,
  snapPoint,
  toMath,
  toSvg,
  validatePoint,
  validateRoot,
  validateRoots,
  validateTrajectory,
  validateVertex,
  vertex,
  type FunctionDef,
} from '@/lib/graph';

const parabola = (a: number, b: number, c: number): FunctionDef => ({ kind: 'quadratic', a, b, c });

describe('evaluation and shape', () => {
  test('evaluates quadratics and lines', () => {
    expect(evaluate(parabola(1, -5, 6), 2)).toBe(0);
    expect(evaluate({ kind: 'linear', m: 2, c: 1 }, 3)).toBe(7);
  });

  test('finds two, one or no real roots', () => {
    expect(roots(parabola(1, -5, 6))).toEqual([2, 3]);
    expect(roots(parabola(1, -6, 9))).toEqual([3]); // repeated root returned once
    expect(roots(parabola(1, 2, 5))).toEqual([]);
  });

  test('discriminant agrees with the root count', () => {
    expect(discriminant(parabola(1, -5, 6))).toBe(1);
    expect(discriminant(parabola(1, -6, 9))).toBe(0);
    expect(discriminant(parabola(1, 2, 5))).toBeLessThan(0);
  });

  test('finds the vertex, and none for a line', () => {
    expect(vertex(parabola(1, -6, 5))).toEqual({ x: 3, y: -4 });
    expect(vertex({ kind: 'linear', m: 1, c: 0 })).toBeNull();
  });
});

describe('viewport transforms', () => {
  test('maths and svg coordinates round-trip', () => {
    const p = { x: 2.5, y: -3.25 };
    const svg = toSvg(p, DEFAULT_VIEWPORT, 400, 400);
    const back = toMath(svg, DEFAULT_VIEWPORT, 400, 400);
    expect(back.x).toBeCloseTo(p.x);
    expect(back.y).toBeCloseTo(p.y);
  });

  test('y is flipped: higher maths values sit nearer the top', () => {
    const high = toSvg({ x: 0, y: 5 }, DEFAULT_VIEWPORT, 400, 400);
    const low = toSvg({ x: 0, y: -5 }, DEFAULT_VIEWPORT, 400, 400);
    expect(high.y).toBeLessThan(low.y);
  });

  test('the origin lands in the middle of a symmetric viewport', () => {
    expect(toSvg({ x: 0, y: 0 }, DEFAULT_VIEWPORT, 400, 400)).toEqual({ x: 200, y: 200 });
  });

  test('snapping pulls a sloppy tap onto the lattice', () => {
    expect(snapPoint({ x: 2.9, y: -1.1 }, 1)).toEqual({ x: 3, y: -1 });
  });

  test('grid spacing stays in a readable range', () => {
    for (const range of [4, 16, 40, 200]) {
      const step = niceStep(range);
      expect(range / step).toBeGreaterThanOrEqual(3);
      expect(range / step).toBeLessThanOrEqual(25);
    }
  });
});

describe('validation is mathematical, not pixel-perfect', () => {
  test('a near-enough point counts, a neighbouring lattice point does not', () => {
    expect(validatePoint({ x: 3.1, y: -1.95 }, { x: 3, y: -2 })).toBe(true);
    expect(validatePoint({ x: 4, y: -2 }, { x: 3, y: -2 })).toBe(false);
  });

  test('a root is accepted anywhere near a real root', () => {
    const fn = parabola(1, -5, 6);
    expect(validateRoot(2.05, fn)).toBe(true);
    expect(validateRoot(2.6, fn)).toBe(false);
  });

  test('both roots must be found, each exactly once', () => {
    const fn = parabola(1, -5, 6); // roots 2 and 3
    expect(
      validateRoots(
        [
          { x: 2, y: 0 },
          { x: 3, y: 0 },
        ],
        fn,
      ),
    ).toBe(true);
    expect(
      validateRoots(
        [
          { x: 3, y: 0 },
          { x: 2, y: 0 },
        ],
        fn,
      ),
    ).toBe(true); // order-free
    expect(
      validateRoots(
        [
          { x: 2, y: 0 },
          { x: 2, y: 0 },
        ],
        fn,
      ),
    ).toBe(false); // no duplicates
    expect(validateRoots([{ x: 2, y: 0 }], fn)).toBe(false); // must find both
  });

  test('a root off the x-axis is rejected', () => {
    expect(
      validateRoots(
        [
          { x: 2, y: 2 },
          { x: 3, y: 0 },
        ],
        parabola(1, -5, 6),
      ),
    ).toBe(false);
  });

  test('the vertex is checked against the real turning point', () => {
    const fn = parabola(1, -6, 5); // vertex (3, -4)
    expect(validateVertex({ x: 3, y: -4 }, fn)).toBe(true);
    expect(validateVertex({ x: 3, y: 0 }, fn)).toBe(false);
  });

  test('a trajectory passes when the curve reaches every target', () => {
    const fn = parabola(-1, 8, 0); // peak (4, 16)
    expect(validateTrajectory(fn, [{ x: 4, y: 16 }])).toBe(true);
    expect(validateTrajectory(fn, [{ x: 4, y: 10 }])).toBe(false);
    // Every target must be hit, not just one.
    expect(
      validateTrajectory(fn, [
        { x: 4, y: 16 },
        { x: 8, y: 5 },
      ]),
    ).toBe(false);
  });

  test('functions are compared by behaviour, not coefficients', () => {
    expect(functionsMatch(parabola(1, -4, 3), parabola(1, -4, 3))).toBe(true);
    expect(functionsMatch(parabola(1, -4, 3), parabola(1, -4, 3.05))).toBe(true);
    expect(functionsMatch(parabola(1, -4, 3), parabola(2, -4, 3))).toBe(false);
  });
});
