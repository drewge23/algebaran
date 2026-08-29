import { useSettingsStore } from '@/store/settingsStore';

/**
 * Every buzz in the app goes through here.
 *
 * Two reasons: the setting has one place to be honoured, and `navigator.vibrate`
 * does not exist on desktop or iOS Safari — so callers never have to remember
 * the optional call.
 */
export function buzz(pattern: number | number[]): void {
  if (!useSettingsStore.getState().haptics) return;
  navigator.vibrate?.(pattern);
}
