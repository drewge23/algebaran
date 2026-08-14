import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { persistStorage } from './storage';

/**
 * Local, device-scoped accounts.
 *
 * There is no backend, and the audience is school students — putting minors'
 * credentials on a server carries obligations this prototype should not take
 * on. So an "account" lives in this browser: it gives real registration,
 * sign-in, sign-out and profile switching, and each account gets its own saved
 * progress. Swapping this for a hosted identity provider later means replacing
 * this store and the namespacing in `activeStorageSuffix` — nothing else.
 *
 * The PIN is a courtesy lock so siblings don't wreck each other's progress. It
 * is NOT security: anyone with devtools can read it. Never present it as such,
 * and never store anything genuinely sensitive here.
 */
export interface Account {
  id: string;
  name: string;
  /** Emoji used as the profile picture. */
  avatar: string;
  /** Optional 4-digit lock. `null` means the profile opens without one. */
  pin: string | null;
  createdAt: string;
}

interface AuthData {
  accounts: Account[];
  currentAccountId: string | null;
}

interface AuthActions {
  register: (name: string, avatar: string, pin: string | null) => { ok: boolean; error?: string };
  signIn: (id: string, pin?: string) => { ok: boolean; error?: string };
  signOut: () => void;
  updateProfile: (id: string, patch: Partial<Pick<Account, 'name' | 'avatar'>>) => void;
  deleteAccount: (id: string) => void;
}

export type AuthState = AuthData & AuthActions;

export const MAX_NAME = 16;

const newId = () => `acc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accounts: [],
      currentAccountId: null,

      register: (name, avatar, pin) => {
        const trimmed = name.trim();
        if (!trimmed) return { ok: false, error: 'nameRequired' };
        if (trimmed.length > MAX_NAME) return { ok: false, error: 'nameTooLong' };
        const taken = get().accounts.some((a) => a.name.toLowerCase() === trimmed.toLowerCase());
        if (taken) return { ok: false, error: 'nameTaken' };
        if (pin !== null && !/^\d{4}$/.test(pin)) return { ok: false, error: 'pinFormat' };

        const account: Account = {
          id: newId(),
          name: trimmed,
          avatar,
          pin,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ accounts: [...s.accounts, account], currentAccountId: account.id }));
        return { ok: true };
      },

      signIn: (id, pin) => {
        const account = get().accounts.find((a) => a.id === id);
        if (!account) return { ok: false, error: 'notFound' };
        if (account.pin !== null && account.pin !== pin) return { ok: false, error: 'wrongPin' };
        set({ currentAccountId: id });
        return { ok: true };
      },

      signOut: () => set({ currentAccountId: null }),

      updateProfile: (id, patch) =>
        set((s) => ({
          accounts: s.accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        })),

      deleteAccount: (id) =>
        set((s) => ({
          accounts: s.accounts.filter((a) => a.id !== id),
          currentAccountId: s.currentAccountId === id ? null : s.currentAccountId,
        })),
    }),
    {
      name: 'algebaran-accounts',
      version: 1,
      storage: persistStorage,
      partialize: (s): AuthData => ({
        accounts: s.accounts,
        currentAccountId: s.currentAccountId,
      }),
    },
  ),
);

export const selectCurrentAccount = (s: AuthState): Account | null =>
  s.accounts.find((a) => a.id === s.currentAccountId) ?? null;
