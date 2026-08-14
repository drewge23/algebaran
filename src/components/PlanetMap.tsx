import { levelsOfPlanet, type Planet } from '@/content/curriculum';
import { planetLook, planetPosition } from '@/lib/planet';
import { statusForLevel, tally, type LessonRecord } from '@/store/progressStore';

const VIEW_W = 400;
const RADIUS = 52;
/** Title and count sit below each planet; routes and neighbours must clear them. */
const LABEL_DROP = RADIUS + 52;
const SPACING = 200;
const MARGIN = 100;

type PlanetState = 'locked' | 'open' | 'done';

/**
 * The planets of one star system, on a single SVG.
 *
 * One drawing rather than positioned DOM nodes, so the orbital routes, the glow
 * and the spheres all scale together — the same picture on a phone and a
 * desktop, just larger.
 */
export function PlanetMap({
  planets,
  completed,
  onOpen,
}: {
  planets: Planet[];
  completed: Record<string, LessonRecord>;
  onOpen: (planet: Planet) => void;
}) {
  const height = MARGIN * 2 + Math.max(0, planets.length - 1) * SPACING;

  const nodes = planets.map((planet, i) => {
    const levels = levelsOfPlanet(planet);
    const { done, total } = tally(completed, levels);
    const reachable = levels.some((l) => statusForLevel(completed, l) !== 'locked');
    const state: PlanetState = done === total && total > 0 ? 'done' : reachable ? 'open' : 'locked';
    return {
      planet,
      ...planetPosition(i, VIEW_W, SPACING, MARGIN),
      look: planetLook(planet.id, RADIUS),
      done,
      total,
      state,
    };
  });

  return (
    <svg
      className="planetmap"
      viewBox={`0 0 ${VIEW_W} ${height}`}
      role="img"
      aria-label="System map">
      <defs>
        <filter id="pglow-open" x="-70%" y="-70%" width="240%" height="240%">
          <feGaussianBlur stdDeviation="10" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="pglow-done" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="7" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Light from the upper left gives every sphere the same sun. */}
        <radialGradient id="pfill-open" cx="32%" cy="28%" r="78%">
          <stop offset="0%" stopColor="#c9b6ff" />
          <stop offset="55%" stopColor="#7c4dff" />
          <stop offset="100%" stopColor="#331d78" />
        </radialGradient>
        <radialGradient id="pfill-done" cx="32%" cy="28%" r="78%">
          <stop offset="0%" stopColor="#a5f5c5" />
          <stop offset="55%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#0d4f28" />
        </radialGradient>
        <radialGradient id="pfill-locked" cx="32%" cy="28%" r="78%">
          <stop offset="0%" stopColor="#414669" />
          <stop offset="100%" stopColor="#161a33" />
        </radialGradient>
      </defs>

      {/* Routes first, so they sit behind the planets. */}
      {nodes.slice(1).map((node, i) => {
        const prev = nodes[i];
        const from = prev.y + LABEL_DROP;
        const to = node.y - RADIUS - 8;
        const midY = (from + to) / 2;
        return (
          <path
            key={`route-${node.planet.id}`}
            className="planetmap__route"
            d={`M ${prev.x} ${from} C ${prev.x} ${midY}, ${node.x} ${midY}, ${node.x} ${to}`}
          />
        );
      })}

      {nodes.map(({ planet, x, y, look, done, total, state }) => (
        <g
          key={planet.id}
          className={`planetmap__planet planetmap__planet--${state}`}
          role="button"
          tabIndex={state === 'locked' ? -1 : 0}
          aria-label={`${planet.title} — ${done} of ${total}`}
          aria-disabled={state === 'locked'}
          onClick={() => state !== 'locked' && onOpen(planet)}
          onKeyDown={(e) => {
            if (state === 'locked') return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpen(planet);
            }
          }}>
          {/* Back half of the ring, drawn under the sphere. */}
          {look.hasRing && (
            <ellipse
              className="planetmap__ring planetmap__ring--back"
              cx={x}
              cy={y}
              rx={look.ringRx}
              ry={look.ringRy}
              transform={`rotate(${look.ringTilt} ${x} ${y})`}
            />
          )}

          <g filter={state === 'locked' ? undefined : `url(#pglow-${state})`}>
            <circle
              className="planetmap__body"
              cx={x}
              cy={y}
              r={RADIUS}
              fill={`url(#pfill-${state})`}
            />
          </g>

          {/* Surface marks, clipped to the sphere by staying well inside it. */}
          {look.marks.map(([dx, dy, r], i) => (
            <circle key={i} className="planetmap__mark" cx={x + dx} cy={y + dy} r={r} />
          ))}

          {/* Front half of the ring crosses the sphere. */}
          {look.hasRing && (
            <path
              className="planetmap__ring planetmap__ring--front"
              d={`M ${x - look.ringRx} ${y} A ${look.ringRx} ${look.ringRy} 0 0 0 ${x + look.ringRx} ${y}`}
              transform={`rotate(${look.ringTilt} ${x} ${y})`}
            />
          )}

          <text className="planetmap__glyph" x={x} y={y + 4} textAnchor="middle">
            {state === 'locked' ? '🔒' : planet.glyph}
          </text>
          <text className="planetmap__title" x={x} y={y + RADIUS + 26} textAnchor="middle">
            {planet.title}
          </text>
          <text className="planetmap__count" x={x} y={y + RADIUS + 44} textAnchor="middle">
            {state === 'locked' ? '' : `${done}/${total}`}
          </text>
        </g>
      ))}
    </svg>
  );
}
