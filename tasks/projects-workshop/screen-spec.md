# Projects — REACH ALGEbaran

## Purpose

Turn quadratic practice into a tangible long-term goal: the learner builds a
rocket one stage at a time, applies knowledge in contextual missions, then
launches it after the final clearance calculation.

## User flow

`Bottom navigation → Projects → stage → mission → lesson engine → same stage`

The primary path always surfaces the next unfinished mission. The learner can
also inspect every stage; later stages remain visibly locked until their three
predecessor missions are complete.

## Components

- **Workshop hero:** current rocket art is the progress indicator, not a card.
- **Current mission:** contextual story, mathematical objective, reward and
  start CTA.
- **Five stage tiles:** Hull, Fuel, Engine, Navigation and Launch; each has
  three ordered missions and a locked/open/done state.
- **Completion:** stage 5 causes the rocket lift-off state and unlocks the
  `Shipwright` achievement.

## Data and implementation

- Content lives in `src/content/rocket.ts`.
- The standard `LessonPlayer` runs every mission.
- Completion is stored in `progressStore.projects`; visual state derives from
  completed stages, never a separate mutable progress number.
- Approved rocket art is selected by `rocketArtFor(stagesBuilt)`.

## Responsive rules

Mobile is first: rocket art is central, Current Mission is one short card, and
stage tiles are two columns with 44 px minimum tap targets. Desktop preserves
that hierarchy with wider breathing room; it must not turn into a dashboard.
