import { levelsOfRegion, type MapRegion } from '@/content/curriculum';
import { blobPath, islandPosition } from '@/lib/blob';
import { statusForLevel, tally, type LessonRecord } from '@/store/progressStore';

const VIEW_W = 400;
const RADIUS = 58;
/** Title and count sit below each island; routes and neighbours must clear them. */
const LABEL_DROP = RADIUS + 46;
const SPACING = 200;
const MARGIN = 100;

type RegionState = 'locked' | 'open' | 'done';

/**
 * The world map: each region is an island whose glow shows its state.
 *
 * Drawn as one SVG rather than positioned DOM nodes so the routes between
 * islands, the glow filters and the shapes all scale together — the map is the
 * same picture on a phone and a desktop, just larger.
 */
export function WorldSvgMap({
  regions,
  completed,
  onOpen,
}: {
  regions: MapRegion[];
  completed: Record<string, LessonRecord>;
  onOpen: (region: MapRegion) => void;
}) {
  const height = MARGIN * 2 + Math.max(0, regions.length - 1) * SPACING;

  const nodes = regions.map((region, i) => {
    const levels = levelsOfRegion(region);
    const { done, total } = tally(completed, levels);
    const reachable = levels.some((l) => statusForLevel(completed, l) !== 'locked');
    const state: RegionState = done === total && total > 0 ? 'done' : reachable ? 'open' : 'locked';
    return { region, ...islandPosition(i, VIEW_W, SPACING, MARGIN), done, total, state };
  });

  return (
    <svg className="worldmap" viewBox={`0 0 ${VIEW_W} ${height}`} role="img" aria-label="World map">
      <defs>
        {/* One glow per state; the open state also pulses via CSS. */}
        <filter id="glow-open" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="9" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow-done" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <radialGradient id="fill-open" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#b9a3ff" />
          <stop offset="60%" stopColor="#7c4dff" />
          <stop offset="100%" stopColor="#4a2ba8" />
        </radialGradient>
        <radialGradient id="fill-done" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#8ef0b4" />
          <stop offset="60%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#116634" />
        </radialGradient>
        <radialGradient id="fill-locked" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#3a3f66" />
          <stop offset="100%" stopColor="#1b1f3d" />
        </radialGradient>
      </defs>

      {/* Routes between islands, drawn first so they sit behind. */}
      {nodes.slice(1).map((node, i) => {
        const prev = nodes[i];
        // Start below the previous island's labels, end just above the next
        // island, so the route never runs through text.
        const from = prev.y + LABEL_DROP;
        const to = node.y - RADIUS - 6;
        const midY = (from + to) / 2;
        return (
          <path
            key={`route-${node.region.id}`}
            className="worldmap__route"
            d={`M ${prev.x} ${from} C ${prev.x} ${midY}, ${node.x} ${midY}, ${node.x} ${to}`}
          />
        );
      })}

      {nodes.map(({ region, x, y, done, total, state }) => (
        <g
          key={region.id}
          className={`worldmap__island worldmap__island--${state}`}
          role="button"
          tabIndex={state === 'locked' ? -1 : 0}
          aria-label={`${region.title} — ${done} of ${total}`}
          aria-disabled={state === 'locked'}
          onClick={() => state !== 'locked' && onOpen(region)}
          onKeyDown={(e) => {
            if (state === 'locked') return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpen(region);
            }
          }}>
          <path
            className="worldmap__shape"
            d={blobPath(x, y, RADIUS, region.id)}
            fill={`url(#fill-${state})`}
            filter={state === 'locked' ? undefined : `url(#glow-${state})`}
          />
          <text className="worldmap__glyph" x={x} y={y + 4} textAnchor="middle">
            {state === 'locked' ? '🔒' : region.glyph}
          </text>
          <text className="worldmap__title" x={x} y={y + RADIUS + 22} textAnchor="middle">
            {region.title}
          </text>
          <text className="worldmap__count" x={x} y={y + RADIUS + 40} textAnchor="middle">
            {state === 'locked' ? '' : `${done}/${total}`}
          </text>
        </g>
      ))}
    </svg>
  );
}
