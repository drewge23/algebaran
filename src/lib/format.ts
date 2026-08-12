/**
 * Answer options can be either mathematics (`−2`, `x = ±3`) or prose
 * ("A parabola"). Only the former should use the serif italic math face, so we
 * sniff the content rather than making every author tag it by hand.
 */
const MATH_ONLY = /^[\s\d+\-−×÷*/^²³√±()=<>,.xyXY]+$/;

export function looksLikeMath(text: string): boolean {
  return MATH_ONLY.test(text);
}
