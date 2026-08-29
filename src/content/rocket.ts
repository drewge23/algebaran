import type { LessonStep } from '@/types/content';

/**
 * REACH ALGEbaran — the workshop project.
 *
 * Structured as a machine being built rather than a course being taken: five
 * stages of three missions each, and finishing a stage visibly advances the
 * ship (see `content/art.ts`). The maths is run by the ordinary lesson engine;
 * the project only supplies the context and the reward.
 *
 * Difficulty climbs twice over: within a stage, mission 1 → 3, and across the
 * stages, arithmetic → linear → factoring → the formula → everything at once.
 * The last mission of the last stage is the hardest thing in the project, and
 * finishing it completes the rocket and unlocks the Shipwright achievement.
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

/**
 * One build stage: three missions that get harder as you go, and one visible
 * change to the ship when all three are done.
 */
export interface RocketSystem {
  id: string;
  name: string;
  glyph: string;
  blurb: string;
  /** Stages that must be finished first; keeps the build order sensible. */
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
    // --- Stage 1: arithmetic, order of operations, one unknown ---------------
    {
      id: 'hull',
      name: 'Hull',
      glyph: '🛠️',
      blurb: 'The shell that keeps the vacuum out.',
      requires: [],
      missions: [
        {
          id: 'm-hull-1',
          title: 'Plating Bolts',
          story: 'The frame is up, but the plating is still stacked by the door.',
          objective: 'Work out how many bolts the plating needs.',
          part: 'Hull plating',
          rewardPi: 20,
          rewardXp: 30,
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
        {
          id: 'm-hull-2',
          title: 'Cutting the Sheets',
          story: 'One long sheet of shielding, and no second chance at the saw.',
          objective: 'Trim first, then divide — in that order.',
          part: 'Shield panels',
          rewardPi: 25,
          rewardXp: 40,
          steps: [
            {
              kind: 'info',
              title: 'Order matters',
              equation: '(12 − 3) ÷ 3',
              body: 'The sheet is 12 m long. We trim 1.5 m off each end where the clamps bit into it, then cut what is left into 3 equal panels. Do the trimming first — divide first and the numbers come out wrong.',
            },
            {
              kind: 'input',
              problem: 'A 12 m sheet, 1.5 m trimmed off each end, then cut into 3 equal panels.',
              prompt: 'How long is each panel, in metres?',
              accepted: ['3', '3m', '3 m'],
              hint: 'Two trims of 1.5 m come off first: 12 − 3 = 9. Then split that into 3.',
              explanation: '(12 − 3) ÷ 3 = 9 ÷ 3 = 3 m each.',
            },
            {
              kind: 'choice',
              prompt: 'What would you get by dividing first and trimming after?',
              equation: '12 ÷ 3 − 3',
              options: ['1 m — and a ruined sheet', '3 m — the same', '9 m', '4 m'],
              correctIndex: 0,
              explanation:
                '12 ÷ 3 = 4, then 4 − 3 = 1. The brackets are not decoration; they are the difference between a panel and a offcut.',
            },
          ],
        },
        {
          id: 'm-hull-3',
          title: 'Pressure Seal',
          story: 'The seal is rated by the number of clamps around the hatch.',
          objective: 'Solve for the unknown count.',
          part: 'Hatch seal',
          rewardPi: 30,
          rewardXp: 50,
          steps: [
            {
              kind: 'info',
              title: 'One unknown',
              equation: '4x + 6 = 30',
              body: 'Each clamp holds 4 kPa, and the hatch frame itself is worth 6 kPa. The seal must be rated 30 kPa. How many clamps? Undo the +6 first, then the ×4.',
            },
            {
              kind: 'input',
              prompt: 'Solve for x.',
              problem: '4x + 6 = 30',
              accepted: ['6', 'x=6'],
              hint: 'Take 6 from both sides: 4x = 24. Then divide both sides by 4.',
              explanation: '4x = 24, so x = 6 clamps.',
            },
            {
              kind: 'choice',
              prompt: 'Check it: what does 4 × 6 + 6 come to?',
              options: ['30 ✓', '24', '36', '26'],
              correctIndex: 0,
              explanation: 'Substituting back is how you know — 24 + 6 = 30. The hatch is rated.',
            },
          ],
        },
      ],
    },

    // --- Stage 2: linear equations, and a first curve ------------------------
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
          rewardPi: 20,
          rewardXp: 30,
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
        {
          id: 'm-fuel-2',
          title: 'Reserve Margin',
          story: 'Regulations want fuel left in the tanks at touchdown, not fumes.',
          objective: 'Solve a two-step equation for the burn rate.',
          part: 'Reserve tank',
          rewardPi: 25,
          rewardXp: 40,
          steps: [
            {
              kind: 'info',
              title: 'Budgeting the burn',
              equation: '3x + 12 = 45',
              body: 'The flight is 3 minutes of burn at x units a minute, plus a fixed 12 units for the reserve. The tanks hold 45. Find x.',
            },
            {
              kind: 'input',
              prompt: 'Solve for x.',
              problem: '3x + 12 = 45',
              accepted: ['11', 'x=11'],
              hint: 'Subtract the reserve from both sides first: 3x = 33.',
              explanation: '3x = 33, so x = 11 units a minute.',
            },
            {
              kind: 'choice',
              prompt: 'The burn runs 4 minutes instead of 3. Do we still land with a reserve?',
              options: [
                'No — 44 + 12 is over 45',
                'Yes — exactly 45',
                'Yes — 1 unit spare',
                'Cannot tell',
              ],
              correctIndex: 0,
              explanation: '4 × 11 = 44, and 44 + 12 = 56. That is 11 units more than we carry.',
            },
          ],
        },
        {
          id: 'm-fuel-3',
          title: 'Burn Profile',
          story: 'The pump does not run flat out — flow climbs, peaks, then eases off.',
          objective: 'Shape the burn curve through both checkpoints.',
          part: 'Pump governor',
          rewardPi: 35,
          rewardXp: 55,
          steps: [
            {
              kind: 'info',
              title: 'A curve, not a line',
              equation: 'y = ax² + bx + c',
              body: 'Flow over time is a curve. The governor is set by three numbers — a, b and c. Two checkpoints are marked on the plane; find a setting that passes through both.',
            },
            {
              kind: 'graph',
              task: {
                kind: 'parameters',
                prompt: 'Shape the burn so the flow passes through both checkpoints.',
                start: { a: 1, b: 0, c: 0 },
                goal: { kind: 'hit-targets' },
                targets: [
                  { x: 0, y: 5 },
                  { x: 3, y: 8 },
                ],
                viewport: { xMin: -4, xMax: 8, yMin: -6, yMax: 12 },
                hint: 'c is the flow at x = 0, so set that first and then bend the curve.',
                explanation:
                  'y = −x² + 4x + 5 is one burn that works: it starts at 5 and reaches 8 at the third checkpoint.',
              },
            },
            {
              kind: 'choice',
              prompt: 'Why must a be negative for a burn that peaks and then eases off?',
              options: [
                'A negative a opens the curve downwards, so it has a maximum',
                'A negative a moves the curve down',
                'A negative a makes the curve steeper',
                'It does not matter',
              ],
              correctIndex: 0,
              explanation:
                'The sign of a is the direction the arms point. Negative means the curve tops out — which is exactly what a pump that peaks does.',
            },
          ],
        },
      ],
    },

    // --- Stage 3: factoring, then the formula --------------------------------
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
          rewardPi: 25,
          rewardXp: 40,
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
        {
          id: 'm-engine-2',
          title: 'Cold Start',
          story: 'Starting cold, the curve dips below zero before it climbs.',
          objective: 'Solve when one root is negative.',
          part: 'Ignition coil',
          rewardPi: 30,
          rewardXp: 50,
          steps: [
            {
              kind: 'info',
              title: 'Minding the signs',
              equation: 'x² + 2x − 15 = 0',
              body: 'The constant is negative this time, which means the two numbers you are looking for have opposite signs. That is the whole trick.',
            },
            {
              kind: 'choice',
              prompt: 'Two numbers multiply to −15 and add to 2. Which pair?',
              options: ['5 and −3', '−5 and 3', '15 and −1', '5 and 3'],
              correctIndex: 0,
              explanation: '5 × (−3) = −15 and 5 + (−3) = 2. So it factors as (x + 5)(x − 3).',
            },
            {
              kind: 'roots',
              prompt: 'Now the two settings.',
              equation: 'x² + 2x − 15 = 0',
              roots: ['3', '−5'],
              hint: '(x + 5)(x − 3) = 0 — each bracket gives one root, with the sign flipped.',
              explanation: 'x = 3 and x = −5.',
            },
          ],
        },
        {
          id: 'm-engine-3',
          title: 'Thrust Ceiling',
          story:
            'At full thrust the leading coefficient is no longer 1, and factoring stops being obvious.',
          objective: 'Reach for the discriminant and the formula.',
          part: 'Thrust limiter',
          rewardPi: 40,
          rewardXp: 65,
          steps: [
            {
              kind: 'info',
              title: 'When factoring will not come',
              equation: '2x² − 5x − 3 = 0',
              body: 'a is 2 here, so the neat pair-of-numbers trick does not apply directly. Work out D first — it tells you what kind of answer to expect before you commit to the arithmetic.',
            },
            {
              kind: 'choice',
              prompt: 'Find D.',
              equation: '2x² − 5x − 3 = 0',
              options: ['49', '1', '−23', '25'],
              correctIndex: 0,
              hint: 'D = b² − 4ac with a = 2, b = −5, c = −3. Watch the double negative.',
              explanation:
                'D = 25 − 4 × 2 × (−3) = 25 + 24 = 49, and √49 = 7 — so the roots come out clean.',
            },
            {
              kind: 'roots',
              prompt: 'Now the limiter settings.',
              equation: '2x² − 5x − 3 = 0',
              roots: ['3', '−0.5'],
              hint: 'x = (5 ± 7) / 4. Work out both signs.',
              explanation: 'x = 12/4 = 3 and x = −2/4 = −0.5.',
            },
          ],
        },
      ],
    },

    // --- Stage 4: reading the picture ---------------------------------------
    {
      id: 'navigation',
      name: 'Navigation',
      glyph: '🧭',
      blurb: 'Where we are, where we cross, and how high we get.',
      requires: ['engine'],
      missions: [
        {
          id: 'm-nav-1',
          title: 'Plot the Course',
          story:
            'We need the trajectory that will take us to Algebaran — and the two points where it crosses the reference line.',
          objective: 'Find the x-intercepts of the path.',
          part: 'Navigation array',
          rewardPi: 30,
          rewardXp: 50,
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
            {
              kind: 'graph',
              task: {
                kind: 'plot-roots',
                prompt: 'Now lock the array onto them.',
                fn: { kind: 'quadratic', a: 1, b: -6, c: 8 },
                viewport: { xMin: -2, xMax: 8, yMin: -4, yMax: 8 },
                explanation:
                  'The same two answers, this time as the places the path meets the line.',
              },
            },
          ],
        },
        {
          id: 'm-nav-2',
          title: 'Waypoint Apex',
          story: 'A test lob, straight up and back down. Navigation wants the top of the arc.',
          objective: 'Find the turning point of the path.',
          part: 'Apex tracker',
          rewardPi: 35,
          rewardXp: 55,
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
            {
              kind: 'graph',
              task: {
                kind: 'find-vertex',
                prompt: 'Now tap the top of the arc.',
                fn: { kind: 'quadratic', a: -1, b: 6, c: 0 },
                viewport: { xMin: -2, xMax: 8, yMin: -4, yMax: 12 },
                hint: 'The peak sits halfway between launch and touchdown.',
                explanation: 'Highest point (3, 9): three units after launch, nine units up.',
              },
            },
          ],
        },
        {
          id: 'm-nav-3',
          title: 'Course Correction',
          story:
            'The backup course never meets the reference line at all. Navigation needs to know that before we fly it, not after.',
          objective: 'Use the discriminant to rule a course out.',
          part: 'Course computer',
          rewardPi: 40,
          rewardXp: 65,
          steps: [
            {
              kind: 'info',
              title: 'Counting without solving',
              equation: 'D = b² − 4ac',
              body: 'The backup path is y = x² − 4x + 7. Before working anything out, D tells you how many times it can possibly cross: positive means twice, zero means once, negative means never.',
            },
            {
              kind: 'choice',
              prompt: 'Find D for the backup path.',
              equation: 'x² − 4x + 7 = 0',
              options: ['−12', '12', '44', '16'],
              correctIndex: 0,
              hint: 'a = 1, b = −4, c = 7.',
              explanation: 'D = 16 − 28 = −12. Negative, so it never reaches the line.',
            },
            {
              kind: 'graph',
              task: {
                kind: 'identify',
                prompt: 'Confirm it on the picture — how many crossings?',
                fn: { kind: 'quadratic', a: 1, b: -4, c: 7 },
                viewport: { xMin: -3, xMax: 7, yMin: -3, yMax: 11 },
                options: ['None', 'One', 'Two', 'Three'],
                correctIndex: 0,
                explanation:
                  'The whole curve floats above the axis. D said so before we drew it — that is what makes D worth computing first.',
              },
            },
          ],
        },
      ],
    },

    // --- Stage 5: everything, at once ---------------------------------------
    {
      id: 'launch',
      name: 'Launch',
      glyph: '🚀',
      blurb: 'Guidance, abort limits, and the countdown.',
      requires: ['navigation'],
      missions: [
        {
          // Ids from the earlier guidance stage are kept so saved progress is
          // not orphaned; guidance now lives inside the launch stage.
          id: 'm-guid-2',
          title: 'Abort Thresholds',
          story:
            'The abort system arms at two thresholds. Miss them and it either never fires or fires on the pad.',
          objective: 'Solve for both settings.',
          part: 'Abort system',
          rewardPi: 35,
          rewardXp: 55,
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
        {
          id: 'm-launch-1',
          title: 'Flight Profile',
          story:
            'Every system is green. Two numbers left: how long the flight lasts, and how high we get.',
          objective: 'Find the flight duration and the maximum height.',
          part: 'Flight computer',
          rewardPi: 45,
          rewardXp: 75,
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
              kind: 'graph',
              task: {
                kind: 'find-vertex',
                prompt: 'Mark the top of the flight.',
                fn: { kind: 'quadratic', a: -1, b: 8, c: 0 },
                viewport: { xMin: -2, xMax: 10, yMin: -4, yMax: 20 },
                hint: 'Halfway between 0 and 8, then read the height there.',
                explanation: 'Apex (4, 16) — four units into the flight, sixteen units up.',
              },
            },
          ],
        },
        {
          id: 'm-launch-2',
          title: 'Final Clearance',
          story:
            'Tower wants one last answer before the countdown: when exactly does the ship pass the 40 km gate?',
          objective: 'Turn the question into an equation, then solve it.',
          part: 'Flight clearance',
          rewardPi: 60,
          rewardXp: 100,
          steps: [
            {
              kind: 'info',
              title: 'From words to an equation',
              equation: 'h = −5t² + 30t',
              body: 'Height in kilometres after t minutes follows this. The gate sits at 40 km, and the ship passes it twice — once climbing, once falling. Set h to 40 and solve.',
            },
            {
              kind: 'choice',
              prompt: 'Setting h = 40 and tidying up, which equation are you solving?',
              options: [
                't² − 6t + 8 = 0',
                't² + 6t + 8 = 0',
                't² − 6t − 8 = 0',
                '−5t² + 30t + 40 = 0',
              ],
              correctIndex: 0,
              hint: '−5t² + 30t = 40. Move 40 across, then divide every term by −5.',
              explanation:
                '−5t² + 30t − 40 = 0, and dividing through by −5 gives t² − 6t + 8 = 0. Dividing by the leading coefficient is what makes it factorable.',
            },
            {
              kind: 'roots',
              prompt: 'When does the ship pass the gate?',
              equation: 't² − 6t + 8 = 0',
              roots: ['2', '4'],
              hint: 'Two numbers multiplying to 8 and adding to 6 — you have met this one before.',
              explanation:
                'At 2 minutes on the way up and 4 minutes on the way down. Cleared for launch.',
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
