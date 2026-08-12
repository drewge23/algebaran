import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Mascot } from '@/components/Mascot';
import { getShopItem } from '@/content/shop';
import { SUPPORTED_LANGUAGES, setLanguage, type AppLanguage } from '@/i18n';
import { levelForXp, levelProgress } from '@/lib/economy';
import { DEFAULT_AVATAR_ID, selectMultiplier, usePlayerStore } from '@/store/playerStore';
import { selectCompletedCount, useProgressStore } from '@/store/progressStore';

export function Profile() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const pi = usePlayerStore((s) => s.pi);
  const xp = usePlayerStore((s) => s.xp);
  const streak = usePlayerStore((s) => s.streakCount);
  const equippedAvatarId = usePlayerStore((s) => s.equippedAvatarId);
  const multiplier = usePlayerStore(selectMultiplier);
  const persistLanguage = usePlayerStore((s) => s.setLanguage);
  const lessonsCompleted = useProgressStore(selectCompletedCount);

  const level = levelForXp(xp);
  const progress = levelProgress(xp);
  const equipped = equippedAvatarId === DEFAULT_AVATAR_ID ? null : getShopItem(equippedAvatarId);

  const pickLanguage = (lang: AppLanguage) => {
    setLanguage(lang);
    persistLanguage(lang);
  };

  return (
    <div className="screen screen--scroll">
      <div className="profile-hero">
        <div className="profile-hero__ring">
          <div className="profile-hero__inner">
            {equipped ? <span>{equipped.glyph}</span> : <Mascot mood="wink" />}
          </div>
        </div>
        <div className="center-text">
          <h1 className="screen__title" style={{ fontSize: 26 }}>
            {t('profile.level', { level })}
          </h1>
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
      </div>

      <div className="stack stack--3" style={{ marginTop: 24 }}>
        <button type="button" className="btn btn--primary" onClick={() => navigate('/awards')}>
          🏆 {t('profile.viewAchievements')}
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
    </div>
  );
}
