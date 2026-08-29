import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { PiPill } from '@/components/PiPill';
import { FALLBACK_PLANET, SYSTEM_PLANET } from '@/content/art';
import { SYSTEMS, levelsOfSystem } from '@/content/curriculum';
import { tally, useProgressStore } from '@/store/progressStore';

/**
 * The front door: one world at a time, filling the screen.
 *
 * The planet is the whole design — no card around it, no panel behind it — so
 * everything else is deliberately quiet: a π chip, a title, a percentage, and
 * the dots that say how many worlds there are. Paging is a scroll-snap
 * container rather than a carousel library, which keeps swipe, trackpad,
 * keyboard and the arrow buttons all running through the same one scroll
 * position.
 */
export function Systems() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const completed = useProgressStore((s) => s.completed);
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const active = SYSTEMS[index] ?? SYSTEMS[0];
  const { done, total } = tally(completed, levelsOfSystem(active.id));
  const pct = total ? Math.round((done / total) * 100) : 0;

  /** The world nearest the middle of the viewport is the one being shown. */
  const syncIndex = () => {
    const track = trackRef.current;
    if (!track) return;
    const middle = track.scrollLeft + track.clientWidth / 2;
    let nearest = 0;
    let smallest = Infinity;
    Array.from(track.children).forEach((child, i) => {
      const el = child as HTMLElement;
      const distance = Math.abs(el.offsetLeft + el.offsetWidth / 2 - middle);
      if (distance < smallest) {
        smallest = distance;
        nearest = i;
      }
    });
    setIndex(nearest);
  };

  const scrollTo = (target: number) => {
    const track = trackRef.current;
    const el = track?.children[target] as HTMLElement | undefined;
    if (!track || !el) return;
    track.scrollTo({
      left: el.offsetLeft - (track.clientWidth - el.offsetWidth) / 2,
      behavior: 'smooth',
    });
  };

  return (
    <div className="worlds">
      <header className="worlds__top">
        <PiPill compact />
      </header>

      <div className="worlds__stage">
        <button
          type="button"
          className="worlds__arrow worlds__arrow--prev"
          aria-label={t('systems.prev')}
          disabled={index === 0}
          onClick={() => scrollTo(index - 1)}>
          <ChevronLeft size={22} aria-hidden="true" />
        </button>

        <div className="worlds__track" ref={trackRef} onScroll={syncIndex}>
          {SYSTEMS.map((system, i) => (
            <button
              type="button"
              key={system.id}
              className={[
                'worlds__planet',
                i === index ? 'worlds__planet--active' : '',
                system.available ? '' : 'worlds__planet--locked',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-label={t('systems.open', { title: system.title })}
              aria-disabled={!system.available}
              onClick={() => system.available && navigate(`/system/${system.id}`)}>
              <img src={SYSTEM_PLANET[system.id] ?? FALLBACK_PLANET} alt="" draggable={false} />
              {!system.available && <Lock className="worlds__lock" size={38} aria-hidden="true" />}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="worlds__arrow worlds__arrow--next"
          aria-label={t('systems.next')}
          disabled={index === SYSTEMS.length - 1}
          onClick={() => scrollTo(index + 1)}>
          <ChevronRight size={22} aria-hidden="true" />
        </button>
      </div>

      {/* Keyed by world so the text crossfades rather than swapping mid-swipe. */}
      <div className="worlds__info" key={active.id}>
        <h1 className="worlds__title">{active.title}</h1>
        <p className="worlds__blurb">{active.available ? active.blurb : active.unlockNote}</p>

        {active.available && (
          <div className="worlds__progress">
            <span className="worlds__pct">{t('systems.percent', { pct })}</span>
            <span className="worlds__bar">
              <span className="worlds__bar-fill" style={{ width: `${pct}%` }} />
            </span>
          </div>
        )}
      </div>

      <div className="worlds__dots" role="tablist" aria-label={t('systems.eyebrow')}>
        {SYSTEMS.map((system, i) => (
          <button
            type="button"
            key={system.id}
            role="tab"
            aria-selected={i === index}
            aria-label={system.title}
            className={`worlds__dot${i === index ? ' worlds__dot--on' : ''}`}
            onClick={() => scrollTo(i)}
          />
        ))}
      </div>
    </div>
  );
}
