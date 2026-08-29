import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import { ChevronLeft } from 'lucide-react';

import { PiPill } from '@/components/PiPill';
import { SectionMap } from '@/components/SectionMap';
import { getSystem, levelsOfSystem, sectionRoute, sectionsOfSystem } from '@/content/curriculum';
import { useNavMemory } from '@/store/navStore';
import { tally, useProgressStore } from '@/store/progressStore';

/**
 * One world, drawn as a column of sections. Each seal opens that section's
 * lessons, so the whole course is three steps deep: world → section → lessons.
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
    if (system) remember({ systemId: system.id, sectionId: null });
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

  const sections = sectionsOfSystem(system.id);
  const { done, total } = tally(completed, levelsOfSystem(system.id));

  const goUp = () => {
    // Explicit back is the one way out to the selector, so forget this system.
    remember({ systemId: null, sectionId: null });
    navigate('/');
  };

  return (
    <div className="screen screen--scroll">
      <div className="topbar">
        <button type="button" className="icon-btn" aria-label={t('common.back')} onClick={goUp}>
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <div className="grow">
          <div className="topbar__eyebrow">{system.title}</div>
          <div className="topbar__label">{t('systems.progress', { done, total })}</div>
        </div>
        <PiPill compact />
      </div>

      <div className="bar" style={{ marginTop: 10 }}>
        <div className="bar__fill" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
      </div>

      <SectionMap
        sections={sections}
        completed={completed}
        onOpen={(section) => {
          remember({ systemId: system.id, sectionId: section.id });
          navigate(sectionRoute(section.id));
        }}
      />
    </div>
  );
}
