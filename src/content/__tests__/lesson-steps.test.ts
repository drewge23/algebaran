import { describe, expect, test } from 'vitest';

import { LESSON_STEPS } from '@/content/lesson-steps';
import { WORK_NAMES } from '@/content/work-names';
import { PROJECT } from '@/content/rocket';
import { checkAnswer, checkRoots, checkWork, normalizeEquation } from '@/lib/answer';
import type { LessonStep } from '@/types/content';

/**
 * Authoring guards for the typed step kinds. A multi-line step can be wrong in
 * ways that compile perfectly — an answer its own checker rejects, or a line
 * labelled with a name the keyboard cannot produce — and the learner meets the
 * mistake as an unanswerable question. These checks fail instead.
 */

/** Every authored step anywhere in the content — lessons and project missions. */
const steps: { id: string; index: number; step: LessonStep }[] = [
  ...Object.entries(LESSON_STEPS),
  ...PROJECT.systems.flatMap((system) =>
    system.missions.map((mission) => [mission.id, mission.steps] as const),
  ),
].flatMap(([id, list]) => list.map((step, index) => ({ id, index, step })));

const of = <K extends LessonStep['kind']>(kind: K) =>
  steps.flatMap((entry) =>
    entry.step.kind === kind
      ? [{ ...entry, step: entry.step as Extract<LessonStep, { kind: K }> }]
      : [],
  );

describe('multi-blank steps', () => {
  test('each blank is answered by the answer authored for it', () => {
    for (const { id, index, step } of of('fields')) {
      for (const blank of step.blanks) {
        expect(
          checkAnswer(blank.accepted[0], blank.accepted),
          `${id} step ${index}: ${blank.label}`,
        ).toBe(true);
      }
    }
  });

  test('blanks are distinctly labelled, so a marked line is identifiable', () => {
    for (const { id, index, step } of of('fields')) {
      const labels = step.blanks.map((b) => b.label);
      expect(new Set(labels).size, `${id} step ${index}`).toBe(labels.length);
    }
  });
});

describe('blank-worksheet steps', () => {
  test('the authored working is accepted, and in any order', () => {
    for (const { id, index, step } of of('canvas')) {
      const lines = step.work.map((line) => ({ name: line.name[0], value: line.accepted[0] }));
      expect(checkWork(lines, step.work), `${id} step ${index}`).toBe(true);
      expect(checkWork([...lines].reverse(), step.work), `${id} step ${index} reversed`).toBe(true);
    }
  });

  test('every line is named with a key the learner actually has', () => {
    const typeable = WORK_NAMES.map(normalizeEquation);
    for (const { id, index, step } of of('canvas')) {
      for (const line of step.work) {
        expect(
          line.name.some((name) => typeable.includes(normalizeEquation(name))),
          `${id} step ${index}: "${line.name[0]}" is not on the keyboard`,
        ).toBe(true);
      }
    }
  });

  test('two lines never share a name, which would make the marking ambiguous', () => {
    for (const { id, index, step } of of('canvas')) {
      const names = step.work.map((line) => normalizeEquation(line.name[0]));
      expect(new Set(names).size, `${id} step ${index}`).toBe(names.length);
    }
  });

  test('the closing roots are accepted by their own checker', () => {
    for (const { id, index, step } of of('canvas')) {
      if (!step.roots) continue;
      expect(checkRoots([...step.roots], step.roots), `${id} step ${index}`).toBe(true);
    }
  });
});

describe('single-answer steps', () => {
  test('every authored answer passes its own check', () => {
    for (const { id, index, step } of of('input')) {
      expect(checkAnswer(step.accepted[0], step.accepted), `${id} step ${index}`).toBe(true);
    }
    for (const { id, index, step } of of('roots')) {
      expect(checkRoots([...step.roots], step.roots), `${id} step ${index}`).toBe(true);
    }
  });
});
