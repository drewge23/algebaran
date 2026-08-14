import { describe, expect, test } from 'vitest';

import {
  applyRatingDelta,
  decideDuel,
  expectedScore,
  matchmakeRating,
  ratingDelta,
  RATING_FLOOR,
  simulateAnswer,
} from '@/lib/duel';
import { seededRandom } from '@/lib/random';

describe('elo rating', () => {
  test('equal ratings are an even match', () => {
    expect(expectedScore(1000, 1000)).toBeCloseTo(0.5);
  });

  test('beating a stronger opponent gains more than beating a weaker one', () => {
    const vsStronger = ratingDelta(1000, 1400, 'win');
    const vsWeaker = ratingDelta(1000, 600, 'win');
    expect(vsStronger).toBeGreaterThan(vsWeaker);
    expect(vsWeaker).toBeGreaterThan(0);
  });

  test('losing to a weaker opponent costs more than losing to a stronger one', () => {
    const toWeaker = ratingDelta(1000, 600, 'loss');
    const toStronger = ratingDelta(1000, 1400, 'loss');
    expect(toWeaker).toBeLessThan(toStronger);
    expect(toStronger).toBeLessThan(0);
  });

  test('a draw between equals moves nothing', () => {
    expect(ratingDelta(1000, 1000, 'draw')).toBe(0);
  });

  test('rating never falls below the floor', () => {
    expect(applyRatingDelta(RATING_FLOOR + 5, -500)).toBe(RATING_FLOOR);
  });
});

describe('duel resolution', () => {
  test('more correct answers wins regardless of time', () => {
    expect(decideDuel({ correct: 4, ms: 90_000 }, { correct: 3, ms: 1_000 })).toBe('win');
    expect(decideDuel({ correct: 2, ms: 1_000 }, { correct: 3, ms: 90_000 })).toBe('loss');
  });

  test('equal accuracy breaks on speed', () => {
    expect(decideDuel({ correct: 3, ms: 4_000 }, { correct: 3, ms: 9_000 })).toBe('win');
    expect(decideDuel({ correct: 3, ms: 9_000 }, { correct: 3, ms: 4_000 })).toBe('loss');
  });

  test('identical accuracy and time is a draw', () => {
    expect(decideDuel({ correct: 3, ms: 5_000 }, { correct: 3, ms: 5_000 })).toBe('draw');
  });
});

describe('opponent simulation', () => {
  test('a stronger opponent is more accurate and faster over many answers', () => {
    const run = (rating: number) => {
      const rng = seededRandom(`bench-${rating}`);
      let correct = 0;
      let ms = 0;
      for (let i = 0; i < 400; i++) {
        const a = simulateAnswer(rating, rng);
        if (a.correct) correct++;
        ms += a.ms;
      }
      return { correct, ms };
    };
    const weak = run(500);
    const strong = run(1900);
    expect(strong.correct).toBeGreaterThan(weak.correct);
    expect(strong.ms).toBeLessThan(weak.ms);
  });

  test('matchmaking stays near the player and above the floor', () => {
    const rng = seededRandom('match');
    for (let i = 0; i < 50; i++) {
      const r = matchmakeRating(1200, rng);
      expect(r).toBeGreaterThanOrEqual(RATING_FLOOR);
      expect(Math.abs(r - 1200)).toBeLessThanOrEqual(120);
    }
  });
});
