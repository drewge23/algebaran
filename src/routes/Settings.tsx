import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { SUPPORTED_LANGUAGES, setLanguage, type AppLanguage } from '@/i18n';
import { clearAccountData } from '@/store/accountScope';
import { selectCurrentAccount, useAuthStore } from '@/store/authStore';
import { usePlayerStore } from '@/store/playerStore';
import { useSettingsStore } from '@/store/settingsStore';

/**
 * Settings, deliberately plain.
 *
 * Only rows that do something are here. There is no Sound or Music switch
 * because the app has neither yet, and a toggle that controls nothing is worse
 * than a missing one — especially for the audience this is built for. Dark is
 * stated rather than offered: the art direction commits to one theme.
 */
export function Settings() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const haptics = useSettingsStore((s) => s.haptics);
  const setHaptics = useSettingsStore((s) => s.setHaptics);
  const persistLanguage = usePlayerStore((s) => s.setLanguage);

  const account = useAuthStore(selectCurrentAccount);
  const signOut = useAuthStore((s) => s.signOut);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const [aboutOpen, setAboutOpen] = useState(false);

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
    <div className="settings-screen">
      <div className="settings-header">
        <button
          type="button"
          className="icon-btn"
          aria-label={t('common.back')}
          onClick={() => navigate('/profile')}>
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <h1 className="screen__title" style={{ fontSize: 20 }}>
          {t('settings.title')}
        </h1>
      </div>

      <div className="settings-list">
        <label className="settings-row">
          <span className="settings-label">{t('settings.haptics')}</span>
          <span className="switch">
            <input
              type="checkbox"
              checked={haptics}
              onChange={(e) => setHaptics(e.target.checked)}
            />
            <span className="switch__track" aria-hidden="true" />
          </span>
        </label>

        <div className="settings-row">
          <span className="settings-label">{t('settings.appearance')}</span>
          <span className="settings-value">{t('settings.dark')}</span>
        </div>

        <div className="settings-row">
          <span className="settings-label">{t('profile.language')}</span>
          <span className="seg-toggle">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                type="button"
                key={lang}
                className={`seg-toggle__opt${i18n.language === lang ? ' seg-toggle__opt--on' : ''}`}
                onClick={() => pickLanguage(lang)}>
                {lang.toUpperCase()}
              </button>
            ))}
          </span>
        </div>

        <button
          type="button"
          className="settings-row"
          aria-expanded={aboutOpen}
          onClick={() => setAboutOpen((v) => !v)}>
          <span className="settings-label">{t('settings.about')}</span>
          <ChevronRight
            size={17}
            className="settings-chevron"
            style={{ rotate: aboutOpen ? '90deg' : undefined }}
            aria-hidden="true"
          />
        </button>

        {aboutOpen && (
          <p className="settings-about">
            {t('settings.version', { version: __APP_VERSION__ })}
            <br />
            {t('auth.localOnly')}
          </p>
        )}
      </div>

      <button type="button" className="settings-row settings-action" onClick={signOut}>
        <span className="settings-label">{t('auth.switchProfile')}</span>
        <ChevronRight size={17} className="settings-chevron" aria-hidden="true" />
      </button>

      <button type="button" className="settings-danger" onClick={removeProfile}>
        {t('auth.deleteProfile')}
      </button>
    </div>
  );
}
