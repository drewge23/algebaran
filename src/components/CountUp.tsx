import { useEffect, useState } from 'react';

const DURATION = 550;

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Counts from zero to `value` once, on mount.
 *
 * Reward numbers landing instantly read as a form field; ticking up reads as
 * being paid. Kept under the 600ms the design allows, and skipped entirely for
 * anyone who asked for reduced motion — they get the final number immediately,
 * never a slower one and never a missing one.
 */
export function CountUp({ value, prefix = '' }: { value: number; prefix?: string }) {
  // The starting number is decided once, so reduced motion never sees a zero.
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? value : 0));

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let frame = 0;
    const started = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / DURATION);
      // Ease-out, so it decelerates onto the final number rather than stopping dead.
      setShown(Math.round(value * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <>
      {prefix}
      {shown.toLocaleString()}
    </>
  );
}
