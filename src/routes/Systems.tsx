import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { MascotSays } from '@/components/Mascot';
import { PiPill } from '@/components/PiPill';
import { SYSTEMS, levelsOfSystem } from '@/content/curriculum';
import { tally, useProgressStore } from '@/store/progressStore';

/**
 * The system selector — the app's front door.
 *
 * There is deliberately no separate "galaxy overview": you land inside a system
 * and swipe sideways between them. CSS scroll-snap does the paging, so it stays
 * a plain scroll container that works with touch, trackpad and keyboard alike.
 */
export function Systems() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const completed = useProgressStore((s) => s.completed);
  const trackRef = useRef<HTMLDivElement>(null);

  return (
    <div className="screen screen--scroll" style={{ paddingInline: 0 }}>
      <div className="topbar" style={{ paddingInline: 'var(--space-4)' }}>
        <div className="grow">
          <div className="topbar__eyebrow">{t('systems.eyebrow')}</div>
          <div className="topbar__label">{t('systems.swipeHint')}</div>
        </div>
        <PiPill />
      </div>

      <div className="system-track" ref={trackRef}>
        {SYSTEMS.map((system) => {
          const levels = levelsOfSystem(system.id);
          const { done, total } = tally(completed, levels);
          const pct = total ? (done / total) * 100 : 0;

          return (
            <section
              className={`system${system.available ? '' : ' system--locked'}`}
              key={system.id}
              aria-label={system.title}>
              <div className="system__planet" aria-hidden="true">
                {system.available ? system.glyph : '🔒'}
              </div>

              <h1 className="system__title">{system.title}</h1>
              <p className="system__blurb">{system.blurb}</p>

              {system.available ? (
                <>
                  <div className="system__stats">{t('systems.progress', { done, total })}</div>
                  <div className="bar" style={{ width: '78%' }}>
                    <div className="bar__fill" style={{ width: `${pct}%` }} />
                  </div>
                  <button
                    type="button"
                    className="btn btn--primary system__cta"
                    onClick={() => navigate(`/system/${system.id}`)}>
                    {done > 0 ? t('systems.continue') : t('systems.enter')} →
                  </button>
                </>
              ) : (
                <div className="system__locked-note">{system.unlockNote}</div>
              )}
            </section>
          );
        })}
      </div>

      <div style={{ paddingInline: 'var(--space-4)' }}>
        <MascotSays mood="pointing">{t('systems.mascot')}</MascotSays>
      </div>
    </div>
  );
}
