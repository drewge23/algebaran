import { describe, expect, test } from 'vitest';

import {
  applyMultiplier,
  computeMultiplier,
  cumulativeXpForLevel,
  levelForXp,
  levelProgress,
  xpForLevel,
} from '@/lib/economy';

describe('economy', () => {
  test('level 1 until the first XP threshold', () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(99)).toBe(1);
    expect(levelForXp(xpForLevel(1))).toBe(2);
  });

  test('cumulative XP and levelForXp are inverse across levels', () => {
    for (let level = 1; level <= 8; level++) {
      expect(levelForXp(cumulativeXpForLevel(level))).toBe(level);
    }
  });

  test('level progress stays within [0, 1)', () => {
    for (const xp of [0, 50, 100, 239, 1000]) {
      const p = levelProgress(xp);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThan(1);
    }
  });

  test('multiplier is base 1 plus the sum of contributions', () => {
    expect(computeMultiplier([])).toBe(1);
    expect(computeMultiplier([0.1, 0.25])).toBe(1.35);
    expect(computeMultiplier([0.5])).toBe(1.5);
  });

  test('applyMultiplier scales and rounds a base reward', () => {
    expect(applyMultiplier(20, 1)).toBe(20);
    expect(applyMultiplier(20, 1.35)).toBe(27);
  });
});
