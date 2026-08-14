import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Mascot, MascotSays } from '@/components/Mascot';
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
    navigator.vibrate?.(right ? 10 : [15, 30, 15]);

    if (index + 1 >= QUESTIONS) {
      finish(mine, theirs);
    } else {
      setIndex((i) => i + 1);
      askedAt.current = now();
    }
  };

  if (phase === 'lobby') {
    return (
      <div className="screen screen--scroll">
        <TopBar onBack={() => navigate('/')} title={t('duel.title')} />
        <MascotSays mood="wink" small name>
          {t('duel.taunt')}
        </MascotSays>

        <div className="versus">
          <div className="versus__side">
            <div className="versus__avatar">{account?.avatar ?? '🧑‍🚀'}</div>
            <div className="versus__name">{account?.name ?? t('duel.you')}</div>
            <div className="versus__rating">{rating}</div>
          </div>
          <div className="versus__vs">{t('duel.vs')}</div>
          <div className="versus__side">
            <div className="versus__avatar versus__avatar--art">
              <Mascot mood="excited" small />
            </div>
            <div className="versus__name">Professorson</div>
            <div className="versus__rating">{foeRating}</div>
          </div>
        </div>

        <div className="card">
          <div className="card__kicker">⚔️ {t('duel.title')}</div>
          <h2 className="card__question">{t('duel.rulesTitle', { count: QUESTIONS })}</h2>
          <p className="card__body">{t('duel.rules', { pi: WIN_PI })}</p>
          <div style={{ marginTop: 20 }}>
            <button type="button" className="btn btn--primary" onClick={start}>
              {t('duel.start')} →
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'result') {
    const headline =
      outcome === 'win' ? t('duel.won') : outcome === 'loss' ? t('duel.lost') : t('duel.drew');
    return (
      <div className="screen">
        <div className="result pop">
          <div className="result__stars">
            {outcome === 'win' ? '🏆' : outcome === 'draw' ? '🤝' : '💀'}
          </div>
          <h1 className="result__headline">{headline}</h1>

          <div className="stat-grid" style={{ width: '100%' }}>
            <div className="stat">
              <div className="stat__label">{t('duel.you')}</div>
              <div className="stat__value" style={{ color: 'var(--green)' }}>
                {me.correct}/{QUESTIONS}
              </div>
              <div className="tiny dim">{(me.ms / 1000).toFixed(1)}s</div>
            </div>
            <div className="stat">
              <div className="stat__label">Professorson</div>
              <div className="stat__value">
                {foe.correct}/{QUESTIONS}
              </div>
              <div className="tiny dim">{(foe.ms / 1000).toFixed(1)}s</div>
            </div>
          </div>

          <div
            className={`rating-delta${delta >= 0 ? ' rating-delta--up' : ' rating-delta--down'}`}>
            {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)} → {rating}
          </div>
          {reward > 0 && <div className="result__reward">+{reward} π</div>}

          <MascotSays mood={outcome === 'win' ? 'thinking' : 'proud'}>
            {outcome === 'win' ? t('duel.mascotLost') : t('duel.mascotWon')}
          </MascotSays>
        </div>

        <div
          className="btn--wide-pair"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}>
          <button type="button" className="btn btn--primary" onClick={rematch}>
            {t('duel.again')}
          </button>
          <button type="button" className="btn btn--ghost btn--auto" onClick={() => navigate('/')}>
            {t('common.close')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <TopBar onBack={() => navigate('/')} title={t('duel.title')} />

      <div className="duel-hud">
        <span className="duel-hud__side">
          {account?.avatar ?? '🧑‍🚀'} {me.correct}
        </span>
        <span className="duel-hud__progress">{progress}</span>
        <span className="duel-hud__side">{foe.correct} 🧑‍🔬</span>
      </div>

      <div
        className={`card fade-in${lastRight === null ? '' : lastRight ? ' card--right' : ' card--wrong'}`}
        key={index}>
        <div className="card__kicker">💡 {question?.prompt}</div>
        {question && <MathText>{question.equation}</MathText>}
        <hr className="card__rule" />
        <div className="choices">
          {question?.options.map((option, i) => (
            <button
              type="button"
              key={`${index}-${i}`}
              className="choice choice__math"
              onClick={() => answer(i)}>
              {option}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }} />
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
        <span className="pi-coin" aria-hidden="true">
          ⚔
        </span>
        <span className="pi-pill__value pi-pill__value--dim">{rating}</span>
      </div>
    </div>
  );
}
