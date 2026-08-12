import { useTranslation } from 'react-i18next';

import { ACHIEVEMENTS, type AchievementStats } from '@/content/achievements';
import { levelForXp } from '@/lib/economy';
import { usePlayerStore } from '@/store/playerStore';
import { selectCompletedCount, useProgressStore } from '@/store/progressStore';

export function Achievements() {
  const { t } = useTranslation();

  const pi = usePlayerStore((s) => s.pi);
  const xp = usePlayerStore((s) => s.xp);
  const streakCount = usePlayerStore((s) => s.streakCount);
  const lessonsCompleted = useProgressStore(selectCompletedCount);

  const stats: AchievementStats = {
    lessonsCompleted,
    streakCount,
    level: levelForXp(xp),
    pi,
  };

  const unlocked = ACHIEVEMENTS.filter((a) => a.isUnlocked(stats));

  return (
    <div className="screen screen--scroll">
      <div className="topbar">
        <h1 className="screen__title" style={{ fontSize: 26 }}>
          {t('achievements.title')}
        </h1>
      </div>
      <p className="screen__sub">
        {t('achievements.progress', { unlocked: unlocked.length, total: ACHIEVEMENTS.length })}
      </p>

      <div className="bar" style={{ marginTop: 12 }}>
        <div
          className="bar__fill"
          style={{ width: `${(unlocked.length / ACHIEVEMENTS.length) * 100}%` }}
        />
      </div>

      <div className="stack stack--3" style={{ marginTop: 20 }}>
        {ACHIEVEMENTS.map((a) => {
          const isUnlocked = a.isUnlocked(stats);
          return (
            <div className={`tile${isUnlocked ? '' : ' tile--locked'}`} key={a.id}>
              <div className="tile__glyph">{isUnlocked ? a.glyph : '🔒'}</div>
              <div className="tile__grow">
                <div className="tile__name">{a.name}</div>
                <div className="tile__desc">{a.description}</div>
              </div>
              <div className="tile__action">
                <span
                  className="tiny"
                  style={{
                    color: isUnlocked ? 'var(--green)' : 'var(--text-faint)',
                    fontWeight: 700,
                  }}>
                  {isUnlocked ? t('achievements.unlocked') : t('achievements.locked')}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
