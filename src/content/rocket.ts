import type { LessonStep } from '@/types/content';

/**
 * REACH ALGEbaran — the workshop project.
 *
 * Structured as a machine being built rather than a course being taken: each
 * rocket system is a cluster of missions, and finishing one visibly completes
 * that part of the ship. The maths is run by the ordinary lesson engine; the
 * project only supplies the context and the reward.
 */
export interface Mission {
  id: string;
  title: string;
  /** Short in-world framing, shown on the mission card. */
  story: string;
  /** What the learner is actually being asked to do, mathematically. */
  objective: string;
  /** The component this mission bolts onto the ship. */
  part: string;
  rewardPi: number;
  rewardXp: number;
  steps: LessonStep[];
}

export interface RocketSystem {
  id: string;
  name: string;
  glyph: string;
  blurb: string;
  /** Systems that must be finished first; keeps the build order sensible. */
  requires: string[];
  missions: Mission[];
}

export interface WorkshopProject {
  id: string;
  title: string;
  tagline: string;
  brief: string;
  systems: RocketSystem[];
}

export const PROJECT: WorkshopProject = {
  id: 'reach-algebaran',
  title: 'REACH ALGEbaran',
  tagline: 'Build the ship. Fly it home.',
  brief:
    'Algebaran is the brightest star in the sky and nobody has been. The ship is in pieces on the workshop floor. Every system needs its numbers worked out before it can be bolted on — and the maths is the only thing standing between here and launch.',
  systems: [
    {
      id: 'hull',
      name: 'Hull',
      glyph: '🛠️',
      blurb: 'The shell that keeps the vacuum out.',
      requires: [],
      missions: [
        {
          id: 'm-hull-1',
          title: 'Build the Hull',
          story: 'The frame is up, but the plating is still stacked by the door.',
          objective: 'Work out how many bolts the plating needs.',
          part: 'Hull plating',
          rewardPi: 25,
          rewardXp: 40,
          steps: [
            {
              kind: 'info',
              title: 'Count before you cut',
              body: 'The hull takes 24 panels. Every panel is fixed with 3 bolts. Get this wrong and we either run out halfway or carry dead weight to orbit.',
            },
            {
              kind: 'input',
              problem: '24 panels, 3 bolts each.',
              prompt: 'How many bolts in total?',
              accepted: ['72'],
              hint: 'Three bolts repeated 24 times — that is 24 × 3.',
              explanation: '24 × 3 = 72 bolts.',
            },
            {
              kind: 'choice',
              prompt: 'The crate holds 60 bolts. Is that enough?',
              options: ['No — 12 short', 'Yes — 12 spare', 'Exactly enough', 'Cannot tell'],
              correctIndex: 0,
              explanation: '72 − 60 = 12. We need another dozen before the hull can close.',
            },
          ],
        },
      ],
    },

    {
      id: 'fuel',
      name: 'Fuel',
      glyph: '⛽',
      blurb: 'Tanks, pumps and the burn budget.',
      requires: ['hull'],
      missions: [
        {
          id: 'm-fuel-1',
          title: 'Fuel System',
          story: 'Flight plan says 56 units of propellant. The tanks come in one size only.',
          objective: 'Work out how many tanks to fit.',
          part: 'Fuel tanks',
          rewardPi: 25,
          rewardXp: 40,
          steps: [
            {
              kind: 'info',
              title: 'Tank maths',
              body: 'Each tank holds 8 units. We need 56 units on board. Tanks cannot be half-fitted — it is whole tanks or nothing.',
            },
            {
              kind: 'input',
              problem: 'Each tank holds 8 units. The mission needs 56.',
              prompt: 'How many tanks?',
              accepted: ['7'],
              hint: 'How many 8s fit into 56?',
              explanation: '56 ÷ 8 = 7 tanks.',
            },
          ],
        },
      ],
    },

    {
      id: 'engine',
      name: 'Engine',
      glyph: '🔥',
      blurb: 'Thrust, and the settings that produce it.',
      requires: ['fuel'],
      missions: [
        {
          id: 'm-engine-1',
          title: 'Engine Calibration',
          story:
            'The engine idles roughly. Output follows a curve, and it must read zero at both ends of the safe band.',
          objective: 'Find where output is zero.',
          part: 'Calibrated engine',
          rewardPi: 40,
          rewardXp: 70,
          steps: [
            {
              kind: 'info',
              title: 'Output curve',
              equation: 'x² − 10x + 24',
              body: 'Engine output follows this expression. The two values where it hits zero are the edges of the safe operating band — set the throttle stops there.',
            },
            {
              kind: 'roots',
              prompt: 'Where does output reach zero?',
              equation: 'x² − 10x + 24 = 0',
              roots: ['4', '6'],
              hint: 'Two numbers multiplying to 24 and adding to 10. Try factoring into (x − ?)(x − ?).',
              explanation: '(x − 4)(x − 6) = 0, so the band runs from 4 to 6.',
            },
          ],
        },
      ],
    },

    {
      id: 'navigation',
      name: 'Navigation',
      glyph: '🧭',
      blurb: 'Where we are, and where we cross.',
      requires: ['engine'],
      missions: [
        {
          id: 'm-nav-1',
          title: 'Plot the Course',
          story:
            'We need the trajectory that will take us to Algebaran — and the two points where it crosses the reference line.',
          objective: 'Find the x-intercepts of the path.',
          part: 'Navigation array',
          rewardPi: 40,
          rewardXp: 70,
          steps: [
            {
              kind: 'info',
              title: 'The reference line',
              equation: 'y = x² − 6x + 8',
              body: 'The flight path follows this curve. Where it crosses the x-axis, y is zero — those are the two waypoints the array locks onto.',
            },
            {
              kind: 'roots',
              prompt: 'Where does the path cross the axis?',
              equation: 'x² − 6x + 8 = 0',
              roots: ['2', '4'],
              hint: 'Two numbers multiplying to 8 and adding to 6.',
              explanation: '(x − 2)(x − 4) = 0 — waypoints at 2 and 4.',
            },
          ],
        },
      ],
    },

    {
      id: 'guidance',
      name: 'Guidance',
      glyph: '🎯',
      blurb: 'Keeping the ship on the curve.',
      requires: ['navigation'],
      missions: [
        {
          id: 'm-guid-1',
          title: 'Trajectory',
          story:
            'A test lob, straight up and back down. Guidance needs to know exactly when the ship returns to the pad.',
          objective: 'Find when height returns to zero.',
          part: 'Guidance computer',
          rewardPi: 40,
          rewardXp: 70,
          steps: [
            {
              kind: 'info',
              title: 'Up and down',
              equation: 'h = −x² + 6x',
              body: 'Height follows this curve. There is no constant term, which makes it factor very quickly — a gift when you are doing this in your head on the pad.',
            },
            {
              kind: 'roots',
              prompt: 'When is the ship at ground level?',
              equation: '−x² + 6x = 0',
              roots: ['0', '6'],
              hint: 'Factor out the common x: x(6 − x) = 0.',
              explanation: 'x = 0 is the launch, x = 6 is touchdown.',
            },
          ],
        },
        {
          id: 'm-guid-2',
          title: 'Safety System',
          story:
            'The abort system arms at two thresholds. Miss them and it either never fires or fires on the pad.',
          objective: 'Solve for both settings.',
          part: 'Abort system',
          rewardPi: 40,
          rewardXp: 70,
          steps: [
            {
              kind: 'info',
              title: 'Two thresholds',
              equation: '2x² − 7x + 3 = 0',
              body: 'This one does not factor as neatly, so reach for the discriminant and the formula.',
            },
            {
              kind: 'choice',
              prompt: 'Find D first.',
              equation: '2x² − 7x + 3 = 0',
              options: ['25', '49', '−23', '13'],
              correctIndex: 0,
              hint: 'D = b² − 4ac with a = 2, b = −7, c = 3.',
              explanation: 'D = 49 − 24 = 25, and √25 = 5 — so the roots come out cleanly.',
            },
            {
              kind: 'roots',
              prompt: 'Now both settings.',
              equation: '2x² − 7x + 3 = 0',
              roots: ['3', '0.5'],
              hint: 'x = (7 ± 5) / 4. Work out both signs.',
              explanation: 'x = 12/4 = 3 and x = 2/4 = 0.5.',
            },
          ],
        },
      ],
    },

    {
      id: 'launch',
      name: 'Launch',
      glyph: '🚀',
      blurb: 'Everything, at once.',
      requires: ['guidance'],
      missions: [
        {
          id: 'm-launch-1',
          title: 'Final Launch',
          story:
            'Every system is green. One last calculation before the countdown: how long the burn lasts, and how high we get.',
          objective: 'Find the flight duration and the maximum height.',
          part: 'Flight clearance',
          rewardPi: 80,
          rewardXp: 150,
          steps: [
            {
              kind: 'info',
              title: 'Launch profile',
              equation: 'h = −x² + 8x',
              body: 'This is the real one. Same shape as the test lob, bigger numbers. Find where it returns to ground, then use the symmetry of the parabola to find the peak.',
            },
            {
              kind: 'roots',
              prompt: 'When does the ship leave and return to the ground?',
              equation: '−x² + 8x = 0',
              roots: ['0', '8'],
              hint: 'Factor out x: x(8 − x) = 0.',
              explanation: 'Launch at 0, touchdown at 8 — a flight of 8 units.',
            },
            {
              kind: 'choice',
              prompt: 'The peak sits halfway between those. When?',
              options: ['x = 4', 'x = 8', 'x = 2', 'x = 6'],
              correctIndex: 0,
              hint: 'A parabola is symmetric about its vertex. Halfway between 0 and 8.',
              explanation: 'The vertex is at x = 4.',
            },
            {
              kind: 'input',
              problem: 'Substitute x = 4 into h = −x² + 8x.',
              prompt: 'Maximum height (just the number)',
              accepted: ['16'],
              hint: '−(4)² + 8(4) = −16 + 32.',
              explanation: 'h = 16. That clears the ridge, the orbit and the record.',
            },
            {
              kind: 'info',
              title: 'Clear for launch',
              equation: 'D = 64 > 0',
              body: 'The discriminant was positive the whole time, which is exactly why there were two ground times — a launch and a landing. You worked out the flight before flying it. Light the engines.',
            },
          ],
        },
      ],
    },
  ],
};

export const getSystem = (id: string) => PROJECT.systems.find((s) => s.id === id);

export const getMission = (id: string) =>
  PROJECT.systems.flatMap((s) => s.missions).find((m) => m.id === id);

export const systemOfMission = (missionId: string) =>
  PROJECT.systems.find((s) => s.missions.some((m) => m.id === missionId));

export const ALL_MISSIONS = PROJECT.systems.flatMap((s) => s.missions);
