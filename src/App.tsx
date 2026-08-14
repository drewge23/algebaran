import { useEffect, useRef, useState } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import { BottomNav } from '@/components/BottomNav';
import { Achievements } from '@/routes/Achievements';
import { BeatTheClock } from '@/routes/BeatTheClock';
import { Collect } from '@/routes/Collect';
import { Duel } from '@/routes/Duel';
import { LessonRoute } from '@/routes/Lesson';
import { RegionScreen } from '@/routes/RegionScreen';
import { WorldMap } from '@/routes/WorldMap';
import { Worlds } from '@/routes/Worlds';
import { Profile } from '@/routes/Profile';
import { ProjectList, ProjectRoute } from '@/routes/Projects';
import { Quests } from '@/routes/Quests';
import { Welcome } from '@/routes/Welcome';
import { bindStoresToAccount } from '@/store/accountScope';
import { useAuthStore } from '@/store/authStore';
import { rememberedPath, useNavMemory } from '@/store/navStore';
import { useQuestStore } from '@/store/questStore';

/**
 * Hash routing keeps the app deployable to any static host (GitHub Pages,
 * a plain file server) without server-side SPA rewrites.
 */
export function App() {
  return (
    <HashRouter>
      <AuthGate />
    </HashRouter>
  );
}

/**
 * Puts the learner back where they left off, once per app launch.
 *
 * Only fires when landing on the world selector with a position remembered, so
 * navigating *back* to the selector deliberately stays there — the back button
 * clears the memory, which is what stops this from trapping anyone.
 */
function RestoreLastPlace() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const nav = useNavMemory();
  const restored = useRef(false);

  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    if (pathname !== '/') return;
    const target = rememberedPath(nav);
    if (target) navigate(target, { replace: true });
  }, [navigate, pathname, nav]);

  return null;
}

/**
 * Nothing renders until the signed-in account's save slot is loaded — otherwise
 * the first paint would briefly show the previous player's π and progress.
 */
function AuthGate() {
  const currentAccountId = useAuthStore((s) => s.currentAccountId);
  // `undefined` means "nothing bound yet"; a bound value is compared against the
  // current account so readiness is derived rather than set twice per switch.
  const [boundTo, setBoundTo] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    bindStoresToAccount(currentAccountId).then(() => {
      if (cancelled) return;
      // Roll daily/monthly quests forward for the account we just loaded.
      if (currentAccountId) useQuestStore.getState().refresh();
      setBoundTo(currentAccountId);
    });
    return () => {
      cancelled = true;
    };
  }, [currentAccountId]);

  if (boundTo !== currentAccountId) {
    return (
      <div className="app">
        <div className="loading">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (!currentAccountId) {
    return (
      <div className="app">
        <Welcome />
      </div>
    );
  }

  return (
    <div className="app">
      <RestoreLastPlace />
      <Routes>
        <Route path="/" element={<Worlds />} />
        <Route path="/world/:worldId" element={<WorldMap />} />
        <Route path="/region/:regionId" element={<RegionScreen />} />
        <Route path="/projects" element={<ProjectList />} />
        <Route path="/projects/:id" element={<ProjectRoute />} />
        <Route path="/quests" element={<Quests />} />
        <Route path="/collect" element={<Collect />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/awards" element={<Achievements />} />
        <Route path="/lesson/:id" element={<LessonRoute />} />
        <Route path="/beat-the-clock" element={<BeatTheClock />} />
        <Route path="/duel" element={<Duel />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </div>
  );
}
