/**
 * The ship, drawn in parts.
 *
 * Each rocket system owns one piece of this drawing. A piece is a ghosted
 * outline until its system is finished, then it fills in — so the picture is the
 * progress bar, and the reward for a mission is something you can see.
 */
export function RocketSvg({
  built,
  className,
}: {
  /** System ids whose missions are all complete. */
  built: Set<string>;
  className?: string;
}) {
  const on = (id: string) => (built.has(id) ? 'rocket__part rocket__part--on' : 'rocket__part');

  return (
    <svg
      className={`rocket ${className ?? ''}`}
      viewBox="0 0 200 320"
      role="img"
      aria-label="Ship assembly">
      <defs>
        <linearGradient id="r-hull" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8e93bd" />
          <stop offset="45%" stopColor="#eef0ff" />
          <stop offset="100%" stopColor="#6f74a0" />
        </linearGradient>
        <linearGradient id="r-nose" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6437e0" />
          <stop offset="50%" stopColor="#b9a3ff" />
          <stop offset="100%" stopColor="#4a2ba8" />
        </linearGradient>
        <linearGradient id="r-flame" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff3c4" />
          <stop offset="45%" stopColor="#f2b237" />
          <stop offset="100%" stopColor="#f87171" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Launch — exhaust, only once everything else is aboard. */}
      <g className={on('launch')}>
        <path
          className="rocket__flame"
          d="M92 262 C 86 288, 96 300, 100 316 C 104 300, 114 288, 108 262 Z"
          fill="url(#r-flame)"
        />
      </g>

      {/* Navigation — fins. */}
      <g className={on('navigation')}>
        <path className="rocket__fill-hull" d="M70 200 L44 258 L70 250 Z" />
        <path className="rocket__fill-hull" d="M130 200 L156 258 L130 250 Z" />
      </g>

      {/* Engine — the bell. */}
      <g className={on('engine')}>
        <path className="rocket__fill-metal" d="M84 246 L78 268 L122 268 L116 246 Z" />
        <rect className="rocket__fill-metal" x="86" y="238" width="28" height="10" rx="3" />
      </g>

      {/* Fuel — tank bands around the body. */}
      <g className={on('fuel')}>
        <rect className="rocket__fill-accent" x="76" y="150" width="48" height="12" rx="4" />
        <rect className="rocket__fill-accent" x="76" y="176" width="48" height="12" rx="4" />
      </g>

      {/* Hull — the body itself. */}
      <g className={on('hull')}>
        <path
          className="rocket__fill-body"
          d="M100 74 C 128 104, 132 150, 130 208 L 70 208 C 68 150, 72 104, 100 74 Z"
        />
      </g>

      {/* Guidance — nose cone and window. */}
      <g className={on('guidance')}>
        <path
          className="rocket__fill-nose"
          d="M100 20 C 118 44, 126 60, 128 78 L 72 78 C 74 60, 82 44, 100 20 Z"
        />
        <circle className="rocket__window" cx="100" cy="118" r="13" />
      </g>
    </svg>
  );
}
