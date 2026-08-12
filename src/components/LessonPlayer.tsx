import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { EquationKeyboard } from '@/components/EquationKeyboard';
import { MascotSays, type Mood } from '@/components/Mascot';
import { MathText } from '@/components/MathText';
import { PiPill } from '@/components/PiPill';
import { checkAnswer } from '@/lib/answer';
import { looksLikeMath } from '@/lib/format';
import { usePlayerStore } from '@/store/playerStore';
import { useProgressStore } from '@/store/progressStore';
import type { Lesson, LessonStep } from '@/types/content';

type Result = { stars: number; pi: number; xp: number; rewarded: boolean };

/**
 * The lesson engine: renders one step at a time — info cards, multiple choice,
 * and typed answers via the on-screen keyboard. Mistakes cost stars (3 → 1) and
 * π/XP are awarded once, never on replay of a completed lesson.
 */
export function LessonPlayer({ lesson, steps }: { lesson: Lesson; steps: LessonStep[] }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const earnPi = usePlayerStore((s) => s.earnPi);
  const addXp = usePlayerStore((s) => s.addXp);
  const registerActivity = usePlayerStore((s) => s.registerActivity);
  const completeLesson = useProgressStore((s) => s.completeLesson);
  const alreadyCompleted = useProgressStore((s) => Boolean(s.completed[lesson.id]));

  const [stepIndex, setStepIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answer, setAnswer] = useState('');
  const [wasRight, setWasRight] = useState<boolean | null>(null);
  const [lockedHint, setLockedHint] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [result, setResult] = useState<Result | null>(null);

  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  const reveal = (correct: boolean) => {
    setRevealed(true);
    setWasRight(correct);
    if (!correct) setMistakes((m) => m + 1);
    navigator.vibrate?.(correct ? 12 : [18, 40, 18]);
  };

  const choose = (index: number, correctIndex: number) => {
    if (revealed) return;
    setSelected(index);
    reveal(index === correctIndex);
  };

  const check = () => {
    if (revealed || step.kind !== 'input') return;
    reveal(checkAnswer(answer, step.accepted));
  };

  const advance = () => {
    if (!isLast) {
      setStepIndex((i) => i + 1);
      setSelected(null);
      setAnswer('');
      setWasRight(null);
      setLockedHint(false);
      setRevealed(false);
      return;
    }
    const stars = Math.max(1, 3 - mistakes);
    let pi = 0;
    if (!alreadyCompleted) {
      pi = earnPi(lesson.rewardPi);
      addXp(lesson.rewardXp);
      registerActivity();
    }
    completeLesson(lesson.id, stars);
    setResult({ stars, pi, xp: lesson.rewardXp, rewarded: !alreadyCompleted });
  };

  if (result) {
    return (
      <div className="screen">
        <div className="result pop">
          <div className="result__stars">{'⭐'.repeat(result.stars)}</div>
          <h1 className="result__headline">{t('lesson.completed')}</h1>
          {result.rewarded ? (
            <div className="result__reward">
              {t('lesson.earned', { pi: result.pi, xp: result.xp })}
            </div>
          ) : (
            <div className="dim">{t('lesson.replay')}</div>
          )}
          <MascotSays mood="proud">{t('lesson.encourageRight')}</MascotSays>
        </div>
        <div style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}>
          <button type="button" className="btn btn--primary" onClick={() => navigate('/')}>
            {t('common.continue')}
          </button>
        </div>
      </div>
    );
  }

  const mood: Mood = revealed ? (wasRight ? 'excited' : 'thinking') : 'pointing';
  const says = revealed
    ? wasRight
      ? t('lesson.encourageRight')
      : t('lesson.encourageWrong')
    : t('lesson.encourageStart');

  return (
    <>
      <div className="screen" style={{ paddingBottom: 0 }}>
        {/* Header */}
        <div className="topbar">
          <button
            type="button"
            className="icon-btn"
            aria-label={t('common.back')}
            onClick={() => navigate('/')}>
            ←
          </button>
          <div className="grow" style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 17 }}>{lesson.title}</div>
            <div className="topbar__label">
              {t('lesson.counter', { index: stepIndex + 1, total: steps.length })}
            </div>
          </div>
          <PiPill />
        </div>

        {/* Segmented progress */}
        <div className="steps" style={{ marginTop: 4 }}>
          {steps.map((_, i) => (
            <div key={i} className={`steps__seg${i <= stepIndex ? ' steps__seg--done' : ''}`} />
          ))}
        </div>

        <MascotSays mood={mood} small name>
          {says}
        </MascotSays>

        {/* Paper card */}
        <div className="card fade-in" key={stepIndex}>
          <div className="card__kicker">
            {step.kind === 'info' ? `📖 ${t('lesson.learn')}` : `💡 ${t('lesson.solve')}`}
          </div>

          {step.kind === 'info' && (
            <>
              {step.title && <h2 className="card__question">{step.title}</h2>}
              {step.equation && <MathText>{step.equation}</MathText>}
              <p className="card__body">{step.body}</p>
            </>
          )}

          {step.kind === 'choice' && (
            <>
              <h2 className="card__question">{step.prompt}</h2>
              {step.equation && (
                <>
                  <MathText>{step.equation}</MathText>
                  <hr className="card__rule" />
                </>
              )}
              <div className="choices">
                {step.options.map((option, i) => {
                  const classes = ['choice'];
                  if (revealed && i === step.correctIndex) classes.push('choice--right');
                  else if (revealed && i === selected) classes.push('choice--wrong');
                  return (
                    <button
                      type="button"
                      key={`${option}-${i}`}
                      className={classes.join(' ')}
                      disabled={revealed}
                      onClick={() => choose(i, step.correctIndex)}>
                      <span className={looksLikeMath(option) ? 'choice__math' : undefined}>
                        {option}
                      </span>
                    </button>
                  );
                })}
              </div>
              {revealed && step.explanation && <p className="card__note">{step.explanation}</p>}
            </>
          )}

          {step.kind === 'input' && (
            <>
              {step.problem && <p className="card__body">{step.problem}</p>}
              <h2 className="card__question" style={{ marginTop: 12 }}>
                {step.prompt}
              </h2>
              <div className="answer-row">
                <span className="answer-row__label">=</span>
                <div
                  className={[
                    'answer-field',
                    revealed
                      ? wasRight
                        ? 'answer-field--right'
                        : 'answer-field--wrong'
                      : 'answer-field--active',
                  ].join(' ')}>
                  {answer ? (
                    <>
                      {answer}
                      {!revealed && <span className="caret" />}
                    </>
                  ) : (
                    <span className="answer-field__placeholder">{t('lesson.typeHere')}</span>
                  )}
                </div>
              </div>
              {revealed && (
                <p className="card__note">
                  {wasRight
                    ? t('lesson.correct')
                    : t('lesson.correctAnswerIs', { answer: step.accepted[0] })}
                  {step.explanation ? ` ${step.explanation}` : ''}
                </p>
              )}
              {!revealed && lockedHint && <p className="card__note">🔒 {t('lesson.keyLocked')}</p>}
            </>
          )}

          {/* Card actions */}
          <div className="btn--wide-pair" style={{ marginTop: 20 }}>
            {step.kind === 'input' && !revealed ? (
              <button
                type="button"
                className="btn btn--primary"
                disabled={!answer.trim()}
                onClick={check}>
                {t('lesson.check')} →
              </button>
            ) : (
              <button
                type="button"
                className="btn btn--primary"
                disabled={step.kind !== 'info' && !revealed}
                onClick={advance}>
                {isLast ? t('lesson.finish') : t('common.continue')} →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Keyboard docks to the bottom for typed steps */}
      {step.kind === 'input' && !revealed ? (
        <EquationKeyboard
          canSubmit={!!answer.trim()}
          onInsert={(v) => setAnswer((a) => a + v)}
          onBackspace={() => setAnswer((a) => a.slice(0, -1))}
          onClear={() => setAnswer('')}
          onSubmit={check}
          onLockedPress={() => setLockedHint(true)}
        />
      ) : (
        <div style={{ height: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }} />
      )}
    </>
  );
}
