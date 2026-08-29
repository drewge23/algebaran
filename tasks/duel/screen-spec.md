# Duel — Professorson Arena

## Purpose

Make a short skill test feel like a meaningful head-to-head encounter. Until
online matchmaking exists, Professorson is the only opponent; his rating is
matched near the learner's and his simulated answers preserve fair Elo rules.

## User flow

`Home → Duel lobby → five shared questions → result → rematch or close`

The lobby identifies the opponent and stakes before a learner starts. The play
screen removes all non-essential UI so the question and answers dominate. The
result shows accuracy first, speed second, then the rating consequence.

## Components

- **Arena:** learner and Professorson are visually equal opponents, joined by
  quiet orbital rings rather than two competing cards.
- **Match brief:** five questions, accuracy-and-speed rule, π reward and CTA.
- **Play HUD:** scores and round number only.
- **Result:** outcome mark, score/time comparison, rating delta, reward and
  rematch.

## Implementation constraints

- Reuse `lib/duel.ts`: no scoring or Elo rules live in the UI.
- Reuse the approved Professorson full-body asset; no generated image is needed
  to ship this screen.
- Use i18n for all interface text and 44 px minimum touch targets.
