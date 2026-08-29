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
    .replace(/[₀-₉]/g, (d) => String(d.charCodeAt(0) - 0x2080)) // x₁ → x1
    .replace(/[*·×]/g, ''); // implicit multiplication
}

export function checkAnswer(input: string, accepted: string[]): boolean {
  if (!input.trim()) return false;
  const normalized = normalizeEquation(input);
  return accepted.some((candidate) => normalizeEquation(candidate) === normalized);
}

/**
 * Checks a set of roots (x₁, x₂) against the expected ones. Order does not
 * matter — x₁ = 2, x₂ = −1 is the same solution as the other way round — and
 * each expected root must be used exactly once, so answering the same root
 * twice is rejected.
 */
export function checkRoots(inputs: string[], accepted: string[]): boolean {
  if (inputs.length !== accepted.length) return false;
  if (inputs.some((i) => !i.trim())) return false;

  const remaining = accepted.map(normalizeEquation);
  for (const input of inputs.map(normalizeEquation)) {
    const at = remaining.indexOf(input);
    if (at === -1) return false;
    remaining.splice(at, 1);
  }
  return remaining.length === 0;
}

/** One line of a worked solution as the learner wrote it: `name = value`. */
export interface WorkLine {
  name: string;
  value: string;
}

/** A line the working must contain; `name` lists acceptable spellings of it. */
export interface WorkStep {
  name: string[];
  accepted: string[];
}

/** Does this line say what that step of the method asks for? */
export function checkWorkLine(line: WorkLine, step: WorkStep): boolean {
  return checkAnswer(line.name, step.name) && checkAnswer(line.value, step.accepted);
}

/**
 * Pairs each required line of working with a line the learner actually wrote,
 * in any order — finding D before naming the coefficients is a different route,
 * not a mistake. Returns the line index that satisfied each step, or −1 where
 * nothing did, so the per-line marking on screen and the overall verdict come
 * out of the same pass and cannot contradict each other.
 */
export function matchWork(lines: WorkLine[], steps: WorkStep[]): number[] {
  const used = new Set<number>();
  return steps.map((step) => {
    const at = lines.findIndex((line, i) => !used.has(i) && checkWorkLine(line, step));
    if (at !== -1) used.add(at);
    return at;
  });
}

/** Every required line present, each answered by a different line of working. */
export function checkWork(lines: WorkLine[], steps: WorkStep[]): boolean {
  return matchWork(lines, steps).every((at) => at !== -1);
}
