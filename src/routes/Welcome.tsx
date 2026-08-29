import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AVATAR_EMOJI, EmojiPicker } from '@/components/EmojiPicker';
import { MascotSays, PROFESSORSON_FULL } from '@/components/Mascot';
import { MAX_NAME, useAuthStore } from '@/store/authStore';

type Mode = 'choose' | 'register' | 'signIn';

/**
 * Registration and sign-in for local, device-scoped profiles. See `authStore`
 * for why this is not a hosted account system.
 */
export function Welcome() {
  const { t } = useTranslation();
  const accounts = useAuthStore((s) => s.accounts);
  const [mode, setMode] = useState<Mode>(accounts.length > 0 ? 'choose' : 'register');

  return (
    <div className="screen screen--scroll">
      <div className="welcome-hero">
        {/* The front door is the one screen with room for the whole drawing. */}
        <img className="welcome-hero__art" src={PROFESSORSON_FULL} alt="" draggable={false} />
        <h1 className="screen__title">{t('common.appName')}</h1>
        <p className="screen__sub">{t('common.tagline')}</p>
      </div>

      <MascotSays mood="happy" name>
        {t('auth.welcome')}
      </MascotSays>

      {mode === 'choose' && <ChooseProfile onRegister={() => setMode('register')} />}
      {mode === 'register' && (
        <RegisterForm onCancel={accounts.length > 0 ? () => setMode('choose') : undefined} />
      )}
    </div>
  );
}

function ChooseProfile({ onRegister }: { onRegister: () => void }) {
  const { t } = useTranslation();
  const accounts = useAuthStore((s) => s.accounts);
  const signIn = useAuthStore((s) => s.signIn);

  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const attempt = (id: string, withPin?: string) => {
    const res = signIn(id, withPin);
    if (!res.ok) {
      if (res.error === 'wrongPin') setError('wrongPin');
      setPendingId(id);
    }
  };

  return (
    <div className="stack stack--3" style={{ marginTop: 8 }}>
      <div className="map-section__title">{t('auth.chooseProfile')}</div>

      {accounts.map((account) => (
        <div key={account.id} className="stack stack--2">
          <button
            type="button"
            className="tile"
            style={{ width: '100%', textAlign: 'left' }}
            onClick={() => {
              setError(null);
              setPin('');
              if (account.pin === null) attempt(account.id);
              else setPendingId(pendingId === account.id ? null : account.id);
            }}>
            <span className="tile__glyph">{account.avatar}</span>
            <span className="tile__grow">
              <span className="tile__name">{account.name}</span>
              <span className="tile__desc">
                {account.pin === null ? t('auth.noPin') : t('auth.pinProtected')}
              </span>
            </span>
          </button>

          {pendingId === account.id && account.pin !== null && (
            <div className="card" style={{ padding: 16 }}>
              <label className="stat__label" htmlFor={`pin-${account.id}`}>
                {t('auth.enterPin')}
              </label>
              <input
                id={`pin-${account.id}`}
                className="text-input"
                inputMode="numeric"
                autoComplete="off"
                maxLength={4}
                value={pin}
                onChange={(e) => {
                  setError(null);
                  setPin(e.target.value.replace(/\D/g, ''));
                }}
              />
              {error && <p className="form-error">{t(`auth.errors.${error}`)}</p>}
              <button
                type="button"
                className="btn btn--primary"
                style={{ marginTop: 12 }}
                disabled={pin.length !== 4}
                onClick={() => attempt(account.id, pin)}>
                {t('auth.signIn')}
              </button>
            </div>
          )}
        </div>
      ))}

      <button type="button" className="btn btn--ghost" onClick={onRegister}>
        + {t('auth.newProfile')}
      </button>
    </div>
  );
}

function RegisterForm({ onCancel }: { onCancel?: () => void }) {
  const { t } = useTranslation();
  const register = useAuthStore((s) => s.register);

  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<string>(AVATAR_EMOJI[0]);
  const [usePin, setUsePin] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const res = register(name, avatar, usePin ? pin : null);
    if (!res.ok) setError(res.error ?? 'unknown');
  };

  const pinValid = !usePin || /^\d{4}$/.test(pin);

  return (
    <div className="card" style={{ marginTop: 8 }}>
      <div className="card__kicker">🚀 {t('auth.createTitle')}</div>

      <label className="stat__label" htmlFor="reg-name">
        {t('auth.name')}
      </label>
      <input
        id="reg-name"
        className="text-input"
        maxLength={MAX_NAME}
        placeholder={t('auth.namePlaceholder')}
        value={name}
        onChange={(e) => {
          setError(null);
          setName(e.target.value);
        }}
      />

      <div className="stat__label" style={{ marginTop: 18 }}>
        {t('auth.avatar')}
      </div>
      <EmojiPicker value={avatar} onChange={setAvatar} />

      <label className="check-row">
        <input type="checkbox" checked={usePin} onChange={(e) => setUsePin(e.target.checked)} />
        <span>
          <span className="tile__name">{t('auth.usePin')}</span>
          <span className="tile__desc">{t('auth.pinNote')}</span>
        </span>
      </label>

      {usePin && (
        <input
          className="text-input"
          inputMode="numeric"
          autoComplete="off"
          maxLength={4}
          placeholder="0000"
          value={pin}
          onChange={(e) => {
            setError(null);
            setPin(e.target.value.replace(/\D/g, ''));
          }}
        />
      )}

      {error && <p className="form-error">{t(`auth.errors.${error}`)}</p>}

      <div className="btn--wide-pair" style={{ marginTop: 20 }}>
        <button
          type="button"
          className="btn btn--primary"
          disabled={!name.trim() || !pinValid}
          onClick={submit}>
          {t('auth.createAccount')} →
        </button>
        {onCancel && (
          <button type="button" className="btn btn--paper btn--auto" onClick={onCancel}>
            {t('common.cancel')}
          </button>
        )}
      </div>
    </div>
  );
}
