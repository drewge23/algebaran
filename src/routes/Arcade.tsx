import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Timer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { PiPill } from '@/components/PiPill';
import { GAME_ART } from '@/content/art';
import { GRAPH_GAMES, ROUNDS_PER_RUN } from '@/content/graph-games';

/**
 * The arcade: short, repeatable drills that pay π every run.
 *
 * Lessons teach and pay once; these pay every time, which is what makes them the
 * place to come back to when there is nothing new unlocked. One row per game —
 * illustration, what it is, and the way in — because a grid of tiles would say
 * "browse" when the answer is almost always "play the next one".
 */
export function Arcade() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="screen screen--scroll">
      <div className="topbar">
        <button
          type="button"
          className="icon-btn"
          aria-label={t('common.back')}
          onClick={() => navigate('/quests')}>
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <h1 className="screen__title grow" style={{ fontSize: 24 }}>
          {t('graph.arcade')}
        </h1>
        <PiPill compact />
      </div>

      <p className="screen__sub">{t('graph.arcadeSub')}</p>

      <div className="minigame-list">
        <GameRow
          title={t('home.beatTheClock')}
          description={t('clock.intro')}
          onOpen={() => navigate('/beat-the-clock')}
          icon={<Timer size={30} aria-hidden="true" />}
        />

        {GRAPH_GAMES.map((game) => (
          <GameRow
            key={game.id}
            title={game.title}
            description={game.blurb}
            meta={t('graph.meta', { rounds: ROUNDS_PER_RUN, seconds: game.seconds })}
            art={GAME_ART[game.id]}
            onOpen={() => navigate(`/graph-game/${game.id}`)}
          />
        ))}
      </div>
    </div>
  );
}

function GameRow({
  title,
  description,
  meta,
  art,
  icon,
  onOpen,
}: {
  title: string;
  description: string;
  meta?: string;
  art?: string;
  icon?: React.ReactNode;
  onOpen: () => void;
}) {
  const { t } = useTranslation();
  return (
    <button type="button" className="minigame" onClick={onOpen}>
      <span className="minigame__art" aria-hidden="true">
        {art ? <img src={art} alt="" draggable={false} /> : icon}
      </span>
      <span className="minigame__text">
        <span className="minigame-title">{title}</span>
        <span className="minigame-description">{description}</span>
        {meta && <span className="minigame-meta">{meta}</span>}
      </span>
      <span className="minigame-button" aria-hidden="true">
        {t('graph.open')}
        <ChevronRight size={16} />
      </span>
    </button>
  );
}
