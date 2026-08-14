import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import { MascotSays } from '@/components/Mascot';
import { PiPill } from '@/components/PiPill';
import { getWorld, levelsOfSection, levelsOfWorld, sectionsOfWorld } from '@/content/curriculum';
import { statusForLevel, tally, useProgressStore } from '@/store/progressStore';
import type { Section } from '@/types/curriculum';

/** Lane pattern that makes the section column read as a winding trail. */
const LANES = ['c', 'r', 'c', 'l'] as const;

/**
 * The section map for one world: a compact adventure path of landmarks, not a
 * curriculum tree. Bonus routes are marked so the main road stays obvious.
 */
export function WorldMap() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { worldId } = useParams<{ worldId: string }>();
  const completed = useProgressStore((s) => s.completed);

  const world = worldId ? getWorld(worldId) : undefined;
  if (!world) {
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

  const sections = sectionsOfWorld(world.id);
  const { done, total } = tally(completed, levelsOfWorld(world.id));

  return (
    <div className="screen screen--scroll">
      <div className="topbar">
        <button
          type="button"
          className="icon-btn"
          aria-label={t('common.back')}
          onClick={() => navigate('/')}>
          ←
        </button>
        <div className="grow">
          <div className="topbar__eyebrow">{world.title}</div>
          <div className="topbar__label">{t('worlds.progress', { done, total })}</div>
        </div>
        <PiPill />
      </div>

      <div className="bar" style={{ marginTop: 10 }}>
        <div className="bar__fill" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
      </div>

      <MascotSays mood="happy">{t('worlds.sectionsMascot')}</MascotSays>

      <div className="map">
        {sections.map((section, i) => (
          <div key={section.id} className={`node-row node-row--${LANES[i % LANES.length]}`}>
            <SectionNode
              section={section}
              index={i + 1}
              onOpen={() => navigate(`/section/${section.id}`)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionNode({
  section,
  index,
  onOpen,
}: {
  section: Section;
  index: number;
  onOpen: () => void;
}) {
  const { t } = useTranslation();
  const completed = useProgressStore((s) => s.completed);
  const levels = levelsOfSection(section.id);
  const { done, total } = tally(completed, levels);

  // A section opens as soon as any level inside it is reachable.
  const reachable = levels.some((l) => statusForLevel(completed, l) !== 'locked');
  const finished = done === total;

  const dotClass = finished
    ? 'node__dot node__dot--done'
    : reachable
      ? 'node__dot node__dot--current'
      : 'node__dot node__dot--locked';

  return (
    <button
      type="button"
      className="node node--section"
      disabled={!reachable}
      onClick={onOpen}
      aria-label={`${section.title} — ${done}/${total}`}>
      <span className={dotClass}>{reachable ? section.glyph : '🔒'}</span>
      <span className={`node__label${reachable ? '' : ' node__label--locked'}`}>
        {section.title}
      </span>
      {reachable ? (
        <span className="node__reward">
          {done}/{total}
        </span>
      ) : (
        <span className="node__stars">{t('home.locked')}</span>
      )}
      {section.kind !== 'core' && (
        <span className={`section-tag section-tag--${section.kind}`}>
          {t(`sectionKind.${section.kind}`)}
        </span>
      )}
      <span className="sr-only">{index}</span>
    </button>
  );
}
