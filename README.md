# Algebaran 🪐

A gamified web app that teaches **quadratic equations** — installable to your
phone's home screen, works offline. Cosmic theme, soft currency (**π**), streaks,
achievements, a shop with unlockable keyboard keys, and a star-map curriculum
guided by Professor **Professorson**.

## Run it locally

```bash
npm install
npm run dev
```

Then open the printed URL. `npm run dev` also prints a **Network** address — open
that on your phone (same Wi-Fi) to try it there.

## Install on a phone

1. Open the deployed URL in the phone's browser.
2. **iOS Safari**: Share → _Add to Home Screen_. **Android Chrome**: menu → _Install app_.

It then launches full-screen like a native app and works offline.

## Scripts

| Command             | Description                         |
| ------------------- | ----------------------------------- |
| `npm run dev`       | Dev server with hot reload          |
| `npm run build`     | Production build (+ service worker) |
| `npm run preview`   | Serve the production build locally  |
| `npm test`          | Unit tests (Vitest)                 |
| `npm run lint`      | ESLint                              |
| `npm run typecheck` | TypeScript, no emit                 |
| `npm run format`    | Prettier                            |

Deploying under a subpath (e.g. GitHub Pages project site):

```bash
VITE_BASE=/algebaran/ npm run build
```

## Project structure

```
src/
  routes/       Screens: star map, lesson, collect, profile, achievements
  components/   LessonPlayer, EquationKeyboard, MathText, Mascot, PiPill, BottomNav
  store/        Zustand stores (player economy, lesson progress) → localStorage
  lib/          Pure, unit-tested logic (economy, streaks, answer checking)
  content/      Lesson catalogue + authored lesson steps, shop, achievements
  styles/       Design system (CSS tokens + components)
  assets/       Professorson mascot art
```

See [CLAUDE.md](CLAUDE.md) for architecture notes, conventions, and how to author
a new lesson.

## Status

Playable prototype covering **all 8 curriculum sections**. Navigation, theming,
i18n (EN/RU), persistence and the full gamification economy are wired. The lesson
engine supports explanation cards, multiple choice, typed equations and two-root
solutions via a custom on-screen keyboard, plus a timed "Beat the Clock" bonus
round.

Next: more problems per section, and the exam / olympiad nodes from the design.
