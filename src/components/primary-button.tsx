import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variant = 'primary' | 'secondary';

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  variant = 'primary',
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  variant?: Variant;
}) {
  const theme = useTheme();

  const backgroundColor = disabled
    ? theme.backgroundSelected
    : variant === 'primary'
      ? theme.primary
      : theme.backgroundElement;
  const textColor = variant === 'primary' && !disabled ? '#FFFFFF' : theme.text;

  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor, opacity: pressed ? 0.85 : 1 },
        variant === 'secondary' && { borderWidth: 1, borderColor: theme.border },
      ]}>
      <ThemedText type="smallBold" style={{ color: textColor }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
