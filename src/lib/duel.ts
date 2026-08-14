/**
 * Duel maths: Elo rating changes and the simulated opponent.
 *
 * Until there is an online player pool, every duel is against Professorson. He
 * is not a fixed dummy — his rating is drawn near the player's own, so matches
 * stay competitive as they improve, and his answers are simulated from that
 * rating rather than scripted.
 */

export const STARTING_RATING = 1000;
const K_FACTOR = 32;

export type DuelOutcome = 'win' | 'loss' | 'draw';

/** Probability that `rating` beats `opponentRating` under the Elo model. */
export function expectedScore(rating: number, opponentRating: number): number {
  return 1 / (1 + 10 ** ((opponentRating - rating) / 400));
}

/**
 * Rating change for a result. Beating a stronger opponent is worth more than
 * beating a weaker one, and losing to a weaker one costs more — which is the
 * "rating increases based on your opponent's rating" rule.
 */
export function ratingDelta(rating: number, opponentRating: number, outcome: DuelOutcome): number {
  const actual = outcome === 'win' ? 1 : outcome === 'draw' ? 0.5 : 0;
  return Math.round(K_FACTOR * (actual - expectedScore(rating, opponentRating)));
}

/** Ratings never drop below this, so a bad run can't spiral. */
export const RATING_FLOOR = 100;

export function applyRatingDelta(rating: number, delta: number): number {
  return Math.max(RATING_FLOOR, rating + delta);
}

/** Picks an opponent rating close to the player's, within sane bounds. */
export function matchmakeRating(playerRating: number, rng: () => number): number {
  const spread = Math.round((rng() * 2 - 1) * 120);
  return Math.max(RATING_FLOOR, Math.round(playerRating + spread));
}

export interface OpponentAnswer {
  correct: boolean;
  /** Milliseconds Professorson "took" to answer. */
  ms: number;
}

/**
 * Simulates one opponent answer. Higher rating → more accurate and faster.
 * Accuracy runs from ~55% at 400 to ~95% at 2000; time from ~6s down to ~1.6s.
 */
export function simulateAnswer(rating: number, rng: () => number): OpponentAnswer {
  const skill = Math.min(1, Math.max(0, (rating - 400) / 1600));
  const accuracy = 0.55 + skill * 0.4;
  const baseMs = 6000 - skill * 4400;
  // ±35% jitter so he feels human rather than metronomic.
  const ms = Math.round(baseMs * (0.65 + rng() * 0.7));
  return { correct: rng() < accuracy, ms };
}

/**
 * Decides a duel: more correct answers wins; ties break on total time, so being
 * both accurate *and* fast is what actually wins.
 */
export function decideDuel(
  player: { correct: number; ms: number },
  opponent: { correct: number; ms: number },
): DuelOutcome {
  if (player.correct !== opponent.correct) {
    return player.correct > opponent.correct ? 'win' : 'loss';
  }
  if (player.ms === opponent.ms) return 'draw';
  return player.ms < opponent.ms ? 'win' : 'loss';
}
