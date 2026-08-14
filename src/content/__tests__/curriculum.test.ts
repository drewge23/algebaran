import { describe, expect, test } from 'vitest';

import {
  LEVELS,
  ORDERED_LEVELS,
  SECTIONS,
  WORLDS,
  getSection,
  levelsOfSection,
  levelsOfWorld,
  sectionsOfWorld,
  spineOfWorld,
} from '@/content/curriculum';
import { statusForLevel } from '@/store/progressStore';
import { LESSON_STEPS } from '@/content/lesson-steps';

/**
 * Structural guards. With ~130 levels keyed by id from three places (the level
 * list, the authored steps, and the server's rewards seed), a typo is easy and
 * silent — a level would simply render the "not authored yet" placeholder for
 * ever. These tests make that loud.
 */
describe('curriculum structure', () => {
  test('level ids are unique', () => {
    const ids = LEVELS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('section ids are unique', () => {
    const ids = SECTIONS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('every level belongs to a real section', () => {
    const orphans = LEVELS.filter((l) => !getSection(l.sectionId));
    expect(orphans.map((o) => o.id)).toEqual([]);
  });

  test('every section belongs to a real world', () => {
    const worldIds = new Set(WORLDS.map((w) => w.id));
    const orphans = SECTIONS.filter((s) => !worldIds.has(s.worldId));
    expect(orphans.map((o) => o.id)).toEqual([]);
  });

  test('no section is empty', () => {
    const empty = SECTIONS.filter((s) => levelsOfSection(s.id).length === 0);
    expect(empty.map((s) => s.id)).toEqual([]);
  });

  test('every available world has content', () => {
    for (const world of WORLDS.filter((w) => w.available)) {
      expect(sectionsOfWorld(world.id).length).toBeGreaterThan(0);
      expect(levelsOfWorld(world.id).length).toBeGreaterThan(0);
    }
  });

  test('the spine covers exactly the available worlds', () => {
    const expected = WORLDS.filter((w) => w.available).flatMap((w) => levelsOfWorld(w.id));
    expect(ORDERED_LEVELS.map((l) => l.id)).toEqual(expected.map((l) => l.id));
  });

  test('every level carries a reward', () => {
    for (const level of LEVELS) {
      expect(level.rewardPi).toBeGreaterThan(0);
      expect(level.rewardXp).toBeGreaterThan(0);
    }
  });
});

describe('unlocking', () => {
  test('each available world opens at its own first level', () => {
    for (const world of WORLDS.filter((w) => w.available)) {
      const first = spineOfWorld(world.id)[0];
      expect(statusForLevel({}, first), world.id).toBe('available');
    }
  });

  test('optional Foundations does not gate the quadratics course', () => {
    // With nothing completed anywhere, the first quadratics level must still be
    // reachable — Foundations is preparation, not a prerequisite.
    const firstQuadratic = spineOfWorld('quadratics')[0];
    expect(statusForLevel({}, firstQuadratic)).toBe('available');
  });

  test('later levels stay locked until the previous one is done', () => {
    const spine = spineOfWorld('quadratics');
    expect(statusForLevel({}, spine[1])).toBe('locked');
    expect(statusForLevel({ [spine[0].id]: { stars: 3 } }, spine[1])).toBe('available');
  });

  test('progress in one world does not unlock another', () => {
    const quadratics = spineOfWorld('quadratics');
    const foundations = spineOfWorld('foundations');
    const done = Object.fromEntries(quadratics.map((l) => [l.id, { stars: 3 }]));
    // Foundations opens at its own first level regardless, but its second must
    // still require its own predecessor.
    expect(statusForLevel(done, foundations[1])).toBe('locked');
  });
});

describe('authored content', () => {
  test('every authored step set maps to a real level', () => {
    const known = new Set(LEVELS.map((l) => l.id));
    const dangling = Object.keys(LESSON_STEPS).filter((id) => !known.has(id));
    expect(dangling).toEqual([]);
  });

  test('choice steps point at an option that exists', () => {
    for (const [id, steps] of Object.entries(LESSON_STEPS)) {
      for (const step of steps) {
        if (step.kind === 'choice') {
          expect(step.correctIndex, `${id}`).toBeGreaterThanOrEqual(0);
          expect(step.correctIndex, `${id}`).toBeLessThan(step.options.length);
        }
      }
    }
  });

  test('answerable steps have something to accept', () => {
    for (const [id, steps] of Object.entries(LESSON_STEPS)) {
      for (const step of steps) {
        if (step.kind === 'input') expect(step.accepted.length, id).toBeGreaterThan(0);
        if (step.kind === 'roots') expect(step.roots.length, id).toBe(2);
      }
    }
  });
});
