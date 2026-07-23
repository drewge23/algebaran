import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * Like React Native's `useColorScheme`, but falls back to `dark` when the
 * system preference is unavailable — Algebaran's cosmic look lives in the dark.
 */
export function useColorScheme(): 'light' | 'dark' {
  return useRNColorScheme() === 'light' ? 'light' : 'dark';
}
