import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import { MascotSays } from '@/components/Mascot';
import { PiPill } from '@/components/PiPill';
import { PlanetMap } from '@/components/PlanetMap';
import { getSystem, levelsOfSystem, planetsOfSystem } from '@/content/curriculum';
import { useNavMemory } from '@/store/navStore';
import { tally, useProgressStore } from '@/store/progressStore';

/**
 * One system, drawn as a map of glowing islands. Each island is a planet — a
 * cluster of sections — so a system reads as a handful of landmarks rather than a
 * list of every section it contains.
 */
export function SystemScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { systemId } = useParams<{ systemId: string }>();
  const completed = useProgressStore((s) => s.completed);
  const remember = useNavMemory((s) => s.remember);

  const system = systemId ? getSystem(systemId) : undefined;

  // Remember the system so the next visit opens here instead of the selector.
  useEffect(() => {
    if (system) remember({ systemId: system.id, planetId: null });
  }, [system, remember]);

  if (!system) {
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

  const planets = planetsOfSystem(system.id);
  const { done, total } = tally(completed, levelsOfSystem(system.id));

  const goUp = () => {
    // Explicit back is the one way out to the selector, so forget this system.
    remember({ systemId: null, planetId: null });
    navigate('/');
  };

  return (
    <div className="screen screen--scroll">
      <div className="topbar">
        <button type="button" className="icon-btn" aria-label={t('common.back')} onClick={goUp}>
          ←
        </button>
        <div className="grow">
          <div className="topbar__eyebrow">{system.title}</div>
          <div className="topbar__label">{t('systems.progress', { done, total })}</div>
        </div>
        <PiPill />
      </div>

      <div className="bar" style={{ marginTop: 10 }}>
        <div className="bar__fill" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
      </div>

      <MascotSays mood="happy">{t('systems.sectionsMascot')}</MascotSays>

      <PlanetMap
        planets={planets}
        completed={completed}
        onOpen={(planet) => {
          remember({ systemId: system.id, planetId: planet.id });
          navigate(`/planet/${planet.id}`);
        }}
      />
    </div>
  );
}
