@AGENTS.md

# Algebaran

A gamified math mobile app that teaches **quadratic equations**. Cosmic theme
(the name plays on *Aldebaran*, the brightest star in Taurus): the in-app soft
currency is **Stardust**, progression is a journey across a star map.

## Stack

- **Expo SDK 57** (managed), **React Native 0.86**, **React 19.2**, **TypeScript**
- **Expo Router** (file-based routing, typed routes, React Compiler enabled)
- **Zustand + persist** over **AsyncStorage** for state & local save
- **i18n**: `i18next` + `react-i18next` + `expo-localization` (English-first, RU ready)
- **Reanimated 4 / Moti / expo-haptics** for animation & feel
- **Jest** (`jest-expo`) + Testing Library; **ESLint** (`eslint-config-expo`) + Prettier

## Key decisions / constraints

- **English-first, i18n-ready**: all UI chrome goes through `src/i18n`. Lesson
  *content* is authored in English for now; localising it is a later, separate pass.
- **Dev preview = Expo Go on a physical iPhone** (no Xcode/Android Studio installed).
  `yarn start`, then scan the QR with the Camera app.
- **Soft currency only** — no real-money IAP in v1. Shop, fortune cookies and
  multipliers all run on earned Stardust.
- **Version pins matter**: `jest@29` and `eslint@9` are pinned because Expo 57 /
  RN 0.86 tooling is not yet compatible with jest 30 / eslint 10. Do not bump
  them without checking `jest-expo` / `eslint-config-expo` support.

## Project layout (`src/`)

- `app/` — Expo Router routes. `index.tsx` = loading gate → `(tabs)/` (home,
  shop, profile); `lesson/[id].tsx`, `hints.tsx` (modal), `achievements.tsx`.
- `store/` — Zustand stores: `playerStore` (economy/profile), `progressStore`
  (lesson completion), `useHydration` (gates the app on rehydration).
- `lib/` — **pure, unit-tested** logic: `economy` (XP/level/multiplier),
  `date` (streak), `random`. Keep impure calls (Math.random) out of components.
- `content/` — data catalogues: `lessons` (sections + lessons), `shop`, `achievements`.
- `components/` — `Screen` (gradient backdrop), `PrimaryButton`, `StatPill`,
  `ui/icon` (emoji placeholders; real icons are a design-phase task).
- `constants/theme.ts` — cosmic `Colors` (light+dark) + `Gradients`.

## Commands

`yarn start` · `yarn ios` · `yarn test` · `yarn lint` · `yarn typecheck` ·
`yarn format` · `yarn build` (= `expo export`).

Before committing non-trivial changes, run `yarn typecheck && yarn lint && yarn test`.
