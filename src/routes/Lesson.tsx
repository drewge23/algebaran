import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import { LessonPlayer } from '@/components/LessonPlayer';
import { MascotSays } from '@/components/Mascot';
import { PiPill } from '@/components/PiPill';
import { GAME_FOR_LEVEL } from '@/content/graph-games';
import { stepsForLesson } from '@/content/lesson-steps';
import { getLevel, levelsOfSection, sectionRoute } from '@/content/curriculum';
import { usePlayerStore } from '@/store/playerStore';
import { useProgressStore } from '@/store/progressStore';
import { trackQuest } from '@/store/questStore';
import type { LessonStep } from '@/types/content';
import type { Level } from '@/types/curriculum';

export function LessonRoute() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const lesson = id ? getLevel(id) : undefined;
  const steps = lesson ? stepsForLesson(lesson.id) : undefined;

  if (!lesson) {
    return (
      <div className="screen">
        <div className="result">
          <h1 className="result__headline">404</h1>
          <button type="button" className="btn btn--ghost btn--auto" onClick={() => navigate('/')}>
            ←
          </button>
        </div>
      </div>
    );
  }

  // A few map nodes are mini-games rather than lessons. They are still opened by
  // level id from the map, so the redirect lives here rather than in every caller.
  const game = GAME_FOR_LEVEL[lesson.id];
  if (game) return <Navigate to={`/graph-game/${game}`} replace />;

  // Keyed by lesson id: without this, navigating straight from one lesson to
  // another reuses the same element position and React keeps the previous
  // lesson's step index and mistake count.
  if (!steps) return <PlaceholderLesson key={lesson.id} lesson={lesson} />;
  return <PlayableLesson key={lesson.id} lesson={lesson} steps={steps} />;
}

/** The next lesson in the same section that the learner has not finished. */
function nextLevelAfter(lesson: Level, completed: Record<string, unknown>): string | undefined {
  const levels = levelsOfSection(lesson.sectionId);
  const here = levels.findIndex((l) => l.id === lesson.id);
  const next = levels.slice(here + 1).find((l) => !completed[l.id]);
  return next ? `/lesson/${next.id}` : undefined;
}

function PlayableLesson({ lesson, steps }: { lesson: Level; steps: LessonStep[] }) {
  const completeLesson = useProgressStore((s) => s.completeLesson);
  const completed = useProgressStore((s) => s.completed);
  const alreadyCompleted = useProgressStore((s) => Boolean(s.completed[lesson.id]));

  return (
    <LessonPlayer
      unit={lesson}
      steps={steps}
      backTo={sectionRoute(lesson.sectionId)}
      nextTo={nextLevelAfter(lesson, completed)}
      alreadyRewarded={alreadyCompleted}
      onComplete={(stars) => {
        completeLesson(lesson.id, stars);
        // Quests watch real events rather than polling for them.
        if (!alreadyCompleted) {
          trackQuest('lessonsCompleted');
          trackQuest('piEarned', lesson.rewardPi);
        }
        if (stars === 3) trackQuest('perfectLessons');
      }}
    />
  );
}

/** Shown for lessons whose interactive content is not authored yet. */
function PlaceholderLesson({ lesson }: { lesson: Level }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const earnPi = usePlayerStore((s) => s.earnPi);
  const addXp = usePlayerStore((s) => s.addXp);
  const registerActivity = usePlayerStore((s) => s.registerActivity);
  const completeLesson = useProgressStore((s) => s.completeLesson);
  const alreadyCompleted = useProgressStore((s) => Boolean(s.completed[lesson.id]));

  // Finishing or leaving returns to the section this level sits in, never the
  // home screen — being thrown back to the world selector loses the learner's place.
  const backTo = sectionRoute(lesson.sectionId);

  const complete = () => {
    if (!alreadyCompleted) {
      earnPi(lesson.rewardPi);
      addXp(lesson.rewardXp);
      registerActivity();
    }
    completeLesson(lesson.id, 3);
    navigate(backTo);
  };

  return (
    <div className="screen">
      <div className="topbar">
        <button
          type="button"
          className="icon-btn"
          aria-label={t('common.back')}
          onClick={() => navigate(backTo)}>
          ←
        </button>
        <div className="grow" style={{ fontWeight: 800, fontSize: 17 }}>
          {lesson.title}
        </div>
        <PiPill />
      </div>

      <MascotSays mood="sleepy" small name>
        {t('lesson.comingSoon')}
      </MascotSays>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card__kicker">🚧 {t('lesson.learn')}</div>
        <h2 className="card__question">{lesson.title}</h2>
        <p className="card__body">{t('lesson.comingSoon')}</p>
        <div style={{ marginTop: 20 }}>
          <button type="button" className="btn btn--primary" onClick={complete}>
            {t('lesson.completeDemo')}
          </button>
        </div>
      </div>
    </div>
  );
}
