import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { MascotSays } from '@/components/Mascot';
import { PiPill } from '@/components/PiPill';
import { WORLDS, levelsOfWorld } from '@/content/curriculum';
import { tally, useProgressStore } from '@/store/progressStore';

/**
 * The world selector — the app's front door.
 *
 * There is deliberately no separate "galaxy overview": you land inside a world
 * and swipe sideways between them. CSS scroll-snap does the paging, so it stays
 * a plain scroll container that works with touch, trackpad and keyboard alike.
 */
export function Worlds() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const completed = useProgressStore((s) => s.completed);
  const trackRef = useRef<HTMLDivElement>(null);

  return (
    <div className="screen screen--scroll" style={{ paddingInline: 0 }}>
      <div className="topbar" style={{ paddingInline: 'var(--space-4)' }}>
        <div className="grow">
          <div className="topbar__eyebrow">{t('worlds.eyebrow')}</div>
          <div className="topbar__label">{t('worlds.swipeHint')}</div>
        </div>
        <PiPill />
      </div>

      <div className="world-track" ref={trackRef}>
        {WORLDS.map((world) => {
          const levels = levelsOfWorld(world.id);
          const { done, total } = tally(completed, levels);
          const pct = total ? (done / total) * 100 : 0;

          return (
            <section
              className={`world${world.available ? '' : ' world--locked'}`}
              key={world.id}
              aria-label={world.title}>
              <div className="world__planet" aria-hidden="true">
                {world.available ? world.glyph : '🔒'}
              </div>

              <h1 className="world__title">{world.title}</h1>
              <p className="world__blurb">{world.blurb}</p>

              {world.available ? (
                <>
                  <div className="world__stats">{t('worlds.progress', { done, total })}</div>
                  <div className="bar" style={{ width: '78%' }}>
                    <div className="bar__fill" style={{ width: `${pct}%` }} />
                  </div>
                  <button
                    type="button"
                    className="btn btn--primary world__cta"
                    onClick={() => navigate(`/world/${world.id}`)}>
                    {done > 0 ? t('worlds.continue') : t('worlds.enter')} →
                  </button>
                </>
              ) : (
                <div className="world__locked-note">{world.unlockNote}</div>
              )}
            </section>
          );
        })}
      </div>

      <div style={{ paddingInline: 'var(--space-4)' }}>
        <MascotSays mood="pointing">{t('worlds.mascot')}</MascotSays>
      </div>
    </div>
  );
}
