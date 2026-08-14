import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { MascotSays } from '@/components/Mascot';
import { PiPill } from '@/components/PiPill';
import avatarArt from '@/assets/professorson/happy.webp';
import { ORDERED_LESSONS } from '@/content/lessons';
import { usePlayerStore } from '@/store/playerStore';
import { statusForLesson, useProgressStore, type LessonStatus } from '@/store/progressStore';
import type { Lesson } from '@/types/content';

/** Lane pattern that makes the vertical list read as a winding trail. */
const LANES = ['c', 'r', 'c', 'l'] as const;

export function LessonMap() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const completed = useProgressStore((s) => s.completed);
  const rating = usePlayerStore((s) => s.rating);

  const total = ORDERED_LESSONS.length;
  const done = ORDERED_LESSONS.filter((l) => completed[l.id]).length;

  return (
    <div className="screen screen--scroll">
      <div className="topbar">
        <div className="avatar-chip">
          <img src={avatarArt} alt="" />
        </div>
        <div>
          <div className="topbar__eyebrow">{t('home.eyebrow')}</div>
          <div className="topbar__label">{t('home.section')}</div>
        </div>
        <div className="topbar__spacer" />
        <PiPill />
      </div>

      <div className="stack stack--2" style={{ marginTop: 8 }}>
        <h1 className="screen__title">{t('home.mapTitle')}</h1>
        <p className="screen__sub">{t('home.lessonCount', { count: total })}</p>
      </div>

      <div className="stack stack--2" style={{ marginTop: 14 }}>
        <div className="row tiny">
          <span aria-hidden="true">⭐</span>
          <span className="dim">{t('home.progress', { done, total })}</span>
        </div>
        <div className="bar">
          <div className="bar__fill" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
        </div>
      </div>

      <MascotSays mood="happy">{t('home.greeting')}</MascotSays>

      <div className="rail">
        <button type="button" className="rail__btn" onClick={() => navigate('/duel')}>
          <span className="rail__icon" aria-hidden="true">
            ⚔️
          </span>
          {t('duel.title')}
          <span className="rail__reward">{rating}</span>
        </button>
        <button type="button" className="rail__btn" onClick={() => navigate('/beat-the-clock')}>
          <span className="rail__icon" aria-hidden="true">
            ⏱️
          </span>
          {t('home.beatTheClock')}
          <span className="rail__reward">+π</span>
        </button>
      </div>

      <div className="map">
        {ORDERED_LESSONS.map((lesson, i) => (
          <div key={lesson.id} className={`node-row node-row--${LANES[i % LANES.length]}`}>
            <MapNode
              lesson={lesson}
              index={i + 1}
              status={statusForLesson(completed, lesson)}
              stars={completed[lesson.id]?.stars ?? 0}
              // The bonus section is the timed round, not a step-by-step lesson.
              onPress={() =>
                navigate(
                  lesson.sectionId === 'beat-the-clock'
                    ? '/beat-the-clock'
                    : `/lesson/${lesson.id}`,
                )
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function MapNode({
  lesson,
  index,
  status,
  stars,
  onPress,
}: {
  lesson: Lesson;
  index: number;
  status: LessonStatus;
  stars: number;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const locked = status === 'locked';

  const dotClass =
    status === 'completed'
      ? 'node__dot node__dot--done'
      : status === 'available'
        ? 'node__dot node__dot--current'
        : 'node__dot node__dot--locked';

  return (
    <button
      type="button"
      className="node"
      disabled={locked}
      onClick={onPress}
      aria-label={`${lesson.title} — ${locked ? t('home.locked') : status === 'completed' ? t('home.review') : t('home.start')}`}>
      <span className={dotClass}>
        {locked ? '🔒' : index}
        {status === 'completed' && (
          <span className="node__check" aria-hidden="true">
            ✓
          </span>
        )}
      </span>
      <span className={`node__label${locked ? ' node__label--locked' : ''}`}>{lesson.title}</span>
      {status === 'completed' ? (
        <span className="node__stars" aria-hidden="true">
          {'⭐'.repeat(stars)}
        </span>
      ) : (
        <span className="node__reward">+{lesson.rewardPi} π</span>
      )}
    </button>
  );
}
