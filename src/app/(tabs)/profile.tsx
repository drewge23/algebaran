import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { getShopItem } from '@/content/shop';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { levelForXp, levelProgress } from '@/lib/economy';
import { SUPPORTED_LANGUAGES, setLanguage, type AppLanguage } from '@/i18n';
import { DEFAULT_AVATAR_ID, selectMultiplier, usePlayerStore } from '@/store/playerStore';
import { selectCompletedCount, useProgressStore } from '@/store/progressStore';

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();

  const xp = usePlayerStore((s) => s.xp);
  const stardust = usePlayerStore((s) => s.stardust);
  const streak = usePlayerStore((s) => s.streakCount);
  const equippedAvatarId = usePlayerStore((s) => s.equippedAvatarId);
  const multiplier = usePlayerStore(selectMultiplier);
  const lessonsCompleted = useProgressStore(selectCompletedCount);

  const level = levelForXp(xp);
  const progress = levelProgress(xp);
  const avatarGlyph =
    equippedAvatarId === DEFAULT_AVATAR_ID ? '🌟' : (getShopItem(equippedAvatarId)?.glyph ?? '🌟');

  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarWrap}>
          <View style={[styles.avatar, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText style={styles.avatarGlyph}>{avatarGlyph}</ThemedText>
          </View>
          <ThemedText type="subtitle">{t('profile.level', { level })}</ThemedText>

          <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
            <View
              style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: theme.primary }]}
            />
          </View>
        </View>

        <View style={styles.rows}>
          <Row label={t('profile.stardust')} value={`${stardust} ✨`} />
          <Row label={t('profile.multiplier', { value: multiplier })} value="" />
          <Row
            label={streak > 0 ? t('profile.streak', { count: streak }) : t('profile.streakNone')}
            value={streak > 0 ? '🔥' : ''}
          />
          <Row label={t('profile.lessonsDone', { count: lessonsCompleted })} value="" />
        </View>

        <PrimaryButton
          label={t('profile.viewAchievements')}
          onPress={() => router.push('/achievements')}
        />

        <View style={styles.langRow}>
          <ThemedText type="small" themeColor="textSecondary">
            {t('profile.language')}
          </ThemedText>
          <View style={styles.langButtons}>
            {SUPPORTED_LANGUAGES.map((lang) => {
              const active = i18n.language === lang;
              return (
                <Pressable
                  key={lang}
                  onPress={() => setLanguage(lang as AppLanguage)}
                  style={[
                    styles.langChip,
                    { borderColor: theme.border },
                    active && { backgroundColor: theme.primary, borderColor: theme.primary },
                  ]}>
                  <ThemedText type="smallBold" style={active ? { color: '#fff' } : undefined}>
                    {lang.toUpperCase()}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.row, { borderColor: theme.border }]}>
      <ThemedText type="small">{label}</ThemedText>
      <ThemedText type="smallBold">{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.four, gap: Spacing.four, paddingBottom: Spacing.six },
  avatarWrap: { alignItems: 'center', gap: Spacing.three, marginTop: Spacing.four },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGlyph: { fontSize: 48 },
  track: { width: '80%', height: 10, borderRadius: 5, overflow: 'hidden' },
  fill: { height: 10, borderRadius: 5 },
  rows: { gap: Spacing.two },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  langRow: { gap: Spacing.two },
  langButtons: { flexDirection: 'row', gap: Spacing.two },
  langChip: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.five,
    borderWidth: 1,
  },
});
