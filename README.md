# Algebaran 🪐

A gamified mobile app that teaches **quadratic equations**. Built with Expo +
React Native + TypeScript. Cosmic theme, soft-currency economy (**Stardust**),
streaks, achievements, a shop, and a star-map curriculum.

## Getting started

```bash
yarn install
yarn start
```

Then open the app on your iPhone:

1. Install **Expo Go** from the App Store.
2. Scan the QR code printed by `yarn start` with the Camera app.

No Xcode or Android Studio required for development.

## Scripts

| Command | Description |
| --- | --- |
| `yarn start` | Start the Expo dev server (QR for Expo Go) |
| `yarn ios` / `yarn android` | Open in a simulator/emulator (needs Xcode/Android Studio) |
| `yarn test` | Run the Jest test suite |
| `yarn lint` | ESLint |
| `yarn typecheck` | `tsc --noEmit` |
| `yarn format` | Prettier write |
| `yarn build` | Export a production JS bundle (`expo export`) |

## Project structure

```
src/
  app/            Expo Router routes (loading → tabs; lesson, hints, achievements)
  store/          Zustand stores (player economy, lesson progress, hydration)
  lib/            Pure, unit-tested logic (economy, streak dates, random)
  content/        Data catalogues (lessons, shop, achievements)
  components/     Screen, buttons, stat pills, icons
  constants/      Theme (cosmic colors + gradients)
  i18n/           i18next setup + en/ru locale files
```

See [CLAUDE.md](CLAUDE.md) for architecture notes and conventions.

## Status

Scaffold complete: navigation, theming, i18n, persistence, and the full
gamification economy (Stardust, XP/levels, streaks, shop, achievements) are
wired. Lesson screens are skeletons that already run the reward loop; the
interactive quadratic-equation content is the next phase.
