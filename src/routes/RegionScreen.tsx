import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import { PiPill } from '@/components/PiPill';
import {
  getRegion,
  getSection,
  getWorld,
  levelsOfRegion,
  levelsOfSection,
} from '@/content/curriculum';
import { stepsForLesson } from '@/content/lesson-steps';
import { useNavMemory } from '@/store/navStore';
import {
  statusForLevel,
  tally,
  useProgressStore,
  type LessonRecord,
  type LessonStatus,
} from '@/store/progressStore';
import type { Level } from '@/types/curriculum';

/** Special kinds show their icon instead of a number, so they read as landmarks. */
const KIND_ICON: Partial<Record<Level['kind'], string>> = {
  project: '🚀',
  exam: '📜',
  challenge: '🔥',
  game: '🎮',
};

/** Weaving lanes, so a run of levels reads as a trail rather than a column. */
const LANES = ['c', 'r', 'c', 'l'] as const;

/**
 * The level map for one region: nodes on a winding path, grouped under their
 * section headings. A region can hold seventeen levels, and the headings are
 * what stop that becoming an undifferentiated string of dots.
 */
export function RegionScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { regionId } = useParams<{ regionId: string }>();
  const completed = useProgressStore((s) => s.completed);
  const remember = useNavMemory((s) => s.remember);

  const region = regionId ? getRegion(regionId) : undefined;
  if (!region) {
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

  const world = getWorld(region.worldId);
  const { done, total } = tally(completed, levelsOfRegion(region));

  const goUp = () => {
    // Stepping back up also forgets the deeper position, otherwise the
    // restore-on-open would drag the learner straight back down here.
    remember({ worldId: region.worldId, regionId: null });
    navigate(`/world/${region.worldId}`);
  };

  return (
    <div className="screen screen--scroll">
      <div className="topbar">
        <button type="button" className="icon-btn" aria-label={t('common.back')} onClick={goUp}>
          ←
        </button>
        <div className="grow" style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 17 }}>{region.title}</div>
          <div className="topbar__label">
            {world?.title} · {done}/{total}
          </div>
        </div>
        <PiPill />
      </div>

      <p className="screen__sub" style={{ marginTop: 8 }}>
        {region.blurb}
      </p>

      <div className="bar" style={{ marginTop: 12 }}>
        <div className="bar__fill" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
      </div>

      {region.sectionIds.map((sectionId) => {
        const section = getSection(sectionId);
        const levels = levelsOfSection(sectionId);
        if (!section || levels.length === 0) return null;
        const sub = tally(completed, levels);

        return (
          <section key={sectionId}>
            <div className="map-section">
              <span className="map-section__glyph">{section.glyph}</span>
              <span className="map-section__title grow">{section.title}</span>
              <span className="tiny dim">
                {sub.done}/{sub.total}
              </span>
            </div>

            <div className="map">
              {levels.map((level, i) => (
                <div key={level.id} className={`node-row node-row--${LANES[i % LANES.length]}`}>
                  <LevelNode
                    level={level}
                    index={i + 1}
                    status={statusForLevel(completed, level)}
                    record={completed[level.id]}
                    onOpen={() => navigate(`/lesson/${level.id}`)}
                  />
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function LevelNode({
  level,
  index,
  status,
  record,
  onOpen,
}: {
  level: Level;
  index: number;
  status: LessonStatus;
  record?: LessonRecord;
  onOpen: () => void;
}) {
  const { t } = useTranslation();
  const locked = status === 'locked';
  const authored = !!stepsForLesson(level.id);

  const dotClass = [
    'node__dot',
    status === 'completed'
      ? 'node__dot--done'
      : status === 'available'
        ? 'node__dot--current'
        : 'node__dot--locked',
    level.kind === 'exam' ? 'node__dot--exam' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className="node"
      disabled={locked}
      onClick={onOpen}
      aria-label={`${level.title} — ${locked ? t('home.locked') : level.subtitle}`}>
      <span className={dotClass}>
        {locked ? '🔒' : (KIND_ICON[level.kind] ?? index)}
        {status === 'completed' && (
          <span className="node__check" aria-hidden="true">
            ✓
          </span>
        )}
      </span>
      <span className={`node__label${locked ? ' node__label--locked' : ''}`}>{level.title}</span>
      {record ? (
        <span className="node__stars" aria-hidden="true">
          {'⭐'.repeat(record.stars)}
        </span>
      ) : locked ? null : (
        <span className="node__reward">+{level.rewardPi} π</span>
      )}
      {!authored && !locked && <span className="node__todo">{t('levels.comingSoon')}</span>}
    </button>
  );
}
