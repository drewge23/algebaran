import { describe, expect, test } from 'vitest';

import { daysBetweenISO, streakTransition, todayISO } from '@/lib/date';

describe('date + streak logic', () => {
  test('todayISO formats as YYYY-MM-DD', () => {
    expect(todayISO(new Date(2026, 6, 22, 10, 30))).toBe('2026-07-22');
    expect(todayISO(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  test('daysBetweenISO counts whole calendar days', () => {
    expect(daysBetweenISO('2026-07-22', '2026-07-22')).toBe(0);
    expect(daysBetweenISO('2026-07-21', '2026-07-22')).toBe(1);
    expect(daysBetweenISO('2026-07-22', '2026-07-25')).toBe(3);
  });

  test('streakTransition handles first activity, same day, continuation and gaps', () => {
    expect(streakTransition(null, '2026-07-22')).toBe('reset');
    expect(streakTransition('2026-07-22', '2026-07-22')).toBe('same');
    expect(streakTransition('2026-07-21', '2026-07-22')).toBe('increment');
    expect(streakTransition('2026-07-19', '2026-07-22')).toBe('reset');
  });
});
