/**
 * Pure economy math for Algebaran's gamification loop: XP → level curve, and
 * the Stardust income multiplier granted by owned collectables/skins.
 *
 * Design intent (see the plan): "all collectables and skins add a multiplier to
 * the user's income". We model that as a base of 1.0 plus the sum of each owned
 * item's multiplier contribution.
 */

/** XP required to advance *from* the given level to the next one. */
export function xpForLevel(level: number): number {
  // Gentle quadratic-ish curve: 100, 140, 180, ... keeps early levels snappy.
  return 100 + (level - 1) * 40;
}

/** Total cumulative XP needed to *reach* the start of a given level. */
export function cumulativeXpForLevel(level: number): number {
  let total = 0;
  for (let l = 1; l < level; l++) total += xpForLevel(l);
  return total;
}

/** Derives the current level (1-indexed) from a total XP amount. */
export function levelForXp(xp: number): number {
  let level = 1;
  let remaining = xp;
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level += 1;
  }
  return level;
}

/** Progress (0..1) toward the next level, given total XP. */
export function levelProgress(xp: number): number {
  const level = levelForXp(xp);
  const into = xp - cumulativeXpForLevel(level);
  return Math.min(1, Math.max(0, into / xpForLevel(level)));
}

/**
 * Combines individual item multiplier contributions into a total income
 * multiplier. Base income is 1.0 (no items).
 */
export function computeMultiplier(itemContributions: number[]): number {
  const bonus = itemContributions.reduce((sum, m) => sum + m, 0);
  return Number((1 + bonus).toFixed(2));
}

/** Applies an income multiplier to a base reward, rounded to a whole number. */
export function applyMultiplier(base: number, multiplier: number): number {
  return Math.round(base * multiplier);
}
