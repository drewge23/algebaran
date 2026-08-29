import { describe, expect, test } from 'vitest';

import { ACHIEVEMENTS } from '@/content/achievements';
import { ALL_MISSIONS, PROJECT, getSystem } from '@/content/rocket';

/**
 * Shape guards for the workshop project. The rocket art has one frame per build
 * stage and the screen indexes into it, so the stage count is not a free
 * parameter — changing it without changing the art leaves the ship half drawn.
 */
describe('REACH ALGEbaran', () => {
  test('is five stages of three missions', () => {
    expect(PROJECT.systems).toHaveLength(5);
    for (const stage of PROJECT.systems) {
      expect(stage.missions, stage.id).toHaveLength(3);
    }
    expect(ALL_MISSIONS).toHaveLength(15);
  });

  test('mission ids are unique', () => {
    const ids = ALL_MISSIONS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('every prerequisite names a real stage, and the chain has a start', () => {
    const starts = PROJECT.systems.filter((s) => s.requires.length === 0);
    expect(starts.length).toBeGreaterThan(0);
    for (const stage of PROJECT.systems) {
      for (const id of stage.requires)
        expect(getSystem(id), `${stage.id} requires ${id}`).toBeDefined();
    }
  });

  test('rewards climb within a stage and across the project', () => {
    for (const stage of PROJECT.systems) {
      const pi = stage.missions.map((m) => m.rewardPi);
      expect(
        [...pi].sort((a, b) => a - b),
        stage.id,
      ).toEqual(pi);
    }
    const last = ALL_MISSIONS[ALL_MISSIONS.length - 1];
    const most = Math.max(...ALL_MISSIONS.map((m) => m.rewardPi));
    // The final mission is the hardest thing in the project, so it pays the most.
    expect(last.rewardPi).toBe(most);
  });

  test('every mission has something to answer, not just reading', () => {
    for (const mission of ALL_MISSIONS) {
      const answerable = mission.steps.filter((s) => s.kind !== 'info');
      expect(answerable.length, mission.id).toBeGreaterThan(0);
    }
  });

  test('finishing the project unlocks exactly one achievement', () => {
    const base = { lessonsCompleted: 0, streakCount: 0, level: 1, pi: 0 };
    const before = ACHIEVEMENTS.filter((a) => a.isUnlocked({ ...base, projectComplete: false }));
    const after = ACHIEVEMENTS.filter((a) => a.isUnlocked({ ...base, projectComplete: true }));
    expect(after.length - before.length).toBe(1);
  });
});
