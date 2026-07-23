/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

/**
 * Algebaran's "cosmic" palette. Both schemes define the same keys so every
 * themed component works in light and dark. The template's original keys
 * (text, background, backgroundElement, backgroundSelected, textSecondary) are
 * preserved; the rest are Algebaran additions.
 */
export const Colors = {
  light: {
    text: '#12142B',
    background: '#F7F8FE',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#ECEDFB',
    textSecondary: '#5B6088',
    primary: '#6C5CE7', // nebula violet
    accent: '#E9A400', // stardust gold
    success: '#16A34A',
    danger: '#E5484D',
    border: '#E2E3F1',
  },
  dark: {
    text: '#F5F7FF',
    background: '#0B1026', // deep space
    backgroundElement: '#161B3D', // card
    backgroundSelected: '#232A5C',
    textSecondary: '#A6ADD0',
    primary: '#8B7CF6', // nebula violet
    accent: '#FFD36E', // stardust gold
    success: '#4ADE80',
    danger: '#FF6B6B',
    border: '#232A5C',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/** Background gradient stops per scheme (top → bottom), for the cosmic backdrop. */
export const Gradients = {
  light: ['#F7F8FE', '#ECECFB', '#E4E6FA'] as const,
  dark: ['#0B1026', '#141A3A', '#0B1026'] as const,
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
