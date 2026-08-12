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
- **No webfonts.** UI uses the system stack; **mathematics uses a serif italic**
  (`--font-math`) so equations read like a textbook at zero download cost.
- **Equations are plain Unicode strings** (`x²`, true minus `−`) rendered by
  `MathText` — deliberately no KaTeX/MathJax. Answer checking normalises input
  (see `lib/answer.ts`), so `x^2+3x-10=0` matches `x²+3x−10=0`.
- **English-first, i18n-ready**: all UI chrome goes through `src/i18n`. Lesson
  _content_ is authored in English; localising it is a later, separate pass.
- **Soft currency only** — no real-money IAP. Shop, fortune cookies, unlockable
  keyboard keys and multipliers all run on earned π.

## Project layout (`src/`)

- `routes/` — screens: `LessonMap` (home star map), `Lesson`, `Collect` (shop),
  `Profile`, `Achievements`.
- `components/` — `LessonPlayer` (the lesson engine), `EquationKeyboard`,
  `MathText`, `Mascot`/`MascotSays`, `PiPill`, `BottomNav`.
- `store/` — Zustand: `playerStore` (economy/profile, π), `progressStore`
  (lesson completion + stars).
- `lib/` — **pure, unit-tested** logic: `economy` (XP/level/multiplier), `date`
  (streak), `answer` (normalising checker), `format`, `random`. Keep impure calls
  out of components.
- `content/` — catalogues: `lessons` (sections + lessons), `lesson-steps`
  (**the authoring seam** for interactive content), `shop`, `achievements`.
- `styles/index.css` — the whole design system (tokens + component classes).
- `assets/professorson/` — mascot art, one file per mood.

## Adding a lesson

Add an entry to `LESSON_STEPS` in `src/content/lesson-steps.ts` keyed by lesson
id. Steps are `info` | `choice` | `input`. Lessons with no entry fall back to a
placeholder screen. **`LessonPlayer` must stay keyed by lesson id** in
`routes/Lesson.tsx` — without it, navigating lesson→lesson leaks step/mistake state.

## Commands

`npm run dev` · `npm test` · `npm run lint` · `npm run typecheck` ·
`npm run format` · `npm run build` · `npm run preview`

For a GitHub Pages subpath build: `VITE_BASE=/algebaran/ npm run build`.

Before committing non-trivial changes, run `npm run typecheck && npm run lint && npm test`.
