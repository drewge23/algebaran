import { router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useHydrated } from '@/store/useHydration';

/**
 * Loading screen. Shows the cosmic splash while persisted stores rehydrate, then
 * hands off to the Home tab. A short minimum display time prevents a jarring
 * flash on fast devices.
 */
export default function LoadingScreen() {
  const hydrated = useHydrated();
  const theme = useTheme();
  const { t } = useTranslation();
  const [minElapsed, setMinElapsed] = useState(false);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
    const id = setTimeout(() => setMinElapsed(true), 700);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (hydrated && minElapsed) router.replace('/home');
  }, [hydrated, minElapsed]);

  return (
    <Screen center>
      <View style={styles.content}>
        <ThemedText type="title">{t('common.appName')}</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.tagline}>
          {t('common.tagline')}
        </ThemedText>
        <ActivityIndicator color={theme.primary} size="large" style={styles.spinner} />
        <ThemedText themeColor="textSecondary">{t('common.loading')}</ThemedText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { alignItems: 'center', paddingHorizontal: Spacing.four },
  tagline: { marginTop: Spacing.two, textAlign: 'center' },
  spinner: { marginVertical: Spacing.four },
});
