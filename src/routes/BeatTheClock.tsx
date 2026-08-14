import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { MascotSays } from '@/components/Mascot';
import { MathText } from '@/components/MathText';
import { PiPill } from '@/components/PiPill';
import { QUICKFIRE, type QuickQuestion } from '@/content/quickfire';
import { now } from '@/lib/clock';
import { shuffle } from '@/lib/random';
import { usePlayerStore } from '@/store/playerStore';
import { useProgressStore } from '@/store/progressStore';
import { trackQuest } from '@/store/questStore';

const ROUND_SECONDS = 60;
/** π per correct answer, before the player's income multiplier. */
const PI_PER_CORRECT = 4;
/** The bonus round stands in for this curriculum entry on the star map. */
const BONUS_LESSON_ID = 'beat-the-clock-1';

/** Score thresholds for 1 / 2 / 3 stars on the map node. */
function starsForScore(correct: number): number {
  if (correct >= 14) return 3;
  if (correct >= 9) return 2;
  return 1;
}

type Phase = 'ready' | 'playing' | 'done';

/**
 * The timed bonus round: answer as many quick recall questions as possible
 * before the clock runs out. Wrong answers cost time rather than ending the run,
 * so the pressure is on pace, not perfection.
 */
export function BeatTheClock() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const earnPi = usePlayerStore((s) => s.earnPi);
  const registerActivity = usePlayerStore((s) => s.registerActivity);
  const completeLesson = useProgressStore((s) => s.completeLesson);

  const [phase, setPhase] = useState<Phase>('ready');
  const [queue, setQueue] = useState<QuickQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [msLeft, setMsLeft] = useState(ROUND_SECONDS * 1000);
  const [flash, setFlash] = useState<'right' | 'wrong' | null>(null);
  const [awarded, setAwarded] = useState(0);

  // Kept in a ref so the ticking effect never needs to re-subscribe.
  const endsAt = useRef(0);
  // Mirrors `correct` so the timer can read the final score without going
  // through a state updater (see the interval below).
  const correctRef = useRef(0);

  const finish = useCallback(
    (finalCorrect: number) => {
      setPhase('done');
      setMsLeft(0);
      if (finalCorrect > 0) {
        // Unlike lessons, the bonus round pays out every run — it is the
        // repeatable π faucet — but the map records only your best result.
        const payout = finalCorrect * PI_PER_CORRECT;
        setAwarded(earnPi(payout));
        registerActivity();
        completeLesson(BONUS_LESSON_ID, starsForScore(finalCorrect));
        trackQuest('piEarned', payout);
        trackQuest('clockCorrect', finalCorrect);
      }
      trackQuest('clockRounds');
    },
    [earnPi, registerActivity, completeLesson],
  );

  const start = () => {
    setQueue(shuffle(QUICKFIRE));
    setIndex(0);
    setCorrect(0);
    correctRef.current = 0;
    setWrong(0);
    setFlash(null);
    setAwarded(0);
    endsAt.current = now() + ROUND_SECONDS * 1000;
    setMsLeft(ROUND_SECONDS * 1000);
    setPhase('playing');
  };

  // Drive the countdown off wall-clock time so a backgrounded tab cannot gain
  // extra seconds by missing ticks.
  useEffect(() => {
    if (phase !== 'playing') return;
    const id = setInterval(() => {
      const remaining = endsAt.current - now();
      if (remaining <= 0) {
        setMsLeft(0);
        // Read the score from a ref: calling finish() inside a setState updater
        // ran it during render, which then wrote to the player store and warned
        // about updating one component while rendering another.
        finish(correctRef.current);
      } else {
        setMsLeft(remaining);
      }
    }, 100);
    return () => clearInterval(id);
  }, [phase, finish]);

  const answer = (choiceIndex: number) => {
    if (phase !== 'playing') return;
    const question = queue[index % queue.length];
    const isRight = choiceIndex === question.correctIndex;

    if (isRight) {
      correctRef.current += 1;
      setCorrect(correctRef.current);
      navigator.vibrate?.(10);
    } else {
      setWrong((w) => w + 1);
      // A miss costs three seconds instead of ending the run.
      endsAt.current -= 3000;
      navigator.vibrate?.([15, 30, 15]);
    }
    setFlash(isRight ? 'right' : 'wrong');
    setTimeout(() => setFlash(null), 180);
    setIndex((i) => i + 1);
  };

  const seconds = Math.ceil(msLeft / 1000);
  const question = queue[index % (queue.length || 1)];

  if (phase === 'ready') {
    return (
      <div className="screen screen--scroll">
        <TopBar onBack={() => navigate('/')} title={t('home.beatTheClock')} />
        <MascotSays mood="excited" small name>
          {t('clock.intro')}
        </MascotSays>
        <div className="card" style={{ marginTop: 8 }}>
          <div className="card__kicker">⏱️ {t('home.beatTheClock')}</div>
          <h2 className="card__question">{t('clock.rulesTitle', { seconds: ROUND_SECONDS })}</h2>
          <p className="card__body">{t('clock.rules', { pi: PI_PER_CORRECT })}</p>
          <div style={{ marginTop: 20 }}>
            <button type="button" className="btn btn--primary" onClick={start}>
              {t('clock.start')} →
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="screen">
        <div className="result pop">
          <div className="result__stars">⏱️</div>
          <h1 className="result__headline">{t('clock.timeUp')}</h1>
          <div className="stat-grid" style={{ width: '100%', marginTop: 8 }}>
            <div className="stat">
              <div className="stat__label">{t('clock.correct')}</div>
              <div className="stat__value" style={{ color: 'var(--green)' }}>
                {correct}
              </div>
            </div>
            <div className="stat">
              <div className="stat__label">{t('clock.missed')}</div>
              <div className="stat__value">{wrong}</div>
            </div>
          </div>
          <div className="result__reward">+{awarded} π</div>
          <MascotSays mood={correct > 5 ? 'proud' : 'happy'}>
            {correct > 5 ? t('lesson.encourageRight') : t('clock.tryAgainHint')}
          </MascotSays>
        </div>
        <div
          className="btn--wide-pair"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}>
          <button type="button" className="btn btn--primary" onClick={start}>
            {t('clock.again')}
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
      <TopBar onBack={() => navigate('/')} title={t('home.beatTheClock')} />

      <div className="clock-row">
        <div className={`clock-time${seconds <= 10 ? ' clock-time--urgent' : ''}`}>{seconds}s</div>
        <div className="bar grow">
          <div
            className="bar__fill bar__fill--timer"
            style={{ width: `${(msLeft / (ROUND_SECONDS * 1000)) * 100}%` }}
          />
        </div>
        <div className="clock-score">✅ {correct}</div>
      </div>

      <div className={`card fade-in${flash ? ` card--${flash}` : ''}`} key={index}>
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
  return (
    <div className="topbar">
      <button type="button" className="icon-btn" aria-label={t('common.back')} onClick={onBack}>
        ←
      </button>
      <div className="grow" style={{ fontWeight: 800, fontSize: 17 }}>
        {title}
      </div>
      <PiPill showAdd={false} />
    </div>
  );
}
