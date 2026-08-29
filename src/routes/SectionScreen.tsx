import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Check, ChevronLeft, Lock } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { PROFESSORSON_AVATAR } from '@/components/Mascot';
import { PiPill } from '@/components/PiPill';
import { NODE_ART } from '@/content/art';
import { getSection, getSystem, levelsOfSection } from '@/content/curriculum';
import { useNavMemory } from '@/store/navStore';
import { statusForLevel, tally, useProgressStore, type LessonStatus } from '@/store/progressStore';
import type { Level } from '@/types/curriculum';

/**
 * How far past the current lesson a row still reads as "coming up".
 *
 * The curriculum only really has three states — done, available, locked — but a
 * wall of padlocks says "shut" when the truth is "not yet". The next couple of
 * rows show an empty circle instead, which is the same not-yet-tappable state,
 * presented as near rather than barred.
 */
const UPCOMING_REACH = 2;

type RowState = 'done' | 'current' | 'upcoming' | 'locked';

/**
 * One section's lessons: the deepest browse level, and the screen a learner
 * spends the most time on.
 *
 * A list rather than a map — at this depth the question is "which one is next",
 * and a numbered column answers it faster than a trail does. The row carries
 * everything needed to choose: where it sits in the order, what it covers, and
 * whether it is open.
 */
export function SectionScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { sectionId } = useParams<{ sectionId: string }>();
  const completed = useProgressStore((s) => s.completed);
  const remember = useNavMemory((s) => s.remember);

  const section = sectionId ? getSection(sectionId) : undefined;

  // Remember the section so the next visit opens here rather than at the top.
  useEffect(() => {
    if (section) remember({ systemId: section.systemId, sectionId: section.id });
  }, [section, remember]);

  if (!section) {
    return (
      <div className="screen">
        <div className="result">
          <h1 className="result__headline">404</h1>
          <button type="button" className="btn btn--primary" onClick={() => navigate('/')}>
            {t('common.back')}
          </button>
        </div>
      </div>
    );
  }

  const levels = levelsOfSection(section.id);
  const { done, total } = tally(completed, levels);
  const system = getSystem(section.systemId);
  const finished = total > 0 && done === total;

  const currentIndex = levels.findIndex((l) => statusForLevel(completed, l) === 'available');

  const goUp = () => {
    // Stepping back up forgets the deeper position, so the restore-on-open does
    // not drag the learner straight back down here.
    remember({ systemId: section.systemId, sectionId: null });
    navigate(`/system/${section.systemId}`);
  };

  const rowState = (level: Level, index: number): RowState => {
    const status: LessonStatus = statusForLevel(completed, level);
    if (status === 'completed') return 'done';
    if (status === 'available') return 'current';
    if (currentIndex >= 0 && index <= currentIndex + UPCOMING_REACH) return 'upcoming';
    return 'locked';
  };

  return (
    <div className="section-screen">
      <div className="section-screen__top">
        <button type="button" className="icon-btn" aria-label={t('common.back')} onClick={goUp}>
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <span className="grow" />
        <PiPill compact />
        <span className="lesson-avatar" aria-hidden="true">
          <img src={PROFESSORSON_AVATAR} alt="" draggable={false} />
        </span>
      </div>

      <h1 className="section-screen__title">{section.title}</h1>

      <div className="section-orb" aria-hidden="true">
        <img src={NODE_ART[finished ? 'done' : 'open']} alt="" draggable={false} />
        <span className="section-orb__glyph">{section.glyph}</span>
      </div>

      <div className="section-screen__progress">
        <span className="section-screen__count">
          {done} / {total}
        </span>
        <span className="section-screen__star" aria-hidden="true">
          ⭐
        </span>
      </div>
      <p className="section-screen__sub">{system?.title}</p>

      <ol className="lesson-list">
        {levels.map((level, i) => (
          <LessonRow
            key={level.id}
            level={level}
            index={i + 1}
            state={rowState(level, i)}
            onOpen={() => navigate(`/lesson/${level.id}`)}
          />
        ))}
      </ol>
    </div>
  );
}

function LessonRow({
  level,
  index,
  state,
  onOpen,
}: {
  level: Level;
  index: number;
  state: RowState;
  onOpen: () => void;
}) {
  const { t } = useTranslation();
  // Only what you have done and what you are on can be opened.
  const openable = state === 'done' || state === 'current';

  return (
    <li>
      <button
        type="button"
        className={`lesson-row lesson-row--${state}`}
        disabled={!openable}
        aria-label={`${index}. ${level.title} — ${t(`levels.state.${state}`)}`}
        onClick={onOpen}>
        <span className="lesson-row__num" aria-hidden="true">
          {index}
        </span>

        <span className="lesson-row__text">
          <span className="lesson-row__title">{level.title}</span>
          <span className="lesson-row__sub">{level.subtitle}</span>
        </span>

        <span className={`lesson-row__status lesson-row__status--${state}`} aria-hidden="true">
          {state === 'done' && <Check size={18} strokeWidth={3} />}
          {state === 'current' && <ArrowRight size={18} strokeWidth={2.5} />}
          {state === 'locked' && <Lock size={15} />}
        </span>
      </button>
    </li>
  );
}
