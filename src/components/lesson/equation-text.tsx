import { StyleSheet, Text, type TextStyle } from 'react-native';

import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Renders a quadratic equation prominently. Equations are plain strings using
 * Unicode superscripts (`x²`) and the true minus sign (`−`), so no math engine
 * is needed — a deliberate, lightweight choice for a keyboard-driven app.
 */
export function EquationText({
  children,
  size = 30,
  style,
}: {
  children: string;
  size?: number;
  style?: TextStyle;
}) {
  const theme = useTheme();
  return (
    <Text
      style={[styles.equation, { color: theme.text, fontSize: size, fontFamily: Fonts.rounded }, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  equation: {
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 1,
  },
});
