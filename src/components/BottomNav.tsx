import { useTranslation } from 'react-i18next';
import { NavLink, useLocation } from 'react-router-dom';

import { selectClaimable, useQuestStore } from '@/store/questStore';

const TABS = [
  { to: '/', icon: '🪐', key: 'tabs.lessons' },
  { to: '/projects', icon: '🛠️', key: 'tabs.projects' },
  { to: '/quests', icon: '📋', key: 'tabs.quests' },
  { to: '/collect', icon: '✨', key: 'tabs.collect' },
  { to: '/profile', icon: '🧑‍🚀', key: 'tabs.profile' },
] as const;

/** Full-screen flows that need the whole viewport (and the keyboard's room). */
const IMMERSIVE = ['/lesson/', '/beat-the-clock', '/duel'];

export function BottomNav() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const claimable = useQuestStore(selectClaimable);

  const immersive =
    IMMERSIVE.some((p) => pathname.startsWith(p)) || /^\/projects\/.+/.test(pathname);
  if (immersive) return null;

  return (
    <nav className="nav">
      <div className="nav__inner">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) => `nav__item${isActive ? ' nav__item--active' : ''}`}>
            <span className="nav__icon" aria-hidden="true">
              {tab.icon}
              {tab.to === '/quests' && claimable > 0 && <span className="nav__dot" />}
            </span>
            {t(tab.key)}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
