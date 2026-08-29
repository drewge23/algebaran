/**
 * Planet placement for the system map.
 *
 * The planets themselves are painted art (see `content/art.ts`); what is
 * computed here is only where they sit, so adding a planet is never a layout
 * job and the map looks the same on every visit.
 *
 * Serpentine placement, so a system reads as a route rather than a grid.
 * Returns viewBox coordinates for the given index.
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
