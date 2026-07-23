/**
 * Date helpers used by the streak system. Kept pure (no React, no storage) so
 * they are trivially unit-testable.
 */

/** Returns today's date as an ISO calendar date string: `YYYY-MM-DD`. */
export function todayISO(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Whole-day difference between two ISO calendar dates (`b - a`), ignoring time
 * of day. Returns a positive number when `b` is after `a`.
 */
export function daysBetweenISO(a: string, b: string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const da = Date.parse(`${a}T00:00:00Z`);
  const db = Date.parse(`${b}T00:00:00Z`);
  return Math.round((db - da) / msPerDay);
}

/**
 * Given the previous active date and "today", returns how the streak should
 * change:
 *  - `same`        → already counted today, no change
 *  - `increment`   → yesterday, streak continues
 *  - `reset`       → a gap (or first ever activity), streak restarts at 1
 */
export function streakTransition(
  lastActiveISODate: string | null,
  today: string,
): 'same' | 'increment' | 'reset' {
  if (!lastActiveISODate) return 'reset';
  const delta = daysBetweenISO(lastActiveISODate, today);
  if (delta <= 0) return 'same';
  if (delta === 1) return 'increment';
  return 'reset';
}
