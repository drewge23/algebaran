import { describe, expect, test } from 'vitest';

import { checkAnswer, checkRoots, checkWork, matchWork, normalizeEquation } from '@/lib/answer';

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

describe('root checking', () => {
  test('accepts the roots in either order', () => {
    expect(checkRoots(['2', '−1'], ['2', '−1'])).toBe(true);
    expect(checkRoots(['−1', '2'], ['2', '−1'])).toBe(true);
  });

  test('accepts equivalent notations for a root', () => {
    expect(checkRoots(['-1', '2'], ['−1', '2'])).toBe(true);
  });

  test('rejects a repeated root when two distinct ones are expected', () => {
    expect(checkRoots(['2', '2'], ['2', '−1'])).toBe(false);
  });

  test('accepts a genuine double root', () => {
    expect(checkRoots(['3', '3'], ['3', '3'])).toBe(true);
  });

  test('rejects wrong, blank or mismatched-length answers', () => {
    expect(checkRoots(['5', '−1'], ['2', '−1'])).toBe(false);
    expect(checkRoots(['2', '  '], ['2', '−1'])).toBe(false);
    expect(checkRoots(['2'], ['2', '−1'])).toBe(false);
  });
});

describe('worked solutions', () => {
  const method = [
    { name: ['a'], accepted: ['2'] },
    { name: ['b'], accepted: ['−8'] },
    { name: ['D'], accepted: ['16'] },
  ];

  test('accepts the lines in any order', () => {
    const lines = [
      { name: 'D', value: '16' },
      { name: 'b', value: '-8' },
      { name: 'a', value: '2' },
    ];
    expect(checkWork(lines, method)).toBe(true);
  });

  test('a right value under the wrong name is not the right line', () => {
    const lines = [
      { name: 'a', value: '2' },
      { name: 'c', value: '−8' },
      { name: 'D', value: '16' },
    ];
    expect(checkWork(lines, method)).toBe(false);
  });

  test('the same line twice cannot answer two steps', () => {
    const lines = [
      { name: 'a', value: '2' },
      { name: 'a', value: '2' },
      { name: 'a', value: '2' },
    ];
    expect(checkWork(lines, method)).toBe(false);
  });

  test('matchWork names the line that answered each step, and −1 for the rest', () => {
    const lines = [
      { name: 'a', value: '2' },
      { name: 'b', value: '8' }, // sign dropped
      { name: 'D', value: '16' },
    ];
    expect(matchWork(lines, method)).toEqual([0, -1, 2]);
    expect(checkWork(lines, method)).toBe(false);
  });

  test('subscripts and plain digits name the same root', () => {
    expect(checkWork([{ name: 'x1', value: '3' }], [{ name: ['x₁'], accepted: ['3'] }])).toBe(true);
  });
});
