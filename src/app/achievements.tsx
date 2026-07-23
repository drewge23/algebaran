import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ACHIEVEMENTS, type AchievementStats } from '@/content/achievements';
import { Spacing } from '@/constants/theme';
import { levelForXp } from '@/lib/economy';
import { useTheme } from '@/hooks/use-theme';
import { usePlayerStore } from '@/store/playerStore';
import { selectCompletedCount, useProgressStore } from '@/store/progressStore';

export default function AchievementsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();

  const xp = usePlayerStore((s) => s.xp);
  const stardust = usePlayerStore((s) => s.stardust);
  const streakCount = usePlayerStore((s) => s.streakCount);
  const lessonsCompleted = useProgressStore(selectCompletedCount);

  const stats: AchievementStats = {
    lessonsCompleted,
    streakCount,
    level: levelForXp(xp),
    stardust,
  };

  const unlockedCount = ACHIEVEMENTS.filter((a) => a.isUnlocked(stats)).length;

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: t('achievements.title') }} />
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText themeColor="textSecondary">
          {t('achievements.progress', { unlocked: unlockedCount, total: ACHIEVEMENTS.length })}
        </ThemedText>

        {ACHIEVEMENTS.map((a) => {
          const unlocked = a.isUnlocked(stats);
          return (
            <View
              key={a.id}
              style={[
                styles.card,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                !unlocked && styles.locked,
              ]}>
              <ThemedText style={styles.glyph}>{a.glyph}</ThemedText>
              <View style={styles.flex}>
                <ThemedText type="smallBold">{a.name}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {a.description}
                </ThemedText>
              </View>
              <ThemedText type="small" themeColor={unlocked ? 'success' : 'textSecondary'}>
                {unlocked ? t('achievements.unlocked') : t('achievements.locked')}
              </ThemedText>
            </View>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.four, gap: Spacing.three },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  locked: { opacity: 0.5 },
  glyph: { fontSize: 28 },
  flex: { flex: 1 },
});
