import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';

import { BottomNav } from '@/components/BottomNav';
import { Achievements } from '@/routes/Achievements';
import { BeatTheClock } from '@/routes/BeatTheClock';
import { Collect } from '@/routes/Collect';
import { LessonRoute } from '@/routes/Lesson';
import { LessonMap } from '@/routes/LessonMap';
import { Profile } from '@/routes/Profile';

/**
 * Hash routing keeps the app deployable to any static host (GitHub Pages,
 * a plain file server) without server-side SPA rewrites.
 */
export function App() {
  return (
    <HashRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<LessonMap />} />
          <Route path="/collect" element={<Collect />} />
          <Route path="/awards" element={<Achievements />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/lesson/:id" element={<LessonRoute />} />
          <Route path="/beat-the-clock" element={<BeatTheClock />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <BottomNav />
      </div>
    </HashRouter>
  );
}
