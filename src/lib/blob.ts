import { seededRandom } from '@/lib/random';

/**
 * Organic island shapes for the world map.
 *
 * Hand-authoring a path per region would make adding a section a drawing job, so
 * shapes are generated: a circle whose radius wobbles, smoothed into a closed
 * cubic curve. The generator is seeded by region id, so an island always looks
 * the same — a map that reshuffled itself between visits would be unreadable.
 */
export function blobPath(
  cx: number,
  cy: number,
  radius: number,
  seed: string,
  points = 9,
  wobble = 0.22,
): string {
  const rng = seededRandom(seed);
  const radii = Array.from({ length: points }, () => radius * (1 - wobble + rng() * wobble * 2));

  const at = (i: number) => {
    const idx = ((i % points) + points) % points;
    const angle = (idx / points) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + Math.cos(angle) * radii[idx], y: cy + Math.sin(angle) * radii[idx] };
  };

  // Catmull-Rom through the wobbled points, converted to cubic Béziers so the
  // outline closes smoothly instead of showing corners.
  let d = '';
  for (let i = 0; i < points; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    if (i === 0) d += `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d +=
      ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)},` +
      ` ${c2x.toFixed(2)} ${c2y.toFixed(2)},` +
      ` ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return `${d} Z`;
}

/**
 * Serpentine placement down the map, so a world reads as a route rather than a
 * grid. Returns viewBox coordinates for the given index.
 */
export function islandPosition(
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
