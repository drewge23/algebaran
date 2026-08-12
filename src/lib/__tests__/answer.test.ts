import { describe, expect, test } from 'vitest';

import { checkAnswer, normalizeEquation } from '@/lib/answer';

describe('answer normalisation', () => {
  test('normalises case, spaces, dashes and superscripts', () => {
    expect(normalizeEquation('X² + 3x − 10 = 0')).toBe('x^2+3x-10=0');
    expect(normalizeEquation('x^2 + 3x - 10 = 0')).toBe('x^2+3x-10=0');
  });

  test('strips implicit multiplication marks', () => {
    expect(normalizeEquation('2·x² + 4*x = 0')).toBe('2x^2+4x=0');
  });

  test('checkAnswer accepts any equivalent form in the accepted list', () => {
    const accepted = ['x²+3x−10=0'];
    expect(checkAnswer('x^2+3x-10=0', accepted)).toBe(true);
    expect(checkAnswer('X² + 3X − 10 = 0', accepted)).toBe(true);
    expect(checkAnswer('x²-3x-10=0', accepted)).toBe(false);
  });

  test('checkAnswer rejects empty input', () => {
    expect(checkAnswer('   ', ['x=0'])).toBe(false);
  });
});
