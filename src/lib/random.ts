/**
 * Randomness lives here (not inline in components) so React's render stays pure
 * and the React Compiler lint rules are satisfied.
 */

/** Inclusive random integer in the range [min, max]. */
export function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/**
 * Fisher–Yates shuffle, returning a new array so callers never mutate content
 * catalogues (which are module-level constants shared across renders).
 */
export function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
