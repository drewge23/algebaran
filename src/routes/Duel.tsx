import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { MascotSays, PROFESSORSON_FULL } from '@/components/Mascot';
import { MathText } from '@/components/MathText';
import { QUICKFIRE, type QuickQuestion } from '@/content/quickfire';
import {
  decideDuel,
  matchmakeRating,
  ratingDelta,
  simulateAnswer,
  type DuelOutcome,
} from '@/lib/duel';
import { now, since } from '@/lib/clock';
import { seededRandom, shuffle } from '@/lib/random';
import { selectCurrentAccount, useAuthStore } from '@/store/authStore';
import { usePlayerStore } from '@/store/playerStore';
import { trackQuest } from '@/store/questStore';
import { buzz } from '@/lib/haptics';

const QUESTIONS = 5;
/** π for winning a duel; a draw pays half, a loss nothing. */
const WIN_PI = 30;

type Phase = 'lobby' | 'playing' | 'result';

interface Tally {
  correct: number;
  ms: number;
}

/**
 * Duels against Professorson. There is no online pool yet, so he stands in for
 * a human opponent: matched near the player's rating and simulated from it, so
 * the rating exchange means the same thing it will when real opponents arrive.
 */
export function Duel() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const account = useAuthStore(selectCurrentAccount);
  const rating = usePlayerStore((s) => s.rating);
  const duelWins = usePlayerStore((s) => s.duelWins);
  const duelLosses = usePlayerStore((s) => s.duelLosses);
  const earnPi = usePlayerStore((s) => s.earnPi);
  const applyDuelResult = usePlayerStore((s) => s.applyDuelResult);
  const registerActivity = usePlayerStore((s) => s.registerActivity);

  const [phase, setPhase] = useState<Phase>('lobby');
  const [queue, setQueue] = useState<QuickQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [me, setMe] = useState<Tally>({ correct: 0, ms: 0 });
  const [foe, setFoe] = useState<Tally>({ correct: 0, ms: 0 });
  const [outcome, setOutcome] = useState<DuelOutcome>('draw');
  const [delta, setDelta] = useState(0);
  const [reward, setReward] = useState(0);
  const [lastRight, setLastRight] = useState<boolean | null>(null);

  const askedAt = useRef(0);
  const rngRef = useRef(seededRandom('duel'));

  // The opponent is matched *before* the lobby renders and is never re-rolled
  // on start — otherwise the player would be shown one rating and fight
  // another. A rematch goes back to the lobby so a new opponent is seen first.
  const [foeRating, setFoeRating] = useState(() =>
    matchmakeRating(rating, seededRandom(`foe-${rating}-${duelWins}-${duelLosses}`)),
  );

  const question = queue[index];
  const progress = useMemo(() => `${Math.min(index + 1, QUESTIONS)} / ${QUESTIONS}`, [index]);

  /** Draws a fresh opponent and shows them in the lobby before the next bout. */
  const rematch = () => {
    const rng = seededRandom(`duel-${now()}`);
    rngRef.current = rng;
    setFoeRating(matchmakeRating(rating, rng));
    setPhase('lobby');
  };

  const start = () => {
    rngRef.current = seededRandom(`duel-${now()}`);
    setQueue(shuffle(QUICKFIRE).slice(0, QUESTIONS));
    setIndex(0);
    setMe({ correct: 0, ms: 0 });
    setFoe({ correct: 0, ms: 0 });
    setLastRight(null);
    askedAt.current = now();
    setPhase('playing');
  };

  const finish = (mine: Tally, theirs: Tally) => {
    const result = decideDuel(mine, theirs);
    const d = ratingDelta(rating, foeRating, result);
    applyDuelResult(result, d);
    registerActivity();

    const payout = result === 'win' ? WIN_PI : result === 'draw' ? Math.round(WIN_PI / 2) : 0;
    setReward(payout > 0 ? earnPi(payout) : 0);

    trackQuest('duelsPlayed');
    if (result === 'win') trackQuest('duelsWon');
    if (payout > 0) trackQuest('piEarned', payout);

    setOutcome(result);
    setDelta(d);
    setPhase('result');
  };

  const answer = (choice: number) => {
    if (phase !== 'playing' || !question) return;
    const elapsed = since(askedAt.current);
    const right = choice === question.correctIndex;

    // Professorson answers the same question independently.
    const his = simulateAnswer(foeRating, rngRef.current);

    const mine: Tally = { correct: me.correct + (right ? 1 : 0), ms: me.ms + elapsed };
    const theirs: Tally = { correct: foe.correct + (his.correct ? 1 : 0), ms: foe.ms + his.ms };
    setMe(mine);
    setFoe(theirs);
    setLastRight(right);
    buzz(right ? 10 : [15, 30, 15]);

    if (index + 1 >= QUESTIONS) {
      finish(mine, theirs);
    } else {
      setIndex((i) => i + 1);
      askedAt.current = now();
    }
  };

  if (phase === 'lobby') {
    return (
      <div className="screen screen--scroll duel-screen">
        <TopBar onBack={() => navigate('/quests')} title={t('duel.title')} />

        <main className="duel-lobby">
          <div className="duel-lobby__eyebrow">{t('duel.matchFound')}</div>
          <div className="duel-arena" aria-label={t('duel.matchupLabel')}>
            <div className="duel-fighter duel-fighter--player">
              <div className="duel-fighter__avatar">{account?.avatar ?? '🧑‍🚀'}</div>
              <div className="duel-fighter__label">{t('duel.you')}</div>
              <div className="duel-fighter__name">{account?.name ?? t('duel.explorer')}</div>
              <div className="duel-fighter__rating">{rating}</div>
            </div>

            <div className="duel-arena__core" aria-hidden="true">
              <span className="duel-arena__orbit duel-arena__orbit--one" />
              <span className="duel-arena__orbit duel-arena__orbit--two" />
              <span className="duel-arena__vs">{t('duel.vs')}</span>
              <span className="duel-arena__caption">{t('duel.ratingMatch')}</span>
            </div>

            <div className="duel-fighter duel-fighter--professor">
              <div className="duel-fighter__portrait">
                <img src={PROFESSORSON_FULL} alt="Professorson" draggable={false} />
              </div>
              <div className="duel-fighter__label">{t('duel.opponent')}</div>
              <div className="duel-fighter__name">Professorson</div>
              <div className="duel-fighter__rating">{foeRating}</div>
            </div>
          </div>

          <div className="duel-match-meta">
            <span>⚡ {t('duel.questions', { count: QUESTIONS })}</span>
            <span>◈ {t('duel.ratingAtStake')}</span>
          </div>

          <section className="duel-brief">
            <div className="duel-brief__icon" aria-hidden="true">
              ⚔
            </div>
            <div>
              <h1>{t('duel.rulesTitle', { count: QUESTIONS })}</h1>
              <p>{t('duel.rules', { pi: WIN_PI })}</p>
            </div>
            <button type="button" className="btn btn--primary duel-brief__cta" onClick={start}>
              {t('duel.start')} <span aria-hidden="true">→</span>
            </button>
          </section>

          <MascotSays mood="wink" small name>
            {t('duel.taunt')}
          </MascotSays>
        </main>
      </div>
    );
  }

  if (phase === 'result') {
    const headline =
      outcome === 'win' ? t('duel.won') : outcome === 'loss' ? t('duel.lost') : t('duel.drew');
    const mark = outcome === 'win' ? '✦' : outcome === 'draw' ? '≈' : '×';
    return (
      <div className="screen duel-screen duel-screen--result">
        <TopBar onBack={() => navigate('/quests')} title={t('duel.title')} />
        <main className="duel-result pop">
          <div className={`duel-result__mark duel-result__mark--${outcome}`}>{mark}</div>
          <div className="duel-result__eyebrow">{t(`duel.${outcome}Label`)}</div>
          <h1 className="duel-result__headline">{headline}</h1>

          <div className="duel-scoreboard">
            <div className="duel-scoreboard__fighter">
              <span className="duel-scoreboard__avatar">{account?.avatar ?? '🧑‍🚀'}</span>
              <span>{account?.name ?? t('duel.you')}</span>
              <strong>{me.correct}</strong>
              <small>{(me.ms / 1000).toFixed(1)}s</small>
            </div>
            <span className="duel-scoreboard__divider">{t('duel.vs')}</span>
            <div className="duel-scoreboard__fighter">
              <span className="duel-scoreboard__avatar">🧑‍🔬</span>
              <span>Professorson</span>
              <strong>{foe.correct}</strong>
              <small>{(foe.ms / 1000).toFixed(1)}s</small>
            </div>
          </div>

          <div
            className={`duel-result__rating${delta >= 0 ? ' duel-result__rating--up' : ' duel-result__rating--down'}`}>
            {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)} → {rating}
          </div>
          {reward > 0 && <div className="duel-result__reward">+{reward} π</div>}

          <MascotSays mood={outcome === 'win' ? 'thinking' : 'proud'}>
            {outcome === 'win' ? t('duel.mascotLost') : t('duel.mascotWon')}
          </MascotSays>
        </main>

        <div className="duel-result__actions">
          <button type="button" className="btn btn--primary" onClick={rematch}>
            {t('duel.again')}
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--auto"
            onClick={() => navigate('/quests')}>
            {t('common.close')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen duel-screen duel-screen--play">
      <header className="duel-play-hud">
        <button
          type="button"
          className="icon-btn"
          aria-label={t('common.back')}
          onClick={() => navigate('/quests')}>
          ←
        </button>
        <div className="duel-play-hud__fighter">
          <span>{account?.avatar ?? '🧑‍🚀'}</span>
          <strong>{me.correct}</strong>
        </div>
        <div className="duel-play-hud__round">
          <span>{t('duel.round')}</span>
          <strong>{progress}</strong>
        </div>
        <div className="duel-play-hud__fighter duel-play-hud__fighter--foe">
          <strong>{foe.correct}</strong>
          <span>🧑‍🔬</span>
        </div>
      </header>

      <main
        className={`duel-question fade-in${lastRight === null ? '' : lastRight ? ' duel-question--right' : ' duel-question--wrong'}`}
        key={index}>
        <p className="duel-question__prompt">{question?.prompt}</p>
        {question && <MathText>{question.equation}</MathText>}
        <div className="duel-question__line" />
        <div className="duel-choices">
          {question?.options.map((option, i) => (
            <button
              type="button"
              key={`${index}-${i}`}
              className="duel-choice choice__math"
              onClick={() => answer(i)}>
              <span className="duel-choice__index">{String.fromCharCode(65 + i)}</span>
              {option}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}

function TopBar({ onBack, title }: { onBack: () => void; title: string }) {
  const { t } = useTranslation();
  const rating = usePlayerStore((s) => s.rating);
  return (
    <div className="topbar">
      <button type="button" className="icon-btn" aria-label={t('common.back')} onClick={onBack}>
        ←
      </button>
      <div className="grow" style={{ fontWeight: 800, fontSize: 17 }}>
        {title}
      </div>
      <div className="pi-pill">
        <span className="rating-coin" aria-hidden="true">
          ⚔
        </span>
        <span className="pi-pill__value pi-pill__value--dim">{rating}</span>
      </div>
    </div>
  );
}
