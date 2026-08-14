import { describe, expect, test } from 'vitest';

import { randomInt, shuffle } from '@/lib/random';

describe('random helpers', () => {
  test('randomInt stays within the inclusive range', () => {
    for (let i = 0; i < 200; i++) {
      const n = randomInt(3, 7);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(7);
      expect(Number.isInteger(n)).toBe(true);
    }
  });

  test('randomInt can return both endpoints', () => {
    const seen = new Set(Array.from({ length: 300 }, () => randomInt(0, 1)));
    expect(seen).toEqual(new Set([0, 1]));
  });

  test('shuffle keeps every element exactly once', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = shuffle(input);
    expect(out).toHaveLength(input.length);
    expect([...out].sort((a, b) => a - b)).toEqual(input);
  });

  test('shuffle does not mutate its input', () => {
    const input = [1, 2, 3, 4, 5];
    const copy = [...input];
    shuffle(input);
    expect(input).toEqual(copy);
  });
});
