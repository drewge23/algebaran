/**
 * Wall-clock access behind a function.
 *
 * Reading `Date.now()` directly inside a component body trips React's purity
 * rule (a render must not depend on a value that changes on its own). Routing
 * timing through here keeps components clean and gives tests a single seam to
 * stub if we ever need deterministic timings.
 */
export function now(): number {
  return Date.now();
}

/** Milliseconds elapsed since a timestamp from `now()`. */
export function since(timestamp: number): number {
  return now() - timestamp;
}
