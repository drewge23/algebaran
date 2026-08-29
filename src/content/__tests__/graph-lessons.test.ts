import { describe, expect, test } from 'vitest';

import { GRAPH_LESSONS } from '@/content/graph-lessons';
import { LESSON_STEPS } from '@/content/lesson-steps';
import { LEVELS } from '@/content/curriculum';
import { PROJECT } from '@/content/rocket';
import { DEFAULT_VIEWPORT, evaluate, roots, validateTrajectory, vertex } from '@/lib/graph';
import type { LessonStep } from '@/types/content';
import type { GraphTask } from '@/types/graph-task';

/**
 * Authoring guards. A graph exercise can be wrong in ways that compile perfectly
 * — a point that is not on its curve, a vertex off the visible plane, a target
 * shape the sliders cannot reach — and the learner meets the mistake as an
 * unsolvable task. These checks fail instead.
 */

const collect = (id: string, steps: LessonStep[]) =>
  steps.flatMap((step, index) => (step.kind === 'graph' ? [{ id, index, task: step.task }] : []));

/** Every graph task anywhere in the content — lessons and project missions alike. */
const tasks: { id: string; index: number; task: GraphTask }[] = [
  ...Object.entries(LESSON_STEPS).flatMap(([id, steps]) => collect(id, steps)),
  ...PROJECT.systems.flatMap((system) =>
    system.missions.flatMap((mission) => collect(mission.id, mission.steps)),
  ),
];

/** The ranges the coefficient sliders actually offer (see GraphTaskView). */
const SLIDER = {
  a: { min: -3, max: 3, step: 0.5 },
  b: { min: -8, max: 8, step: 1 },
  c: { min: -8, max: 8, step: 1 },
};

const reachable = (value: number, { min, max, step }: { min: number; max: number; step: number }) =>
  value >= min && value <= max && Math.abs(value / step - Math.round(value / step)) < 1e-9;

describe('graph lesson content', () => {
  test('every lesson id exists in the curriculum', () => {
    const ids = new Set(LEVELS.map((l) => l.id));
    for (const id of Object.keys(GRAPH_LESSONS)) expect(ids, id).toContain(id);
  });

  test('there is at least one graph task in every graph lesson', () => {
    for (const [id, steps] of Object.entries(GRAPH_LESSONS)) {
      expect(
        steps.some((s) => s.kind === 'graph'),
        id,
      ).toBe(true);
    }
  });

  test.each(tasks)('$id step $index is solvable', ({ task }) => {
    const view = task.viewport ?? DEFAULT_VIEWPORT;
    const inView = (x: number, y: number) =>
      x >= view.xMin && x <= view.xMax && y >= view.yMin && y <= view.yMax;

    switch (task.kind) {
      case 'plot-point': {
        expect(task.expected).toBeDefined();
        const p = task.expected!;
        expect(inView(p.x, p.y)).toBe(true);
        // If a curve is shown, the point being asked for must be on it.
        if (task.fn) expect(evaluate(task.fn, p.x)).toBeCloseTo(p.y);
        break;
      }
      case 'plot-roots': {
        expect(task.fn).toBeDefined();
        const rs = roots(task.fn!);
        expect(rs.length).toBeGreaterThan(0);
        for (const r of rs) expect(inView(r, 0)).toBe(true);
        break;
      }
      case 'find-vertex': {
        expect(task.fn).toBeDefined();
        const v = vertex(task.fn!);
        expect(v).not.toBeNull();
        expect(inView(v!.x, v!.y)).toBe(true);
        break;
      }
      case 'parameters': {
        expect(task.start).toBeDefined();
        expect(task.goal).toBeDefined();
        if (task.goal?.kind === 'match-function') {
          const goal = task.goal.fn;
          expect(goal.kind).toBe('quadratic');
          if (goal.kind === 'quadratic') {
            expect(reachable(goal.a, SLIDER.a)).toBe(true);
            expect(reachable(goal.b, SLIDER.b)).toBe(true);
            expect(reachable(goal.c, SLIDER.c)).toBe(true);
            // A goal identical to the start is solved before the learner touches it.
            expect(task.start).not.toEqual({ a: goal.a, b: goal.b, c: goal.c });
          }
        } else {
          expect(task.targets?.length ?? 0).toBeGreaterThan(0);
          for (const p of task.targets!) expect(inView(p.x, p.y)).toBe(true);
          // A hand-written target set can be impossible; check some setting works.
          let solvable = false;
          for (let a = -3; a <= 3 && !solvable; a += 0.5) {
            for (let b = -8; b <= 8 && !solvable; b += 1) {
              for (let c = -8; c <= 8 && !solvable; c += 1) {
                if (validateTrajectory({ kind: 'quadratic', a, b, c }, task.targets!))
                  solvable = true;
              }
            }
          }
          expect(solvable).toBe(true);
        }
        break;
      }
      case 'identify': {
        expect(task.options?.length ?? 0).toBeGreaterThanOrEqual(2);
        expect(task.correctIndex).toBeDefined();
        expect(task.correctIndex!).toBeGreaterThanOrEqual(0);
        expect(task.correctIndex!).toBeLessThan(task.options!.length);
        expect(new Set(task.options).size).toBe(task.options!.length);
        break;
      }
    }
  });
});
