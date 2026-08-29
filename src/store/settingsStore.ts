import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Device preferences, kept out of the account save slots on purpose: haptics
 * and language belong to the phone, not to whoever is signed in on it, so
 * switching profiles must not silently change how the device behaves.
 */
interface SettingsState {
  haptics: boolean;
  setHaptics: (on: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      haptics: true,
      setHaptics: (on) => set({ haptics: on }),
    }),
    { name: 'algebaran-settings', version: 1 },
  ),
);
