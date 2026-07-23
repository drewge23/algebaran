import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { usePlayerStore } from '@/store/playerStore';

type KeyDef =
  | { type: 'insert'; label: string; value: string; keyId?: string; op?: boolean }
  | { type: 'backspace'; label: string }
  | { type: 'clear'; label: string };

const ins = (value: string, op = false): KeyDef => ({ type: 'insert', label: value, value, op });

/** Advanced keys carry a `keyId`; they stay locked until unlocked (e.g. bought in the Shop). */
const ROWS: KeyDef[][] = [
  [ins('7'), ins('8'), ins('9'), { type: 'backspace', label: '⌫' }],
  [ins('4'), ins('5'), ins('6'), ins('x', true)],
  [ins('1'), ins('2'), ins('3'), ins('²', true)],
  [ins('0'), ins('+', true), ins('−', true), ins('=', true)],
  [
    { type: 'insert', label: '√', value: '√', keyId: 'sqrt', op: true },
    { type: 'insert', label: '±', value: '±', keyId: 'pm', op: true },
    { type: 'clear', label: 'C' },
  ],
];

export function EquationKeyboard({
  onInsert,
  onBackspace,
  onClear,
  onLockedPress,
}: {
  onInsert: (value: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onLockedPress?: (keyId: string) => void;
}) {
  const theme = useTheme();
  const unlockedKeyIds = usePlayerStore((s) => s.unlockedKeyIds);

  const press = (key: KeyDef) => {
    if (key.type === 'backspace') {
      Haptics.selectionAsync().catch(() => {});
      onBackspace();
      return;
    }
    if (key.type === 'clear') {
      Haptics.selectionAsync().catch(() => {});
      onClear();
      return;
    }
    if (key.keyId && !unlockedKeyIds.includes(key.keyId)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      onLockedPress?.(key.keyId);
      return;
    }
    Haptics.selectionAsync().catch(() => {});
    onInsert(key.value);
  };

  return (
    <View style={styles.pad}>
      {ROWS.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((key, c) => {
            const locked = key.type === 'insert' && !!key.keyId && !unlockedKeyIds.includes(key.keyId);
            const isOp = key.type !== 'insert' || key.op;
            return (
              <Pressable
                key={c}
                onPress={() => press(key)}
                style={({ pressed }) => [
                  styles.key,
                  {
                    backgroundColor: isOp ? theme.backgroundSelected : theme.backgroundElement,
                    borderColor: theme.border,
                    opacity: locked ? 0.45 : pressed ? 0.7 : 1,
                  },
                ]}>
                <ThemedText type="smallBold" style={styles.keyLabel}>
                  {locked ? `🔒${key.label}` : key.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { gap: Spacing.two },
  row: { flexDirection: 'row', gap: Spacing.two },
  key: {
    flex: 1,
    height: 52,
    borderRadius: Spacing.two,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyLabel: { fontSize: 20 },
});
