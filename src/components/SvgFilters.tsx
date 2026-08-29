/**
 * Document-wide SVG filters, rendered once and referenced from CSS.
 *
 * `soft-edge` feathers the *alpha* of a cut-out and leaves its colour untouched,
 * which is the one thing a CSS `filter: blur()` cannot do — that would smear the
 * artwork as well. It works on whatever shape the art actually has, so a ringed
 * planet keeps its rings, and it is why the planets no longer show the hard
 * stair-stepped rim they were exported with. The filter region is generous on
 * purpose: a Gaussian needs roughly three times its deviation in margin, and
 * anything past the region's edge is simply cut off.
 */
export function SvgFilters() {
  return (
    <svg className="svg-defs" aria-hidden="true" focusable="false">
      <defs>
        <filter
          id="soft-edge"
          x="-25%"
          y="-25%"
          width="150%"
          height="150%"
          colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation="10" result="soft" />
          {/* A light tighten only. Steepening this is what keeps a small blur
              from swelling the shape, but past a few pixels it cancels the very
              softness it is there to control — so at this radius it does little
              more than keep the planet's body fully opaque. */}
          <feComponentTransfer in="soft" result="mask">
            <feFuncA type="linear" slope="1.2" intercept="-0.1" />
          </feComponentTransfer>
          <feComposite in="SourceGraphic" in2="mask" operator="in" />
        </filter>
      </defs>
    </svg>
  );
}
