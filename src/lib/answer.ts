/**
 * Answer checking for typed-equation lessons. Kept pure and forgiving: we
 * normalise whitespace, dash variants, superscripts and implicit-multiplication
 * marks before comparing, so `X² + 3x − 10 = 0` and `x^2+3x-10=0` both match.
 *
 * NOTE: this is string-normalised equality, not algebraic equivalence
 * (reordered terms won't match). Authoring supplies the accepted forms; true
 * symbolic checking is a later enhancement.
 */
export function normalizeEquation(input: string): string {
  return input
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[−–—]/g, '-') // unicode minus / en/em dashes → hyphen
    .replace(/²/g, '^2')
    .replace(/[*·×]/g, ''); // implicit multiplication
}

export function checkAnswer(input: string, accepted: string[]): boolean {
  if (!input.trim()) return false;
  const normalized = normalizeEquation(input);
  return accepted.some((candidate) => normalizeEquation(candidate) === normalized);
}
