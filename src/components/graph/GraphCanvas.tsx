import { useRef, type PointerEvent as ReactPointerEvent } from 'react';

import {
  niceStep,
  samplePath,
  snapPoint,
  toMath,
  toSvg,
  type FunctionDef,
  type Pt,
  type Viewport,
} from '@/lib/graph';

/** A point drawn on the graph. `role` drives colour and size, not meaning. */
export interface GraphPoint extends Pt {
  role?: 'user' | 'given' | 'target' | 'correct' | 'wrong';
  label?: string;
}

export interface GraphCurve {
  fn: FunctionDef;
  role?: 'main' | 'ghost' | 'target';
}

const SIZE = 360;

/**
 * The graph workspace: a plain, high-contrast Cartesian plane.
 *
 * Deliberately not decorated. The cosmic styling lives in the frame around it —
 * inside the axes this is a mathematical instrument, because a learner reading a
 * root off a glowing nebula is fighting the picture. Interaction is
 * pointer-based so touch, pen and mouse all work through one path.
 */
export function GraphCanvas({
  viewport,
  curves = [],
  points = [],
  onPlace,
  snapStep = 1,
  showGrid = true,
  interactive = false,
  ariaLabel,
}: {
  viewport: Viewport;
  curves?: GraphCurve[];
  points?: GraphPoint[];
  /** Called with snapped graph coordinates when the learner taps the plane. */
  onPlace?: (p: Pt) => void;
  snapStep?: number;
  showGrid?: boolean;
  interactive?: boolean;
  ariaLabel?: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  const xStep = niceStep(viewport.xMax - viewport.xMin);
  const yStep = niceStep(viewport.yMax - viewport.yMin);
  const project = (p: Pt) => toSvg(p, viewport, SIZE, SIZE);

  const handlePointer = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (!interactive || !onPlace || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    // Convert through the rendered size, not the viewBox, so it stays correct
    // however the SVG is scaled by its container.
    const local = {
      x: ((e.clientX - rect.left) / rect.width) * SIZE,
      y: ((e.clientY - rect.top) / rect.height) * SIZE,
    };
    onPlace(snapPoint(toMath(local, viewport, SIZE, SIZE), snapStep));
  };

  const gridLines = (from: number, to: number, step: number) => {
    const out: number[] = [];
    for (let v = Math.ceil(from / step) * step; v <= to; v += step) out.push(Number(v.toFixed(6)));
    return out;
  };

  return (
    <svg
      ref={svgRef}
      className={`graph${interactive ? ' graph--interactive' : ''}`}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="img"
      aria-label={ariaLabel ?? 'Graph'}
      onPointerDown={handlePointer}>
      <rect className="graph__bg" x="0" y="0" width={SIZE} height={SIZE} rx="12" />

      {showGrid && (
        <g className="graph__grid">
          {gridLines(viewport.xMin, viewport.xMax, xStep).map((x) => (
            <line
              key={`vx${x}`}
              x1={project({ x, y: 0 }).x}
              y1={0}
              x2={project({ x, y: 0 }).x}
              y2={SIZE}
            />
          ))}
          {gridLines(viewport.yMin, viewport.yMax, yStep).map((y) => (
            <line
              key={`hz${y}`}
              x1={0}
              y1={project({ x: 0, y }).y}
              x2={SIZE}
              y2={project({ x: 0, y }).y}
            />
          ))}
        </g>
      )}

      {/* Axes */}
      <g className="graph__axes">
        <line x1={0} y1={project({ x: 0, y: 0 }).y} x2={SIZE} y2={project({ x: 0, y: 0 }).y} />
        <line x1={project({ x: 0, y: 0 }).x} y1={0} x2={project({ x: 0, y: 0 }).x} y2={SIZE} />
      </g>

      {/* Axis numbers, skipping zero so the origin stays uncluttered, and
          skipping the outermost values, which the frame would cut in half. */}
      <g className="graph__labels">
        {gridLines(viewport.xMin, viewport.xMax, xStep)
          .filter((x) => Math.abs(x) > 1e-6 && x > viewport.xMin + 1e-6 && x < viewport.xMax - 1e-6)
          .map((x) => (
            <text
              key={`lx${x}`}
              x={project({ x, y: 0 }).x}
              y={project({ x, y: 0 }).y + 14}
              textAnchor="middle">
              {x}
            </text>
          ))}
        {gridLines(viewport.yMin, viewport.yMax, yStep)
          .filter((y) => Math.abs(y) > 1e-6 && y > viewport.yMin + 1e-6 && y < viewport.yMax - 1e-6)
          .map((y) => (
            <text
              key={`ly${y}`}
              x={project({ x: 0, y }).x - 8}
              y={project({ x: 0, y }).y + 4}
              textAnchor="end">
              {y}
            </text>
          ))}
      </g>

      {/* Curves, clipped so they leave the frame rather than stopping short. */}
      <clipPath id="graph-clip">
        <rect x="0" y="0" width={SIZE} height={SIZE} rx="12" />
      </clipPath>
      <g clipPath="url(#graph-clip)">
        {curves.map((curve, i) => {
          const d = samplePath(curve.fn, viewport)
            .map((p, j) => {
              const s = project(p);
              return `${j === 0 ? 'M' : 'L'} ${s.x.toFixed(2)} ${s.y.toFixed(2)}`;
            })
            .join(' ');
          return (
            <path key={i} className={`graph__curve graph__curve--${curve.role ?? 'main'}`} d={d} />
          );
        })}
      </g>

      {points.map((p, i) => {
        const s = project(p);
        const role = p.role ?? 'user';
        return (
          <g key={i} className={`graph__point graph__point--${role}`}>
            {role === 'target' ? (
              <>
                <circle cx={s.x} cy={s.y} r="13" className="graph__target-ring" />
                <circle cx={s.x} cy={s.y} r="5" />
              </>
            ) : (
              <circle cx={s.x} cy={s.y} r="7" />
            )}
            {p.label && (
              <text x={s.x + 12} y={s.y - 10}>
                {p.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
