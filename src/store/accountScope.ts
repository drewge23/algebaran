import { usePlayerStore } from './playerStore';
import { useProgressStore } from './progressStore';
import { useQuestStore } from './questStore';

/**
 * Gives every account its own save slot.
 *
 * The game stores persist under a fixed key; here we re-point that key at
 * `<base>:<accountId>` and reload. Resetting *before* rehydrating matters: a
 * brand-new account has nothing in storage, and `rehydrate()` alone would leave
 * the previous player's state on screen.
 */
const SCOPED = [
  { store: usePlayerStore, base: 'algebaran-player' },
  { store: useProgressStore, base: 'algebaran-progress' },
  { store: useQuestStore, base: 'algebaran-quests' },
] as const;

export async function bindStoresToAccount(accountId: string | null): Promise<void> {
  await Promise.all(
    SCOPED.map(async ({ store, base }) => {
      const key = accountId ? `${base}:${accountId}` : base;
      // Check for saved data BEFORE re-pointing the store. `reset()` persists,
      // so resetting first would write empty state over this account's save and
      // `rehydrate()` would then faithfully read back the wiped version.
      const hasSave = localStorage.getItem(key) !== null;
      store.persist.setOptions({ name: key });
      if (hasSave) {
        await store.persist.rehydrate();
      } else {
        // Nothing to load: clear the previous account's state off the screen.
        store.getState().reset();
      }
    }),
  );
}

/** Removes an account's saved progress. Used when a profile is deleted. */
export function clearAccountData(accountId: string): void {
  for (const { base } of SCOPED) localStorage.removeItem(`${base}:${accountId}`);
}
