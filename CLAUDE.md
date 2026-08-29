# Algebaran

A gamified **web app** (installable PWA) that teaches **quadratic equations**.
Cosmic theme — the name plays on _Aldebaran_, the brightest star in Taurus.
In-app soft currency is **π**; progression is a journey across a star map guided
by the mascot, **Professorson**.

## Stack

- **Vite 8** + **React 19** + **TypeScript** (strict)
- **react-router-dom** with `HashRouter` — deploys to any static host, no SPA rewrites
- **Zustand + persist** over **localStorage** for state & local save
- **i18n**: `i18next` + `react-i18next` (English-first, RU authored; choice persisted)
- **vite-plugin-pwa** (Workbox) — offline precache + add-to-home-screen
- **Vitest** for unit tests; **ESLint** (flat config) + **Prettier**

> Previously an Expo/React Native app. That version is preserved in git history at
> commit `9e4a516`; the pivot to web was for prototyping and link-sharing speed.

## Key decisions / constraints

- **Web-first for shareability**: the deliverable is a URL. Keep the bundle small
  (currently ~100 KB gzipped JS) — it is opened on phones over mobile data.
- **Dark-only theme** by design. The art direction (deep-space backdrop, cream
  "paper" cards, gold π) commits to one look, so there is no light theme.
- **One colour language**: purple = interaction and current state, gold =
  reward and progress, muted grey = inactive. Nothing else carries meaning.
  Cards group information; they do not surround every element.
- **No webfonts.** UI uses the system stack; **mathematics uses a serif italic**
  (`--font-math`) so equations read like a textbook at zero download cost.
- **Equations are plain Unicode strings** (`x²`, true minus `−`) rendered by
  `MathText` — deliberately no KaTeX/MathJax. Answer checking normalises input
  (see `lib/answer.ts`), so `x^2+3x-10=0` matches `x²+3x−10=0`.
- **English-first, i18n-ready**: all UI chrome goes through `src/i18n`. Lesson
  _content_ is authored in English; localising it is a later, separate pass.
- **Soft currency only** — no real-money IAP. Shop, fortune cookies, unlockable
  keyboard keys and multipliers all run on earned π.

## Accounts

Profiles are **local to the device** (`store/authStore.ts`): registration,
sign-in, switching and an optional 4-digit PIN, all in `localStorage`. This is
deliberate — the audience is schoolchildren, and there is no backend, so we do
not collect minors' credentials. **The PIN is a courtesy lock, not security**;
never describe it as protection and never store anything sensitive in an account.

Each account gets its own save slot. `store/accountScope.ts` re-points the game
stores at `<base>:<accountId>` and rehydrates. **Never `reset()` before
rehydrating** — `reset()` persists, so it would overwrite the account's save
with empty state and the rehydrate would read the wiped version back.

Swapping to hosted identity later means replacing `authStore` and the
namespacing in `accountScope` — nothing else depends on how accounts are stored.

## Project layout (`src/`)

- `routes/` — screens, three browse levels deep: `Systems` (worlds, `/`),
  `SystemScreen` (a world's sections), `SectionScreen` (a section's lessons),
  then `Lesson`. Plus `Workshop`, `Quests`, `Arcade`, `Duel`, `BeatTheClock`,
  `Collect` (shop), `Profile`, `Achievements`, `Settings`, `Welcome`.
- `components/` — `LessonPlayer` (the lesson engine), `EquationKeyboard`,
  `MathText`, `Mascot`/`MascotSays`, `PiPill`, `BottomNav`, `SpaceBackdrop`,
  `CountUp`.
- `store/` — Zustand: `playerStore` (economy, π, duel rating), `progressStore`
  (lessons + projects), `questStore`, `authStore`, `accountScope`,
  `settingsStore` (device preferences, _not_ per-account).
- `lib/` — **pure, unit-tested** logic: `economy` (XP/level/multiplier), `date`
  (streak/month keys), `answer` (normalising checker + `checkRoots`), `duel`
  (Elo + opponent simulation), `graph` (plane maths + answer validators),
  `random` (incl. **seeded** PRNG), `format`, `clock`. Keep impure calls out of
  components — reading `Date.now()` in a component body trips React's purity
  lint, so use `lib/clock`.
- `content/` — catalogues: `lessons` (sections + lessons), `lesson-steps`
  (**the authoring seam** for interactive content), `graph-lessons`,
  `graph-games`, `rocket` (the workshop project), `quickfire`
  (duel/timed question bank), `quests`, `shop`, `achievements`, `art` (which
  drawing stands for what).
- `styles/index.css` — the whole design system (tokens + component classes).
- `assets/` — the shipped WebP: `professorson/`, `planets/`, `nodes/`. Built
  from the PNGs in the repo-root `assets/`; see Art.

## Quests

Daily and monthly sets are drawn from pools in `content/quests.ts`, seeded by the
date so the same day always yields the same quests (a fresh `Math.random()` would
reroll them on every mount). Progress is pushed by `trackQuest(metric, amount)`
from wherever the event happens — nothing polls. Add a metric to `QuestMetric`
and call `trackQuest` at the event site.

## Adding a lesson

Add an entry to `LESSON_STEPS` in `src/content/lesson-steps.ts` keyed by lesson
id. Step kinds:

- `info` — explanation card, optional `equation`.
- `choice` — multiple choice; prose options render in the UI font, mathematical
  ones in the serif italic (detected by `lib/format.looksLikeMath`).
- `input` — one typed answer, matched against `accepted[]` after normalisation.
- `roots` — the x₁ / x₂ pair; matched order-insensitively by `lib/answer.checkRoots`.
- `fields` — several labelled blanks at once (a = ▢, D = ▢, x₁ = ▢): a whole
  method on one screen, each blank marked on its own.
- `canvas` — the same, with the labels taken away: the learner writes the
  left-hand side too, so _knowing which quantity to find next_ is part of the
  answer. Lines are matched in any order (`lib/answer.checkWork`) — finding D
  before naming the coefficients is a different route, not a mistake.
- `graph` — an interactive plane exercise; carries a `GraphTask` (see Graphs).

Every typed kind is laid out as a list of **answer lines** — label, field, tick —
so one keyboard, one marking rule and one Check serve all of them. The pad has no
letters, so a `canvas` step adds the `a b c D x₁ x₂` row to `EquationKeyboard`
(`names`); never author a `canvas` line whose name needs a key that row lacks —
`√` in particular is an _unlockable_ key and most learners cannot type it.

Any answerable step may carry a `hint`. The **Theory** button lives in the lesson
header, where the balance sits elsewhere, and greys out rather than disappearing
on steps with no hint — a control that moves is harder to reach for than one that
dims. A wrong attempt on a multi-line step prints the worked solution: "Answer:
2" does not say which line went wrong. Lessons with no entry fall back to a
placeholder screen. **`LessonPlayer` must stay keyed by lesson id** in
`routes/Lesson.tsx` — without it, navigating lesson→lesson leaks step/mistake state.

## Art

Raw art lives in the repo-root **`assets/`** (PNG, straight out of the image
tool). `npm run assets` converts it to the WebP under `src/assets/` that the app
actually imports — a single node medallion is 430 KB as a PNG and 19 KB as WebP,
and this is opened on phones over mobile data. **Nothing reads the PNGs at
runtime**, so drop a new one in, re-run the script, and reference the WebP.

`content/art.ts` decides what each drawing means: the ship's five build frames
(`ROCKET_STAGE_ART`, indexed by stages completed), one planet per star system,
and three medallion "seals" for the map states (purple = next up, gold = done,
blue = locked, drained by CSS) — gold because that is the app's colour for
reward and progress everywhere else. The **same seal art is used at both map depths** —
a planet on the system map and a level on the planet map are the same kind of
object one step apart, so they differ only in size and emphasis.

Professorson's moods are mapped to expressions in `Mascot.tsx`; the files are
named for the face, the `Mood` union for the moment it belongs to. The full-body
drawing is exported as `PROFESSORSON_FULL` for screens with room for a hero.

`SpaceBackdrop` is the app-wide backdrop, in three fixed layers behind every
screen: the painted starfield (`assets/background.png` → `background.webp`),
a 6-second silent loop from `public/media/` over it, and a light
wash for text contrast. No screen paints its own background.

The artwork is landscape, so a portrait phone sees only about a quarter of its
width — and dead centre is its emptiest quarter. `background-position` shifts to
`76%` on tall viewports so a nebula lands in frame rather than being cropped
away: one file, aimed rather than re-cut.

The video is decoration and must stay that way: `prefers-reduced-motion` hides
only it, and the painting stays, so **no screen may depend on the loop being
visible**. It is precached (`mp4` is in the PWA `globPatterns`) and nudged back
into play on `visibilitychange`, since a paused loop reads as a broken image.

## Graphs

Graph work is **data-driven**: an exercise is a `GraphTask` (`types/graph-task.ts`)
and the same component runs it everywhere — lessons, project missions and the
mini-games. Adding graph content should never mean editing a component.

- `lib/graph.ts` — pure maths: `evaluate`, `roots`, `vertex`, `discriminant`,
  viewport transforms (`toSvg`/`toMath`), and the validators.
- `components/graph/GraphCanvas.tsx` — the plane. Pointer-based, converted
  through `getBoundingClientRect` so taps stay correct at any rendered size.
  Deliberately undecorated inside the axes: it is an instrument, not scenery.
- `components/graph/GraphTaskView.tsx` — runs one task and reports a verdict.

Task kinds: `plot-point`, `plot-roots`, `find-vertex`, `parameters` (a/b/c
sliders, goal is either `match-function` or `hit-targets`), `identify` (graph +
multiple choice).

**Validation is mathematical, never pixel-based.** A tap is checked against the
real root/vertex within a tolerance in _graph units_, so a near-miss counts and
the neighbouring lattice point does not. If you add a check, add it to
`lib/graph` and keep `GraphTaskView`'s per-point colouring using the same rule —
colours that disagree with the verdict read as a bug.

Content is guarded by tests rather than proofreading: `content/__tests__/
graph-lessons.test.ts` asserts every authored task is solvable and on-screen, and
`graph-games.test.ts` runs each generator over many seeds and the whole
difficulty ramp (including a brute-force check that every Trajectory round is
reachable with the sliders). Both have already caught real authoring bugs.

## Arcade

`/arcade` collects the repeatable drills — Beat the Clock and the eight graph
mini-games. Lessons pay π once; the arcade pays every run, so it is where a
player goes when nothing new is unlocked. Games are generators
(`content/graph-games.ts`), seeded per run, with difficulty climbing across the
eight rounds. Two map nodes (`q8-11`, `q8-12`) open games instead of lessons via
`GAME_FOR_LEVEL`; a run only ticks the map node if that node is unlocked, since
the arcade can be opened directly.

## The workshop project

REACH ALGEbaran is **five stages of three missions** (`content/rocket.ts`).
Difficulty climbs twice over: within a stage (mission 1 → 3) and across them
(arithmetic → linear → factoring → the formula → everything at once). Finishing
a stage advances the drawing; finishing all five lights the engine, lifts the
ship off and unlocks the **Shipwright** achievement.

The art has **one frame per stage** and the screen indexes into it, so the stage
count is not a free parameter — `content/__tests__/rocket.test.ts` pins it, along
with unique ids, a valid prerequisite chain, rewards that climb, and every
mission having something to answer.

**Mission ids key the server's `rewards` table.** Change one and re-run
`node scripts/generate-seed.mjs`, then re-apply `supabase/migrations/0002_seed.sql`.

## Screens & chrome

Icons come from **lucide-react**, imported one at a time so the set never lands
in the bundle whole. They are stroke-only and painted with `currentColor`, which
is what makes the nav's active state a single colour change. Do not hand-draw an
icon that lucide already has.

Layout rules the screens are built to: mobile-first, `100dvh` (never a fixed
height), fixed bottom nav, 44×44px minimum touch target, animations 150–300ms
and skipped under `prefers-reduced-motion` (there is a global override in
`index.css` — do not fight it per-component).

- **Worlds** (`/`) — the front door. One planet fills the hero, neighbours peek
  in at the edges, and the title/percentage/dots below follow whichever is
  centred. The pager is a scroll-snap container: swipe, trackpad and the arrow
  buttons all move one scroll position, so there is a single source of truth for
  which world is showing. **The item is `flex: 0 0 100%`** — a percentage
  flex-basis resolves against the _content_ box, and that is the one ratio that
  keeps the current planet exactly centred whatever the gutters work out to.
- **Sections** (`/system/:id`) — the world's sections as seals in a column,
  joined by a hairline, each wearing its glyph.
- **Lessons** (`/section/:id`) — the deepest level, and a list rather than a
  map: at this depth the question is "which one is next", and a numbered column
  answers it faster than a trail does. Rows read done / current / upcoming /
  locked; only the first two open. **Upcoming is presentational** — the model has
  three states, and showing the next two rows as empty circles instead of
  padlocks says "not yet" rather than "shut".
- **Lesson** (`/lesson/:id`) — the one screen that is **paper from edge to
  edge** rather than cards on the backdrop: when the whole screen is the
  content, a card is a paper rectangle on a paper background. `.lesson-screen`
  is a `100dvh` column — header and action pinned, the middle the only thing
  that scrolls — so **the Check never moves**, whether the step is three words
  or a six-line worksheet. The chrome built for the dark screens (`icon-btn`,
  `steps`) is re-tinted under `.lesson-screen`. A graph step hands its Check up
  to that bar (`submitRef` / `onReadyChange` on `GraphTaskView`) and keeps only
  Clear inline; without those props the task carries its own button, which is
  how the arcade still runs it.
- **Result** — the reward is the centrepiece; `CountUp` ticks the numbers in
  under 600ms and hands reduced-motion users the final figure immediately.
- **Settings** (`/settings`, behind the gear on Profile) — only rows that do
  something. There is no Sound or Music switch because there is no sound yet,
  and a toggle that controls nothing is worse than a missing one. Haptics is
  real: every buzz goes through `lib/haptics.buzz`, never `navigator.vibrate`
  directly.

The **shop stays π-only**. No real-money tier, however the design is drawn —
see the soft-currency note under Key decisions.

## Commands

`npm run dev` · `npm test` · `npm run lint` · `npm run typecheck` ·
`npm run format` · `npm run build` · `npm run preview` · `npm run assets`

For a GitHub Pages subpath build: `VITE_BASE=/algebaran/ npm run build`.

Before committing non-trivial changes, run `npm run typecheck && npm run lint && npm test`.
