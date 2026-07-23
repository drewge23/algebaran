import * as Haptics from 'expo-haptics';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { LessonPlayer } from '@/components/lesson/lesson-player';
import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { stepsForLesson } from '@/content/lesson-steps';
import { getLesson } from '@/content/lessons';
import { Spacing } from '@/constants/theme';
import { usePlayerStore } from '@/store/playerStore';
import { useProgressStore } from '@/store/progressStore';
import type { Lesson } from '@/types/content';

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lesson = getLesson(id);
  const steps = lesson ? stepsForLesson(lesson.id) : undefined;

  if (!lesson) {
    return (
      <Screen center>
        <ThemedText type="subtitle">404</ThemedText>
      </Screen>
    );
  }

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: lesson.title }} />
      {steps ? <LessonPlayer lesson={lesson} steps={steps} /> : <PlaceholderLesson lesson={lesson} />}
    </Screen>
  );
}

/** Fallback for lessons whose interactive content hasn't been authored yet. */
function PlaceholderLesson({ lesson }: { lesson: Lesson }) {
  const { t } = useTranslation();
  const earnStardust = usePlayerStore((s) => s.earnStardust);
  const addXp = usePlayerStore((s) => s.addXp);
  const registerActivity = usePlayerStore((s) => s.registerActivity);
  const completeLesson = useProgressStore((s) => s.completeLesson);
  const alreadyCompleted = useProgressStore((s) => Boolean(s.completed[lesson.id]));

  const [result, setResult] = useState<{ stardust: number; xp: number; rewarded: boolean } | null>(
    null,
  );

  const onComplete = () => {
    let stardust = 0;
    if (!alreadyCompleted) {
      stardust = earnStardust(lesson.rewardStardust);
      addXp(lesson.rewardXp);
      registerActivity();
    }
    completeLesson(lesson.id, 3);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setResult({ stardust, xp: lesson.rewardXp, rewarded: !alreadyCompleted });
  };

  return (
    <>
      <View style={styles.body}>
        <ThemedText type="title" style={styles.title}>
          {lesson.title}
        </ThemedText>

        {result ? (
          <View style={styles.resultBox}>
            <ThemedText type="subtitle">{t('lesson.completed')}</ThemedText>
            <ThemedText themeColor="textSecondary">
              {result.rewarded
                ? t('lesson.earned', { stardust: result.stardust, xp: result.xp })
                : t('lesson.replay')}
            </ThemedText>
          </View>
        ) : (
          <ThemedText themeColor="textSecondary" style={styles.blurb}>
            {t('lesson.comingSoon')}
          </ThemedText>
        )}
      </View>

      <View style={styles.actions}>
        {result ? (
          <PrimaryButton label={t('common.continue')} onPress={() => router.back()} />
        ) : (
          <>
            <PrimaryButton
              label={t('lesson.needHint')}
              variant="secondary"
              onPress={() => router.push({ pathname: '/hints', params: { lessonId: lesson.id } })}
            />
            <PrimaryButton label={t('lesson.completeDemo')} onPress={onComplete} />
          </>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.four, gap: Spacing.four },
  title: { textAlign: 'center' },
  blurb: { textAlign: 'center' },
  resultBox: { alignItems: 'center', gap: Spacing.two },
  actions: { padding: Spacing.four, gap: Spacing.two },
});
