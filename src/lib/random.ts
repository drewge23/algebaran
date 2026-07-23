/**
 * Randomness lives here (not inline in components) so React's render stays pure
 * and the React Compiler lint rules are satisfied.
 */

/** Inclusive random integer in the range [min, max]. */
export function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}
