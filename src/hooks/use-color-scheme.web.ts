import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * On web with static rendering, the color scheme must be recomputed on the
 * client after hydration to avoid an SSR mismatch. Mirrors the native hook by
 * returning only `light`/`dark` and defaulting to `dark`.
 */
export function useColorScheme(): 'light' | 'dark' {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // One-shot hydration flag; intentionally sets state once on mount for web SSR.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  const scheme = useRNColorScheme();
  if (!hydrated) return 'dark';
  return scheme === 'light' ? 'light' : 'dark';
}
