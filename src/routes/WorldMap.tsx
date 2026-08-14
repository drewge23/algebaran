import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import { MascotSays } from '@/components/Mascot';
import { PiPill } from '@/components/PiPill';
import { WorldSvgMap } from '@/components/WorldSvgMap';
import { getWorld, levelsOfWorld, regionsOfWorld } from '@/content/curriculum';
import { useNavMemory } from '@/store/navStore';
import { tally, useProgressStore } from '@/store/progressStore';

/**
 * One world, drawn as a map of glowing islands. Each island is a region — a
 * cluster of sections — so a world reads as a handful of landmarks rather than a
 * list of every section it contains.
 */
export function WorldMap() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { worldId } = useParams<{ worldId: string }>();
  const completed = useProgressStore((s) => s.completed);
  const remember = useNavMemory((s) => s.remember);

  const world = worldId ? getWorld(worldId) : undefined;

  // Remember the world so the next visit opens here instead of the selector.
  useEffect(() => {
    if (world) remember({ worldId: world.id, regionId: null });
  }, [world, remember]);

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

  const regions = regionsOfWorld(world.id);
  const { done, total } = tally(completed, levelsOfWorld(world.id));

  const goUp = () => {
    // Explicit back is the one way out to the selector, so forget this world.
    remember({ worldId: null, regionId: null });
    navigate('/');
  };

  return (
    <div className="screen screen--scroll">
      <div className="topbar">
        <button type="button" className="icon-btn" aria-label={t('common.back')} onClick={goUp}>
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

      <WorldSvgMap
        regions={regions}
        completed={completed}
        onOpen={(region) => {
          remember({ worldId: world.id, regionId: region.id });
          navigate(`/region/${region.id}`);
        }}
      />
    </div>
  );
}
