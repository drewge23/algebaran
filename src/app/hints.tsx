import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { Spacing } from '@/constants/theme';

// The `lessonId` route param is available here (passed from the lesson screen)
// and will select lesson-specific hints once lesson content is authored.
export default function HintsScreen() {
  const { t } = useTranslation();
  return (
    <Screen center edges={['bottom']}>
      <Stack.Screen options={{ title: t('hints.title') }} />
      <View style={styles.body}>
        <Icon name="hint" size={48} />
        <ThemedText type="subtitle">{t('hints.title')}</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.text}>
          {t('hints.placeholder')}
        </ThemedText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { alignItems: 'center', gap: Spacing.three, paddingHorizontal: Spacing.four },
  text: { textAlign: 'center' },
});
