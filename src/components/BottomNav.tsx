import { useTranslation } from 'react-i18next';
import { NavLink, useLocation } from 'react-router-dom';

const TABS = [
  { to: '/', icon: '🪐', key: 'tabs.lessons' },
  { to: '/collect', icon: '✨', key: 'tabs.collect' },
  { to: '/awards', icon: '🏆', key: 'tabs.awards' },
  { to: '/profile', icon: '🧑‍🚀', key: 'tabs.profile' },
] as const;

export function BottomNav() {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  // Lessons and the timed round are focused, full-screen flows (and need the
  // room for the keyboard), so the nav steps out of the way.
  if (pathname.startsWith('/lesson/') || pathname === '/beat-the-clock') return null;

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
            </span>
            {t(tab.key)}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
