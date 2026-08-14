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
import { statusForLevel, tally, useProgressStore } from '@/store/progressStore';
import { useNavMemory } from '@/store/navStore';
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

/**
 * The level list for one map region, with its sections as headings. A region
 * usually gathers several sections, so the headings are what keep a long list
 * legible — you can see where "Practice Block I" starts without counting.
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
  const showHeadings = region.sectionIds.length > 1;

  const goUp = () => {
    // Stepping back up should also forget the deeper position, otherwise the
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
          <section key={sectionId} style={{ marginTop: 24 }}>
            {showHeadings && (
              <div className="row" style={{ marginBottom: 10 }}>
                <span className="map-section__glyph">{section.glyph}</span>
                <span className="map-section__title grow">{section.title}</span>
                <span className="tiny dim">
                  {sub.done}/{sub.total}
                </span>
              </div>
            )}

            <div className="stack stack--2">
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
                      {!authored && !locked && (
                        <span className="tiny dim">{t('levels.comingSoon')}</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
