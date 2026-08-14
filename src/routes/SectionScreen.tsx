import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import { PiPill } from '@/components/PiPill';
import { getSection, getWorld, levelsOfSection } from '@/content/curriculum';
import { stepsForLesson } from '@/content/lesson-steps';
import { statusForLevel, tally, useProgressStore } from '@/store/progressStore';
import type { Level } from '@/types/curriculum';

const KIND_ICON: Record<Level['kind'], string> = {
  learn: '📖',
  practice: '🔁',
  apply: '🌍',
  project: '🚀',
  exam: '📜',
  challenge: '🔥',
  game: '🎮',
};

/** The level list for one section — the last layer before the maths itself. */
export function SectionScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { sectionId } = useParams<{ sectionId: string }>();
  const completed = useProgressStore((s) => s.completed);

  const section = sectionId ? getSection(sectionId) : undefined;
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

  const world = getWorld(section.worldId);
  const levels = levelsOfSection(section.id);
  const { done, total } = tally(completed, levels);

  return (
    <div className="screen screen--scroll">
      <div className="topbar">
        <button
          type="button"
          className="icon-btn"
          aria-label={t('common.back')}
          onClick={() => navigate(`/world/${section.worldId}`)}>
          ←
        </button>
        <div className="grow" style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 17 }}>{section.title}</div>
          <div className="topbar__label">
            {world?.title} · {done}/{total}
          </div>
        </div>
        <PiPill />
      </div>

      <p className="screen__sub" style={{ marginTop: 8 }}>
        {section.blurb}
      </p>

      <div className="bar" style={{ marginTop: 12 }}>
        <div className="bar__fill" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
      </div>

      <div className="stack stack--2" style={{ marginTop: 20 }}>
        {levels.map((level, i) => {
          const status = statusForLevel(completed, level);
          const locked = status === 'locked';
          const record = completed[level.id];
          const authored = !!stepsForLesson(level.id);

          return (
            <button
              type="button"
              key={level.id}
              className={[
                'level-row',
                locked ? 'level-row--locked' : '',
                level.kind === 'exam' ? 'level-row--exam' : '',
                status === 'available' ? 'level-row--next' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              disabled={locked}
              onClick={() => navigate(`/lesson/${level.id}`)}>
              <span className="level-row__index">{locked ? '🔒' : i + 1}</span>
              <span className="tile__grow">
                <span className="level-row__title">
                  {KIND_ICON[level.kind]} {level.title}
                </span>
                <span className="tile__desc">{level.subtitle}</span>
              </span>
              <span className="level-row__right">
                {record ? (
                  <span className="node__stars">{'⭐'.repeat(record.stars)}</span>
                ) : (
                  <span className="tile__meta">+{level.rewardPi} π</span>
                )}
                {!authored && !locked && <span className="tiny dim">{t('levels.comingSoon')}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
