import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { EmojiPicker } from '@/components/EmojiPicker';
import { ACHIEVEMENTS, type AchievementStats } from '@/content/achievements';
import { SYSTEMS, levelsOfSystem } from '@/content/curriculum';
import { cumulativeXpForLevel, levelForXp, xpForLevel } from '@/lib/economy';
import { selectCurrentAccount, useAuthStore } from '@/store/authStore';
import { usePlayerStore } from '@/store/playerStore';
import {
  selectCompletedCount,
  selectProjectComplete,
  tally,
  useProgressStore,
} from '@/store/progressStore';

/**
 * Identity, progression and the numbers behind them.
 *
 * Three headline stats on a hairline band, then badges, then the most recent
 * achievements — nothing boxed that does not need to be. Settings live behind
 * the gear rather than at the bottom of this screen, so what stays here is only
 * the things a player wants to look at.
 */
export function Profile() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const pi = usePlayerStore((s) => s.pi);
  const xp = usePlayerStore((s) => s.xp);
  const streak = usePlayerStore((s) => s.streakCount);
  const lessonsCompleted = useProgressStore(selectCompletedCount);
  const completed = useProgressStore((s) => s.completed);
  const projectComplete = useProgressStore(selectProjectComplete);

  const account = useAuthStore(selectCurrentAccount);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const [editingAvatar, setEditingAvatar] = useState(false);

  const level = levelForXp(xp);
  const intoLevel = xp - cumulativeXpForLevel(level);
  const needed = xpForLevel(level);

  // A world counts as started once anything inside it is finished.
  const worldsStarted = SYSTEMS.filter(
    (s) => tally(completed, levelsOfSystem(s.id)).done > 0,
  ).length;

  const stats: AchievementStats = {
    lessonsCompleted,
    streakCount: streak,
    level,
    pi,
    projectComplete,
  };
  const unlocked = ACHIEVEMENTS.filter((a) => a.isUnlocked(stats));

  return (
    <div className="profile-screen screen--scroll">
      <div className="profile-top">
        <button
          type="button"
          className="icon-btn"
          aria-label={t('settings.title')}
          onClick={() => navigate('/settings')}>
          <Settings size={19} aria-hidden="true" />
        </button>
      </div>

      <button
        type="button"
        className="profile-avatar"
        aria-label={t('auth.avatar')}
        onClick={() => setEditingAvatar((v) => !v)}>
        <span>{account?.avatar ?? '🧑‍🚀'}</span>
      </button>

      <h1 className="profile-name">{account?.name ?? t('profile.title')}</h1>

      {editingAvatar && account && (
        <div className="card" style={{ margin: '16px 0', textAlign: 'left' }}>
          <div className="card__kicker">🎨 {t('auth.avatar')}</div>
          <EmojiPicker
            value={account.avatar}
            onChange={(avatar) => {
              updateProfile(account.id, { avatar });
              setEditingAvatar(false);
            }}
          />
        </div>
      )}

      <div className="profile-level">{t('profile.levelShort', { level })}</div>
      <div className="profile-xp">
        <div className="bar">
          <div className="bar__fill" style={{ width: `${(intoLevel / needed) * 100}%` }} />
        </div>
        <div className="profile-xp__label">
          {intoLevel.toLocaleString()} / {needed.toLocaleString()} {t('profile.xp')}
        </div>
      </div>

      <div className="profile-stats">
        <Stat value={worldsStarted} label={t('tabs.lessons')} />
        <Stat value={lessonsCompleted} label={t('profile.lessonsDone')} />
        <Stat value={streak} label={t('profile.streak')} />
      </div>

      <div className="profile-pi">
        {t('profile.pi')}: <strong>{pi.toLocaleString()} π</strong>
      </div>

      <button type="button" className="profile-section" onClick={() => navigate('/awards')}>
        <span className="profile-section__title">{t('profile.badges')}</span>
        <span className="profile-section__more">
          {t('profile.view')}
          <ChevronRight size={15} aria-hidden="true" />
        </span>
      </button>

      <div className="badge-row">
        {ACHIEVEMENTS.slice(0, 5).map((a) => {
          const has = unlocked.some((u) => u.id === a.id);
          return (
            <span
              key={a.id}
              className={`badge-dot${has ? ' badge-dot--on' : ''}`}
              title={a.name}
              aria-label={`${a.name}${has ? '' : ` — ${t('achievements.locked')}`}`}>
              {has ? a.glyph : '·'}
            </span>
          );
        })}
      </div>

      {unlocked.length > 0 && (
        <>
          <div className="profile-section">
            <span className="profile-section__title">{t('profile.recent')}</span>
          </div>
          <div className="achievement-list">
            {unlocked
              .slice(-2)
              .reverse()
              .map((a) => (
                <div className="achievement-row" key={a.id}>
                  <span className="achievement-row__glyph" aria-hidden="true">
                    {a.glyph}
                  </span>
                  <span className="grow">
                    <span className="achievement-row__name">{a.name}</span>
                    <span className="achievement-row__desc">{a.description}</span>
                  </span>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="profile-stat-value">{value.toLocaleString()}</div>
      <div className="profile-stat-label">{label}</div>
    </div>
  );
}
