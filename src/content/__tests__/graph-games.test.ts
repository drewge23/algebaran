import { describe, expect, test } from 'vitest';

import { GRAPH_GAMES, GAME_FOR_LEVEL, ROUNDS_PER_RUN } from '@/content/graph-games';
import { LEVELS } from '@/content/curriculum';
import { DEFAULT_VIEWPORT, roots, validateTrajectory, vertex, type Viewport } from '@/lib/graph';
import { seededRandom } from '@/lib/random';
import type { GraphTask } from '@/types/graph-task';

/**
 * Procedural rounds cannot be proofread, so they are checked instead: every game
 * is run over many seeds and the whole difficulty ramp, and each round has to be
 * both answerable and visible. An unreachable target or a vertex off the edge of
 * the plane would otherwise reach a player as a round they simply cannot win.
 */

const SEEDS = 60;

/** The coefficient lattice the sliders expose (see GraphTaskView). */
function* lattice() {
  for (let a = -3; a <= 3; a += 0.5) {
    for (let b = -8; b <= 8; b += 1) {
      for (let c = -8; c <= 8; c += 1) yield { a, b, c };
    }
  }
}

/** True when some slider setting hits every target — i.e. the round is winnable. */
function hasTrajectorySolution(targets: GraphTask['targets']): boolean {
  for (const { a, b, c } of lattice()) {
    if (validateTrajectory({ kind: 'quadratic', a, b, c }, targets ?? [])) return true;
  }
  return false;
}

const inside = (view: Viewport, x: number, y: number) =>
  x >= view.xMin && x <= view.xMax && y >= view.yMin && y <= view.yMax;

describe('graph mini-games', () => {
  test('every game level points at a real game, and every game id is unique', () => {
    const ids = GRAPH_GAMES.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
    const levelIds = new Set(LEVELS.map((l) => l.id));
    for (const [levelId, gameId] of Object.entries(GAME_FOR_LEVEL)) {
      expect(levelIds, levelId).toContain(levelId);
      expect(ids, gameId).toContain(gameId);
    }
  });

  describe.each(GRAPH_GAMES.map((g) => [g.id, g] as const))('%s', (_id, game) => {
    // The runner walks difficulty 0 → 1 across a run; check the same values.
    const rounds = Array.from({ length: SEEDS }, (_, s) =>
      Array.from({ length: ROUNDS_PER_RUN }, (_, r) =>
        game.build(seededRandom(`test:${s}:${r}`), r / (ROUNDS_PER_RUN - 1)),
      ),
    ).flat();

    test('every generated round is answerable and fits on the plane', () => {
      for (const task of rounds) {
        const view = task.viewport ?? DEFAULT_VIEWPORT;
        expect(task.prompt.length).toBeGreaterThan(0);

        switch (task.kind) {
          case 'plot-roots': {
            const rs = roots(task.fn!);
            expect(rs.length).toBeGreaterThan(0);
            for (const r of rs) expect(inside(view, r, 0)).toBe(true);
            break;
          }
          case 'find-vertex': {
            const v = vertex(task.fn!)!;
            expect(v).not.toBeNull();
            expect(inside(view, v.x, v.y)).toBe(true);
            break;
          }
          case 'plot-point':
            expect(inside(view, task.expected!.x, task.expected!.y)).toBe(true);
            break;
          case 'identify': {
            expect(task.options!.length).toBeGreaterThanOrEqual(3);
            expect(new Set(task.options).size).toBe(task.options!.length);
            expect(task.correctIndex!).toBeGreaterThanOrEqual(0);
            expect(task.correctIndex!).toBeLessThan(task.options!.length);
            for (const p of task.given ?? []) expect(inside(view, p.x, p.y)).toBe(true);
            break;
          }
          case 'parameters': {
            expect(task.start).toBeDefined();
            const goalFn = task.goal?.kind === 'match-function' ? task.goal.fn : null;
            if (goalFn) {
              expect(goalFn.kind).toBe('quadratic');
              if (goalFn.kind !== 'quadratic') break;
              expect(Math.abs(goalFn.a)).toBeLessThanOrEqual(3);
              expect(goalFn.a * 2).toBe(Math.round(goalFn.a * 2)); // on the 0.5 step
              expect(Math.abs(goalFn.b)).toBeLessThanOrEqual(8);
              expect(Math.abs(goalFn.c)).toBeLessThanOrEqual(8);
            } else {
              expect(task.targets!.length).toBeGreaterThan(0);
              for (const p of task.targets!) expect(inside(view, p.x, p.y)).toBe(true);
            }
            break;
          }
        }
      }
    });
  });

  // Solving by brute force over the slider lattice is slow, so the reachability
  // check runs over a smaller sample than the shape checks above.
  test('every Trajectory round can actually be hit with the sliders', () => {
    const game = GRAPH_GAMES.find((g) => g.id === 'trajectory')!;
    for (let s = 0; s < 12; s++) {
      for (let r = 0; r < ROUNDS_PER_RUN; r++) {
        const task = game.build(seededRandom(`hit:${s}:${r}`), r / (ROUNDS_PER_RUN - 1));
        expect(hasTrajectorySolution(task.targets), `seed ${s} round ${r}`).toBe(true);
      }
    }
  });
});
