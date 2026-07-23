import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { StatPill } from '@/components/stat-pill';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { SECTIONS, lessonsForSection } from '@/content/lessons';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { usePlayerStore } from '@/store/playerStore';
import { statusForLesson, useProgressStore, type LessonStatus } from '@/store/progressStore';
import type { Lesson } from '@/types/content';

export default function HomeScreen() {
  const { t } = useTranslation();
  const stardust = usePlayerStore((s) => s.stardust);
  const streak = usePlayerStore((s) => s.streakCount);
  const completed = useProgressStore((s) => s.completed);

  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <ThemedText type="subtitle">{t('home.mapTitle')}</ThemedText>
            <ThemedText themeColor="textSecondary">{t('home.greeting')}</ThemedText>
          </View>
        </View>

        <View style={styles.pills}>
          <StatPill icon="stardust" value={stardust} />
          <StatPill icon="streak" value={streak} />
        </View>

        {SECTIONS.map((section) => (
          <View key={section.id} style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionGlyph}>{section.glyph}</ThemedText>
              <View style={styles.flex}>
                <ThemedText type="smallBold">{section.title}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {section.blurb}
                </ThemedText>
              </View>
            </View>

            {lessonsForSection(section.id).map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                status={statusForLesson(completed, lesson)}
                onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: lesson.id } })}
              />
            ))}
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

function LessonCard({
  lesson,
  status,
  onPress,
}: {
  lesson: Lesson;
  status: LessonStatus;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const locked = status === 'locked';

  const badge =
    status === 'completed'
      ? { icon: 'check' as const, label: t('home.review') }
      : status === 'available'
        ? { icon: 'rocket' as const, label: t('home.start') }
        : { icon: 'lock' as const, label: t('home.locked') };

  return (
    <Pressable
      disabled={locked}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        locked && styles.cardLocked,
        pressed && !locked && styles.cardPressed,
      ]}>
      <View style={styles.flex}>
        <ThemedText type="smallBold">{lesson.title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {t('lesson.reward')}: {lesson.rewardStardust} ✨ · {lesson.rewardXp} XP
        </ThemedText>
      </View>
      <View style={styles.badge}>
        <Icon name={badge.icon} size={16} />
        <ThemedText type="small" themeColor="textSecondary">
          {badge.label}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.four, gap: Spacing.four, paddingBottom: Spacing.six },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pills: { flexDirection: 'row', gap: Spacing.two },
  section: { gap: Spacing.two },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  sectionGlyph: { fontSize: 24 },
  flex: { flex: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  cardLocked: { opacity: 0.5 },
  cardPressed: { opacity: 0.85 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
});
