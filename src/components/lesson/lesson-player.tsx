import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { EquationKeyboard } from '@/components/lesson/equation-keyboard';
import { EquationText } from '@/components/lesson/equation-text';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { checkAnswer } from '@/lib/answer';
import { usePlayerStore } from '@/store/playerStore';
import { useProgressStore } from '@/store/progressStore';
import type { Lesson, LessonStep } from '@/types/content';

type Result = { stars: number; stardust: number; xp: number; rewarded: boolean };

/**
 * The reusable lesson engine: renders one step at a time — info cards,
 * multiple-choice questions, and typed-equation input (via the on-screen
 * keyboard). Scores mistakes into a 1–3 star rating and awards Stardust/XP once
 * (never on replay of an already-completed lesson).
 */
export function LessonPlayer({ lesson, steps }: { lesson: Lesson; steps: LessonStep[] }) {
  const { t } = useTranslation();
  const theme = useTheme();

  const earnStardust = usePlayerStore((s) => s.earnStardust);
  const addXp = usePlayerStore((s) => s.addXp);
  const registerActivity = usePlayerStore((s) => s.registerActivity);
  const completeLesson = useProgressStore((s) => s.completeLesson);
  const alreadyCompleted = useProgressStore((s) => Boolean(s.completed[lesson.id]));

  const [stepIndex, setStepIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answer, setAnswer] = useState('');
  const [inputCorrect, setInputCorrect] = useState<boolean | null>(null);
  const [lockedHint, setLockedHint] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [result, setResult] = useState<Result | null>(null);

  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;
  const canAdvance = step.kind === 'info' || revealed;

  const reveal = (correct: boolean) => {
    setRevealed(true);
    if (!correct) setMistakes((m) => m + 1);
    Haptics.notificationAsync(
      correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
    ).catch(() => {});
  };

  const choose = (index: number, correctIndex: number) => {
    if (revealed) return;
    setSelected(index);
    reveal(index === correctIndex);
  };

  const check = () => {
    if (revealed || step.kind !== 'input') return;
    const correct = checkAnswer(answer, step.accepted);
    setInputCorrect(correct);
    reveal(correct);
  };

  const advance = () => {
    if (!isLast) {
      setStepIndex((i) => i + 1);
      setSelected(null);
      setAnswer('');
      setInputCorrect(null);
      setLockedHint(false);
      setRevealed(false);
      return;
    }
    const stars = Math.max(1, 3 - mistakes);
    let stardust = 0;
    if (!alreadyCompleted) {
      stardust = earnStardust(lesson.rewardStardust);
      addXp(lesson.rewardXp);
      registerActivity();
    }
    completeLesson(lesson.id, stars);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setResult({ stars, stardust, xp: lesson.rewardXp, rewarded: !alreadyCompleted });
  };

  if (result) {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <ThemedText style={styles.stars}>{'⭐'.repeat(result.stars)}</ThemedText>
          <ThemedText type="subtitle">{t('lesson.completed')}</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.centerText}>
            {result.rewarded
              ? t('lesson.earned', { stardust: result.stardust, xp: result.xp })
              : t('lesson.replay')}
          </ThemedText>
        </View>
        <PrimaryButton label={t('common.continue')} onPress={() => router.back()} />
      </View>
    );
  }

  const showCheck = step.kind === 'input' && !revealed;

  return (
    <View style={styles.container}>
      <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
        <View
          style={[
            styles.fill,
            { width: `${(stepIndex / steps.length) * 100}%`, backgroundColor: theme.primary },
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {step.kind !== 'input' && step.equation ? <EquationText>{step.equation}</EquationText> : null}

        {step.kind === 'info' && (
          <>
            {step.title ? (
              <ThemedText type="subtitle" style={styles.centerText}>
                {step.title}
              </ThemedText>
            ) : null}
            <ThemedText style={styles.centerText}>{step.body}</ThemedText>
          </>
        )}

        {step.kind === 'choice' && (
          <>
            <ThemedText type="subtitle" style={styles.centerText}>
              {step.prompt}
            </ThemedText>
            <View style={styles.options}>
              {step.options.map((option, i) => {
                const isCorrect = i === step.correctIndex;
                const isChosen = i === selected;
                const backgroundColor = !revealed
                  ? theme.backgroundElement
                  : isCorrect
                    ? theme.success
                    : isChosen
                      ? theme.danger
                      : theme.backgroundElement;
                const color = revealed && (isCorrect || isChosen) ? '#FFFFFF' : theme.text;
                return (
                  <Pressable
                    key={`${option}-${i}`}
                    disabled={revealed}
                    onPress={() => choose(i, step.correctIndex)}
                    style={[styles.option, { backgroundColor, borderColor: theme.border }]}>
                    <ThemedText type="smallBold" style={{ color }}>
                      {option}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
            {revealed && step.explanation ? (
              <ThemedText themeColor="textSecondary" style={styles.centerText}>
                {step.explanation}
              </ThemedText>
            ) : null}
          </>
        )}

        {step.kind === 'input' && (
          <>
            {step.problem ? (
              <ThemedText style={styles.centerText}>{step.problem}</ThemedText>
            ) : null}
            <ThemedText type="subtitle" style={styles.centerText}>
              {step.prompt}
            </ThemedText>
            <View
              style={[
                styles.answerBox,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: revealed
                    ? inputCorrect
                      ? theme.success
                      : theme.danger
                    : theme.border,
                },
              ]}>
              {answer ? (
                <EquationText size={24}>{answer}</EquationText>
              ) : (
                <ThemedText themeColor="textSecondary">{t('lesson.typeHere')}</ThemedText>
              )}
            </View>

            {revealed ? (
              <ThemedText themeColor="textSecondary" style={styles.centerText}>
                {inputCorrect ? t('lesson.correct') : t('lesson.correctAnswerIs', { answer: step.accepted[0] })}
                {step.explanation ? `\n${step.explanation}` : ''}
              </ThemedText>
            ) : (
              <>
                {lockedHint ? (
                  <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
                    {t('lesson.keyLocked')}
                  </ThemedText>
                ) : null}
                <EquationKeyboard
                  onInsert={(v) => setAnswer((a) => a + v)}
                  onBackspace={() => setAnswer((a) => a.slice(0, -1))}
                  onClear={() => setAnswer('')}
                  onLockedPress={() => setLockedHint(true)}
                />
              </>
            )}
          </>
        )}
      </ScrollView>

      {showCheck ? (
        <PrimaryButton label={t('lesson.check')} disabled={!answer.trim()} onPress={check} />
      ) : (
        <PrimaryButton
          label={isLast ? t('lesson.finish') : t('common.continue')}
          disabled={!canAdvance}
          onPress={advance}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.four, gap: Spacing.four },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  body: { flexGrow: 1, justifyContent: 'center', gap: Spacing.four, paddingVertical: Spacing.four },
  centerText: { textAlign: 'center' },
  options: { gap: Spacing.two },
  option: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
    borderWidth: 1,
    alignItems: 'center',
  },
  answerBox: {
    minHeight: 56,
    borderRadius: Spacing.three,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three },
  stars: { fontSize: 44 },
});
