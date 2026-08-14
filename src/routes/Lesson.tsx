import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import { LessonPlayer } from '@/components/LessonPlayer';
import { MascotSays } from '@/components/Mascot';
import { PiPill } from '@/components/PiPill';
import { stepsForLesson } from '@/content/lesson-steps';
import { getLesson } from '@/content/lessons';
import { usePlayerStore } from '@/store/playerStore';
import { useProgressStore } from '@/store/progressStore';
import { trackQuest } from '@/store/questStore';
import type { Lesson, LessonStep } from '@/types/content';

export function LessonRoute() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const lesson = id ? getLesson(id) : undefined;
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

  // Keyed by lesson id: without this, navigating straight from one lesson to
  // another reuses the same element position and React keeps the previous
  // lesson's step index and mistake count.
  if (!steps) return <PlaceholderLesson key={lesson.id} lesson={lesson} />;
  return <PlayableLesson key={lesson.id} lesson={lesson} steps={steps} />;
}

function PlayableLesson({ lesson, steps }: { lesson: Lesson; steps: LessonStep[] }) {
  const completeLesson = useProgressStore((s) => s.completeLesson);
  const alreadyCompleted = useProgressStore((s) => Boolean(s.completed[lesson.id]));

  return (
    <LessonPlayer
      unit={lesson}
      steps={steps}
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
function PlaceholderLesson({ lesson }: { lesson: Lesson }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const earnPi = usePlayerStore((s) => s.earnPi);
  const addXp = usePlayerStore((s) => s.addXp);
  const registerActivity = usePlayerStore((s) => s.registerActivity);
  const completeLesson = useProgressStore((s) => s.completeLesson);
  const alreadyCompleted = useProgressStore((s) => Boolean(s.completed[lesson.id]));

  const complete = () => {
    if (!alreadyCompleted) {
      earnPi(lesson.rewardPi);
      addXp(lesson.rewardXp);
      registerActivity();
    }
    completeLesson(lesson.id, 3);
    navigate('/');
  };

  return (
    <div className="screen">
      <div className="topbar">
        <button
          type="button"
          className="icon-btn"
          aria-label={t('common.back')}
          onClick={() => navigate('/')}>
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
