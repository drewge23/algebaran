import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { EmojiPicker } from '@/components/EmojiPicker';
import { SUPPORTED_LANGUAGES, setLanguage, type AppLanguage } from '@/i18n';
import { levelForXp, levelProgress } from '@/lib/economy';
import { clearAccountData } from '@/store/accountScope';
import { selectCurrentAccount, useAuthStore } from '@/store/authStore';
import { selectMultiplier, usePlayerStore } from '@/store/playerStore';
import { selectCompletedCount, useProgressStore } from '@/store/progressStore';

export function Profile() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const pi = usePlayerStore((s) => s.pi);
  const xp = usePlayerStore((s) => s.xp);
  const streak = usePlayerStore((s) => s.streakCount);
  const rating = usePlayerStore((s) => s.rating);
  const duelWins = usePlayerStore((s) => s.duelWins);
  const duelLosses = usePlayerStore((s) => s.duelLosses);
  const multiplier = usePlayerStore(selectMultiplier);
  const persistLanguage = usePlayerStore((s) => s.setLanguage);
  const lessonsCompleted = useProgressStore(selectCompletedCount);

  const account = useAuthStore(selectCurrentAccount);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const signOut = useAuthStore((s) => s.signOut);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const [editingAvatar, setEditingAvatar] = useState(false);

  const level = levelForXp(xp);
  const progress = levelProgress(xp);

  const pickLanguage = (lang: AppLanguage) => {
    setLanguage(lang);
    persistLanguage(lang);
  };

  const removeProfile = () => {
    if (!account) return;
    if (!window.confirm(t('auth.deleteConfirm'))) return;
    clearAccountData(account.id);
    deleteAccount(account.id);
  };

  return (
    <div className="screen screen--scroll">
      <div className="profile-hero">
        <button
          type="button"
          className="profile-hero__ring"
          aria-label={t('auth.avatar')}
          onClick={() => setEditingAvatar((v) => !v)}>
          <div className="profile-hero__inner">
            <span>{account?.avatar ?? '🧑‍🚀'}</span>
          </div>
        </button>
        <div className="center-text">
          <h1 className="screen__title" style={{ fontSize: 26 }}>
            {account?.name ?? t('profile.title')}
          </h1>
          <p className="screen__sub" style={{ marginBottom: 4 }}>
            {t('profile.level', { level })}
          </p>
          <p className="screen__sub">
            {t('profile.nextLevel', {
              percent: Math.round(progress * 100),
              level: level + 1,
            })}
          </p>
        </div>
        <div className="bar" style={{ width: '100%' }}>
          <div className="bar__fill" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>

      {editingAvatar && account && (
        <div className="card" style={{ marginBottom: 20 }}>
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

      <div className="stat-grid">
        <div className="stat">
          <div className="stat__label">{t('profile.pi')}</div>
          <div className="stat__value" style={{ color: 'var(--gold)' }}>
            {pi.toLocaleString()} π
          </div>
        </div>
        <div className="stat">
          <div className="stat__label">{t('profile.multiplier')}</div>
          <div className="stat__value">×{multiplier}</div>
        </div>
        <div className="stat">
          <div className="stat__label">{t('profile.streak')}</div>
          <div className="stat__value">
            {streak > 0
              ? `🔥 ${t('profile.streakDays', { count: streak })}`
              : t('profile.streakNone')}
          </div>
        </div>
        <div className="stat">
          <div className="stat__label">{t('profile.lessonsDone')}</div>
          <div className="stat__value">{lessonsCompleted}</div>
        </div>
        <div className="stat">
          <div className="stat__label">⚔ {t('duel.title')}</div>
          <div className="stat__value" style={{ color: 'var(--gold)' }}>
            {rating}
          </div>
          <div className="tiny dim">
            {duelWins}W · {duelLosses}L
          </div>
        </div>
        <div className="stat">
          <div className="stat__label">{t('profile.xp')}</div>
          <div className="stat__value">{xp}</div>
        </div>
      </div>

      <div className="stack stack--3" style={{ marginTop: 24 }}>
        <button type="button" className="btn btn--primary" onClick={() => navigate('/awards')}>
          🏆 {t('profile.viewAchievements')}
        </button>
        <button type="button" className="btn btn--ghost" onClick={signOut}>
          {t('auth.switchProfile')}
        </button>
      </div>

      <div className="stack stack--2" style={{ marginTop: 24 }}>
        <div className="stat__label">{t('profile.language')}</div>
        <div className="seg-toggle">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              type="button"
              key={lang}
              className={`seg-toggle__opt${i18n.language === lang ? ' seg-toggle__opt--on' : ''}`}
              onClick={() => pickLanguage(lang)}>
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="stack stack--2" style={{ marginTop: 32 }}>
        <p className="tiny dim">{t('auth.localOnly')}</p>
        <button
          type="button"
          className="btn btn--ghost"
          style={{ color: 'var(--danger)' }}
          onClick={removeProfile}>
          {t('auth.deleteProfile')}
        </button>
      </div>
    </div>
  );
}
