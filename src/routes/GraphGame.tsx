import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import { GraphTaskView } from '@/components/graph/GraphTaskView';
import { MascotSays } from '@/components/Mascot';
import { PiPill } from '@/components/PiPill';
import { GAME_FOR_LEVEL, ROUNDS_PER_RUN, getGraphGame } from '@/content/graph-games';
import { getLevel, sectionRoute } from '@/content/curriculum';
import { now } from '@/lib/clock';
import { seededRandom } from '@/lib/random';
import { usePlayerStore } from '@/store/playerStore';
import { statusForLevel, useProgressStore } from '@/store/progressStore';
import { trackQuest } from '@/store/questStore';
import { buzz } from '@/lib/haptics';

type Phase = 'ready' | 'playing' | 'done';

/** The map node a game run counts for, when the game was opened from one. */
const levelForGame = (gameId: string) =>
  Object.entries(GAME_FOR_LEVEL).find(([, id]) => id === gameId)?.[0];

function starsFor(correct: number): number {
  if (correct >= ROUNDS_PER_RUN - 1) return 3;
  if (correct >= Math.ceil(ROUNDS_PER_RUN / 2)) return 2;
  return 1;
}

/**
 * The mini-game runner.
 *
 * One component drives all eight games: the game supplies a generator, this
 * supplies the clock, the scoring and the payout. Rounds come from a seed fixed
 * at the start of the run, so a run is reproducible while replays differ, and
 * difficulty climbs across the run rather than being fixed per game.
 */
export function GraphGameRoute() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { gameId } = useParams<{ gameId: string }>();
  const game = gameId ? getGraphGame(gameId) : undefined;

  const earnPi = usePlayerStore((s) => s.earnPi);
  const registerActivity = usePlayerStore((s) => s.registerActivity);
  const completeLesson = useProgressStore((s) => s.completeLesson);
  const completed = useProgressStore((s) => s.completed);

  const [phase, setPhase] = useState<Phase>('ready');
  const [seed, setSeed] = useState('');
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [verdict, setVerdict] = useState<boolean | null>(null);
  const [msLeft, setMsLeft] = useState(0);
  const [awarded, setAwarded] = useState(0);

  const endsAt = useRef(0);
  const correctRef = useRef(0);

  const levelId = game ? levelForGame(game.id) : undefined;
  const level = levelId ? getLevel(levelId) : undefined;
  // The arcade can be opened directly, so a run must not tick a map node the
  // learner has not reached yet — the drill still pays π either way.
  const countsForMap = !!level && statusForLevel(completed, level) !== 'locked';
  const backTo = level ? sectionRoute(level.sectionId) : '/arcade';

  const finish = (finalCorrect: number) => {
    if (!game) return;
    setPhase('done');
    setMsLeft(0);
    if (finalCorrect > 0) {
      const payout = finalCorrect * game.piPerCorrect;
      setAwarded(earnPi(payout));
      registerActivity();
      trackQuest('piEarned', payout);
      if (levelId && countsForMap) completeLesson(levelId, starsFor(finalCorrect));
    }
    trackQuest('graphRounds', finalCorrect);
  };

  // The timer and the round advance both need to end the run, but neither should
  // restart when an unrelated piece of state changes. Keeping the latest `finish`
  // in a ref lets those effects depend on the phase alone.
  const finishRef = useRef(finish);
  useEffect(() => {
    finishRef.current = finish;
  });

  const start = () => {
    if (!game) return;
    setSeed(`${game.id}:${now()}`);
    setRound(0);
    setCorrect(0);
    correctRef.current = 0;
    setVerdict(null);
    setAwarded(0);
    endsAt.current = now() + game.seconds * 1000;
    setMsLeft(game.seconds * 1000);
    setPhase('playing');
  };

  // Countdown driven by wall-clock time, so a backgrounded tab cannot bank
  // seconds by missing ticks.
  useEffect(() => {
    if (phase !== 'playing') return;
    const id = setInterval(() => {
      const remaining = endsAt.current - now();
      if (remaining <= 0) finishRef.current(correctRef.current);
      else setMsLeft(remaining);
    }, 100);
    return () => clearInterval(id);
  }, [phase]);

  // Hold the marked answer on screen briefly, then move on.
  useEffect(() => {
    if (verdict === null) return;
    const id = setTimeout(() => {
      setVerdict(null);
      if (round + 1 >= ROUNDS_PER_RUN) finishRef.current(correctRef.current);
      else setRound((r) => r + 1);
    }, 1300);
    return () => clearTimeout(id);
  }, [verdict, round]);

  // Difficulty ramps across the run; the seed keeps a given run reproducible.
  const task = useMemo(() => {
    if (!game || !seed) return null;
    return game.build(seededRandom(`${seed}:${round}`), round / Math.max(1, ROUNDS_PER_RUN - 1));
  }, [game, seed, round]);

  if (!game) {
    return (
      <div className="screen">
        <div className="result">
          <h1 className="result__headline">404</h1>
          <button type="button" className="btn btn--primary" onClick={() => navigate('/arcade')}>
            {t('common.back')}
          </button>
        </div>
      </div>
    );
  }

  const answer = (isRight: boolean) => {
    if (isRight) {
      correctRef.current += 1;
      setCorrect(correctRef.current);
      buzz(10);
    } else {
      buzz([15, 30, 15]);
    }
    setVerdict(isRight);
  };

  if (phase === 'ready') {
    return (
      <div className="screen screen--scroll">
        <TopBar title={game.title} onBack={() => navigate(backTo)} />
        <MascotSays mood="excited" small name>
          {game.blurb}
        </MascotSays>
        <div className="card" style={{ marginTop: 8 }}>
          <div className="card__kicker">
            {game.glyph} {t('graph.arcade')}
          </div>
          <h2 className="card__question">
            {t('graph.rules', { rounds: ROUNDS_PER_RUN, seconds: game.seconds })}
          </h2>
          <p className="card__body">{t('graph.payout', { pi: game.piPerCorrect })}</p>
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
          <div className="result__stars">{'⭐'.repeat(starsFor(correct))}</div>
          <h1 className="result__headline">{t('graph.runOver')}</h1>
          <div className="stat-grid" style={{ width: '100%', marginTop: 8 }}>
            <div className="stat">
              <div className="stat__label">{t('clock.correct')}</div>
              <div className="stat__value" style={{ color: 'var(--green)' }}>
                {correct}
              </div>
            </div>
            <div className="stat">
              <div className="stat__label">{t('clock.missed')}</div>
              <div className="stat__value">{ROUNDS_PER_RUN - correct}</div>
            </div>
          </div>
          <div className="result__reward">+{awarded} π</div>
          <MascotSays mood={correct > ROUNDS_PER_RUN / 2 ? 'proud' : 'happy'}>
            {correct > ROUNDS_PER_RUN / 2 ? t('lesson.encourageRight') : t('clock.tryAgainHint')}
          </MascotSays>
        </div>
        <div
          className="btn--wide-pair"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}>
          <button type="button" className="btn btn--primary" onClick={start}>
            {t('clock.again')}
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--auto"
            onClick={() => navigate(backTo)}>
            {t('common.close')}
          </button>
        </div>
      </div>
    );
  }

  const seconds = Math.ceil(msLeft / 1000);

  return (
    <div className="screen screen--scroll">
      <TopBar title={game.title} onBack={() => navigate(backTo)} />

      <div className="clock-row">
        <div className={`clock-time${seconds <= 10 ? ' clock-time--urgent' : ''}`}>{seconds}s</div>
        <div className="bar grow">
          <div
            className="bar__fill bar__fill--timer"
            style={{ width: `${(msLeft / (game.seconds * 1000)) * 100}%` }}
          />
        </div>
        <div className="clock-score">✅ {correct}</div>
      </div>

      <div
        className={`card fade-in${verdict === null ? '' : verdict ? ' card--right' : ' card--wrong'}`}>
        <div className="card__kicker">
          {game.glyph} {t('graph.round', { index: round + 1, total: ROUNDS_PER_RUN })}
        </div>
        {/* Keyed by round so each round starts with an empty plane. */}
        {task && (
          <GraphTaskView key={round} task={task} revealed={verdict !== null} onAnswer={answer} />
        )}
      </div>

      <div style={{ height: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }} />
    </div>
  );
}

function TopBar({ title, onBack }: { title: string; onBack: () => void }) {
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
