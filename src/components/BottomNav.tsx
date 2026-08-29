import { useTranslation } from 'react-i18next';
import { ClipboardList, Orbit, Rocket, ShoppingBag, UserRound } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';

import { selectClaimable, useQuestStore } from '@/store/questStore';

/**
 * Icons come from lucide-react: stroke-only, drawn on a 24px grid, and painted
 * with `currentColor`, so the active/inactive states are one colour change
 * rather than two sets of artwork. Only the five in use are imported, which is
 * what keeps the icon set off the bundle.
 */
const TABS = [
  { to: '/', Icon: Orbit, key: 'tabs.lessons' },
  { to: '/projects', Icon: Rocket, key: 'tabs.projects' },
  { to: '/quests', Icon: ClipboardList, key: 'tabs.quests' },
  { to: '/collect', Icon: ShoppingBag, key: 'tabs.collect' },
  { to: '/profile', Icon: UserRound, key: 'tabs.profile' },
] as const;

/** Full-screen flows that need the whole viewport (and the keyboard's room). */
const IMMERSIVE = ['/lesson/', '/beat-the-clock', '/graph-game/', '/duel', '/projects/mission/'];

export function BottomNav() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const claimable = useQuestStore(selectClaimable);

  if (IMMERSIVE.some((p) => pathname.startsWith(p))) return null;

  return (
    <nav className="nav">
      <div className="nav__inner">
        {TABS.map(({ to, Icon, key }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav__item${isActive ? ' nav__item--active' : ''}`}>
            <span className="nav__icon">
              <Icon size={23} strokeWidth={1.9} aria-hidden="true" />
              {to === '/quests' && claimable > 0 && <span className="nav__dot" />}
            </span>
            <span className="nav__label">{t(key)}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
