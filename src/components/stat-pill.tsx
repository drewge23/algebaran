import { StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Small rounded chip showing an icon and a value (e.g. Stardust balance, streak). */
export function StatPill({ icon, value }: { icon: IconName; value: string | number }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}>
      <Icon name={icon} size={16} />
      <ThemedText type="smallBold">{String(value)}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.five,
    borderWidth: 1,
  },
});
