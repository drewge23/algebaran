import { Text, type ColorValue, type TextStyle } from 'react-native';

/**
 * Placeholder icon set. Icons are an explicit design-phase task; using named
 * emoji glyphs here keeps every call site (`<Icon name="stardust" />`) stable so
 * we can swap the implementation for real SVG art later without touching screens.
 */
const GLYPHS = {
  home: '🪐',
  shop: '🛍️',
  profile: '🧑‍🚀',
  stardust: '✨',
  streak: '🔥',
  xp: '⭐',
  lock: '🔒',
  check: '✅',
  hint: '💡',
  star: '⭐',
  rocket: '🚀',
} as const;

export type IconName = keyof typeof GLYPHS;

export function Icon({
  name,
  size = 20,
  color,
}: {
  name: IconName;
  size?: number;
  color?: ColorValue;
}) {
  const style: TextStyle = { fontSize: size, lineHeight: size * 1.2 };
  if (color) style.color = color;
  return <Text style={style}>{GLYPHS[name]}</Text>;
}
