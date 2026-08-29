import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Gamepad2, Swords } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { PiPill } from '@/components/PiPill';
import { usePlayerStore } from '@/store/playerStore';
import { useQuestStore, type ActiveQuest } from '@/store/questStore';
import { buzz } from '@/lib/haptics';

type Tab = 'daily' | 'monthly';

/**
 * Objectives as compact rows rather than a stack of cards — a to-do list that
 * looks like a to-do app is the thing this screen is trying not to be. The row
 * is the card: one border, the goal, the reward, and a hairline of progress.
 */
export function Quests() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const daily = useQuestStore((s) => s.daily);
  const monthly = useQuestStore((s) => s.monthly);
  const refresh = useQuestStore((s) => s.refresh);
  const claim = useQuestStore((s) => s.claim);
  const addPi = usePlayerStore((s) => s.addPi);
  const [tab, setTab] = useState<Tab>('daily');

  // Rolls the sets over if the day or month changed while the app was closed.
  useEffect(() => {
    refresh();
  }, [refresh]);

  const onClaim = (id: string) => {
    const reward = claim(id);
    if (reward > 0) {
      addPi(reward);
      buzz(12);
    }
  };

  const shown = tab === 'daily' ? daily : monthly;
  const claimable = shown.filter((q) => !q.claimed && q.progress >= q.target);
  const totalReward = claimable.reduce((sum, q) => sum + q.reward, 0);

  return (
    <div className="screen screen--scroll">
      <div className="topbar">
        <h1 className="screen__title grow" style={{ fontSize: 26 }}>
          {t('quests.title')}
        </h1>
        <PiPill compact />
      </div>

      <div className="tabs">
        {(['daily', 'monthly'] as const).map((id) => (
          <button
            type="button"
            key={id}
            className={`tab${tab === id ? ' tab--on' : ''}`}
            onClick={() => setTab(id)}>
            {t(`quests.${id}`)}
          </button>
        ))}
      </div>

      <div className="quest-list">
        {shown.map((quest) => (
          <QuestRow key={quest.id} quest={quest} onClaim={onClaim} />
        ))}
      </div>

      {claimable.length > 0 && (
        <div className="quest-claim-all">
          <span className="quest-claim-all__label">{t('quests.ready')}</span>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => claimable.forEach((q) => onClaim(q.id))}>
            {t('quests.claimAll', { pi: totalReward })}
          </button>
        </div>
      )}

      {/* The arcade and the duel sit with the quests: all three are "things to
          do that pay π", and the worlds screen is deliberately kept clear of
          chrome. Neither has a nav tab of its own, so this is the way in. */}
      <button type="button" className="arcade-link" onClick={() => navigate('/arcade')}>
        <span className="arcade-link__glyph" aria-hidden="true">
          <Gamepad2 size={24} />
        </span>
        <span className="grow">
          <span className="arcade-link__title">{t('systems.arcade')}</span>
          <span className="arcade-link__sub">{t('graph.arcadeSub')}</span>
        </span>
        <span aria-hidden="true">→</span>
      </button>

      <button type="button" className="arcade-link" onClick={() => navigate('/duel')}>
        <span className="arcade-link__glyph" aria-hidden="true">
          <Swords size={24} />
        </span>
        <span className="grow">
          <span className="arcade-link__title">{t('duel.title')}</span>
          <span className="arcade-link__sub">{t('duel.sub')}</span>
        </span>
        <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}

function QuestRow({ quest, onClaim }: { quest: ActiveQuest; onClaim: (id: string) => void }) {
  const { t } = useTranslation();
  const done = quest.progress >= quest.target;
  const pct = Math.min(100, (quest.progress / quest.target) * 100);

  return (
    <div className={`quest${quest.claimed ? ' quest--claimed' : ''}`}>
      <div className="quest-header">
        <span className="quest-label">
          {t(`quests.defs.${quest.labelKey}`, { count: quest.target })}
        </span>
        <span className="quest-reward">+{quest.reward} π</span>
      </div>

      <div className="quest-footer">
        <span className="quest-count">
          {Math.min(quest.progress, quest.target)} / {quest.target}
        </span>
        {quest.claimed ? (
          <span className="quest-claimed" aria-label={t('quests.claimed')}>
            ✓
          </span>
        ) : (
          done && (
            <button type="button" className="quest-claim" onClick={() => onClaim(quest.id)}>
              {t('quests.claim')}
            </button>
          )
        )}
      </div>

      <div className="quest-progress">
        <div
          className={`quest-progress-fill${done ? ' is-done' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
