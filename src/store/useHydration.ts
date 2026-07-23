import { useEffect, useState } from 'react';

import { usePlayerStore } from './playerStore';
import { useProgressStore } from './progressStore';

const stores = [usePlayerStore, useProgressStore];

/**
 * Returns `true` once every persisted store has finished rehydrating from
 * AsyncStorage. The loading screen uses this to gate entry into the app so we
 * never render with empty defaults over the top of saved progress.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => stores.every((s) => s.persist.hasHydrated()));

  useEffect(() => {
    const update = () => setHydrated(stores.every((s) => s.persist.hasHydrated()));
    const unsubscribers = stores.map((s) => s.persist.onFinishHydration(update));
    update();
    return () => unsubscribers.forEach((unsub) => unsub());
  }, []);

  return hydrated;
}
