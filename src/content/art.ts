import blueNode from '@/assets/nodes/blue.webp';
import goldenNode from '@/assets/nodes/golden.webp';
import purpleNode from '@/assets/nodes/purple.webp';
import earth from '@/assets/planets/earth.webp';
import planet2 from '@/assets/planets/planet_2.webp';
import planet3 from '@/assets/planets/planet_3.webp';
import planet4 from '@/assets/planets/planet_4.webp';
import planet7 from '@/assets/planets/planet_7.webp';
import moon from '@/assets/planets/moon.webp';
import planet5 from '@/assets/planets/planet_5.webp';
import planet6 from '@/assets/planets/planet_6.webp';
import planet8 from '@/assets/planets/planet_8.webp';
import planet9 from '@/assets/planets/planet_9.webp';
import rocket0 from '@/assets/rocket/step_0.webp';
import rocket1 from '@/assets/rocket/step_1.webp';
import rocket2 from '@/assets/rocket/step_2.webp';
import rocket3 from '@/assets/rocket/step_3.webp';
import rocket4 from '@/assets/rocket/step_4.webp';

/**
 * Which drawing stands for what.
 *
 * Kept out of the components because it is a content decision, not a rendering
 * one: swapping the planet that represents Geometry should not mean opening a
 * screen file. The images themselves are built from `assets/` by
 * `npm run assets`.
 */

/** One planet per star system, chosen to suit the subject. */
export const SYSTEM_PLANET: Record<string, string> = {
  foundations: earth, // the home world you set out from
  quadratics: planet3, // purple and ringed — the flagship system
  functions: planet2, // a world of curves and currents
  systems: planet4, // banded: many things running in parallel
  geometry: planet7, // crystal facets, all angles and edges
};

export const FALLBACK_PLANET = moon;

/**
 * The level seals. Gold is the finished one, which is the app's colour for
 * reward and progress everywhere else — a level you have cleared is the one
 * thing on the map worth looking back at.
 */
export const NODE_ART = {
  done: goldenNode,
  open: purpleNode,
  locked: blueNode,
} as const;

export type NodeArtState = keyof typeof NODE_ART;

/**
 * The sections map uses one seal for every state.
 *
 * State is already carried there by the purple ring, the checkmark and the
 * drained filter — swapping the artwork as well made a column of six sections
 * read as six different kinds of thing rather than one journey.
 */
export const SECTION_SEAL = blueNode;

/**
 * A planet per mini-game.
 *
 * `planet_1` is deliberately unused: it is the one source PNG exported with an
 * opaque background rather than a cut-out, so it shows as a white tile on a dark
 * screen. Re-export it with transparency and it can come back. They are illustrations, not state — the games are all
 * equally available — so any distinct world will do, and reusing the planet set
 * keeps the arcade inside the same universe as the map.
 */
export const GAME_ART: Record<string, string> = {
  'root-hunt': moon,
  trajectory: planet3,
  'vertex-rush': planet8,
  'coordinate-dash': planet5,
  'read-off': planet9,
  'match-curve': planet2,
  'count-roots': planet6,
  'which-equation': planet7,
};

/**
 * The ship, one frame per completed build stage.
 *
 * Index by how many stages are finished: nothing yet is the blueprint, and each
 * stage paints in more of the drawing. There are four assembly stages and one
 * launch stage, so the last frame — the finished ship with its engine lit — is
 * reached at four and then *flies* when the fifth is done (the workshop adds a
 * lift-off class rather than a sixth picture).
 */
export const ROCKET_STAGE_ART = [rocket0, rocket1, rocket2, rocket3, rocket4] as const;

export const rocketArtFor = (stagesBuilt: number) =>
  ROCKET_STAGE_ART[Math.min(stagesBuilt, ROCKET_STAGE_ART.length - 1)];
