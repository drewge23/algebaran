/**
 * The names a line of working may be labelled with on a `canvas` step.
 *
 * The equation pad has no letters, so these are the only labels a learner can
 * actually type — `EquationKeyboard` offers exactly this row for such steps, and
 * `content/__tests__/lesson-steps.test.ts` holds authoring to it. Adding a name
 * here means adding a key; asking for one that is not here means asking for an
 * answer that cannot be given.
 */
export const WORK_NAMES = ['a', 'b', 'c', 'D', 'x₁', 'x₂'] as const;
