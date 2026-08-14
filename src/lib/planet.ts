import { seededRandom } from '@/lib/random';

/**
 * Planet geometry for the system map.
 *
 * Planets are drawn, not authored: each gets a deterministic set of features
 * (ring, tilt, surface marks) derived from its id, so adding a section is never
 * a drawing job and a planet always looks the same. A map that reshuffled itself
 * between visits would be unreadable.
 */
export interface PlanetLook {
  /** Ringed planets break up a column of plain spheres. */
  hasRing: boolean;
  /** Ring tilt in degrees. */
  ringTilt: number;
  ringRx: number;
  ringRy: number;
  /** Surface blotches: [dx, dy, r] relative to the planet centre. */
  marks: [number, number, number][];
}

export function planetLook(seed: string, radius: number): PlanetLook {
  const rng = seededRandom(seed);
  const hasRing = rng() < 0.45;
  const ringTilt = -35 + rng() * 45;
  const markCount = 2 + Math.floor(rng() * 3);
  const marks: [number, number, number][] = [];

  for (let i = 0; i < markCount; i++) {
    // Keep marks inside the sphere so they read as surface, not orbiting dots.
    const angle = rng() * Math.PI * 2;
    const dist = rng() * radius * 0.52;
    marks.push([Math.cos(angle) * dist, Math.sin(angle) * dist, radius * (0.1 + rng() * 0.16)]);
  }

  return {
    hasRing,
    ringTilt,
    ringRx: radius * 1.55,
    ringRy: radius * 0.42,
    marks,
  };
}

/**
 * Serpentine placement down the map, so a system reads as a route rather than a
 * grid. Returns viewBox coordinates for the given index.
 */
export function planetPosition(
  index: number,
  width: number,
  spacing: number,
  margin: number,
): { x: number; y: number } {
  // Three lanes, weaving: centre → right → centre → left → …
  const lanes = [0, 0.3, 0, -0.3];
  const offset = lanes[index % lanes.length] * (width / 2 - margin);
  return { x: width / 2 + offset, y: margin + index * spacing };
}
