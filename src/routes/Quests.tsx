import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { MascotSays } from '@/components/Mascot';
import { PiPill } from '@/components/PiPill';
import { usePlayerStore } from '@/store/playerStore';
import { useQuestStore, type ActiveQuest } from '@/store/questStore';

export function Quests() {
  const { t } = useTranslation();
  const daily = useQuestStore((s) => s.daily);
  const monthly = useQuestStore((s) => s.monthly);
  const refresh = useQuestStore((s) => s.refresh);
  const claim = useQuestStore((s) => s.claim);
  const addPi = usePlayerStore((s) => s.addPi);

  // Rolls the sets over if the day or month changed while the app was closed.
  useEffect(() => {
    refresh();
  }, [refresh]);

  const onClaim = (id: string) => {
    const reward = claim(id);
    if (reward > 0) {
      addPi(reward);
      navigator.vibrate?.(12);
    }
  };

  const claimable = [...daily, ...monthly].filter(
    (q) => !q.claimed && q.progress >= q.target,
  ).length;

  return (
    <div className="screen screen--scroll">
      <div className="topbar">
        <div className="grow">
          <h1 className="screen__title" style={{ fontSize: 26 }}>
            {t('quests.title')}
          </h1>
        </div>
        <PiPill />
      </div>
      <p className="screen__sub">{t('quests.subtitle')}</p>

      <MascotSays mood={claimable > 0 ? 'excited' : 'happy'}>
        {claimable > 0 ? t('quests.hasClaimable', { count: claimable }) : t('quests.intro')}
      </MascotSays>

      <QuestGroup
        title={t('quests.daily')}
        note={t('quests.dailyNote')}
        quests={daily}
        onClaim={onClaim}
      />
      <QuestGroup
        title={t('quests.monthly')}
        note={t('quests.monthlyNote')}
        quests={monthly}
        onClaim={onClaim}
      />
    </div>
  );
}

function QuestGroup({
  title,
  note,
  quests,
  onClaim,
}: {
  title: string;
  note: string;
  quests: ActiveQuest[];
  onClaim: (id: string) => void;
}) {
  const { t } = useTranslation();
  if (quests.length === 0) return null;

  return (
    <section className="stack stack--2" style={{ marginTop: 24 }}>
      <div className="row">
        <span className="map-section__title grow">{title}</span>
        <span className="tiny dim">{note}</span>
      </div>

      {quests.map((q) => {
        const done = q.progress >= q.target;
        const pct = Math.min(100, (q.progress / q.target) * 100);
        return (
          <div className={`quest${q.claimed ? ' quest--claimed' : ''}`} key={q.id}>
            <div className="row" style={{ alignItems: 'flex-start' }}>
              <div className="tile__grow">
                <div className="tile__name">
                  {t(`quests.defs.${q.labelKey}`, { count: q.target })}
                </div>
                <div className="tile__meta">+{q.reward} π</div>
              </div>
              {q.claimed ? (
                <span className="badge-done">✓</span>
              ) : (
                <button
                  type="button"
                  className={`chip-btn${done ? '' : ' chip-btn--muted'}`}
                  disabled={!done}
                  onClick={() => onClaim(q.id)}>
                  {done ? t('quests.claim') : `${q.progress}/${q.target}`}
                </button>
              )}
            </div>
            <div className="bar" style={{ marginTop: 10, height: 6 }}>
              <div
                className="bar__fill"
                style={{
                  width: `${pct}%`,
                  background: done ? 'var(--green-deep)' : undefined,
                }}
              />
            </div>
          </div>
        );
      })}
    </section>
  );
}
