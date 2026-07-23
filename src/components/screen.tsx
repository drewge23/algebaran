import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, type ViewStyle } from 'react-native';
import { type Edge, SafeAreaView } from 'react-native-safe-area-context';

import { Gradients } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * Full-screen cosmic backdrop with a safe-area content area. Wrap every screen
 * in this so the gradient and insets stay consistent across the app.
 */
export function Screen({
  children,
  center = false,
  edges = ['top', 'bottom'],
  style,
}: {
  children: React.ReactNode;
  center?: boolean;
  edges?: readonly Edge[];
  style?: ViewStyle;
}) {
  const scheme = useColorScheme();
  return (
    <LinearGradient colors={Gradients[scheme]} style={styles.fill}>
      <SafeAreaView edges={edges} style={[styles.fill, center && styles.center, style]}>
        {children}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
});
