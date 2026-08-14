import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { EquationKeyboard } from '@/components/EquationKeyboard';
import { MascotSays, type Mood } from '@/components/Mascot';
import { MathText } from '@/components/MathText';
import { PiPill } from '@/components/PiPill';
import { checkAnswer, checkRoots } from '@/lib/answer';
import { looksLikeMath } from '@/lib/format';
import { usePlayerStore } from '@/store/playerStore';
import { useProgressStore } from '@/store/progressStore';
import type { Lesson, LessonStep } from '@/types/content';

type Result = { stars: number; pi: number; xp: number; rewarded: boolean };

/** How many answer boxes a step needs (0 = not a typed step). */
function fieldCount(step: LessonStep): number {
  if (step.kind === 'input') return 1;
  if (step.kind === 'roots') return 2;
  return 0;
}

/**
 * The lesson engine: renders one step at a time — explanation cards, multiple
 * choice, typed answers, and two-root solutions — all driven by the on-screen
 * keyboard. Mistakes cost stars (3 → 1) and π/XP are awarded once, never on
 * replay of a completed lesson.
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
  const [answers, setAnswers] = useState<string[]>(['', '']);
  const [activeField, setActiveField] = useState(0);
  const [wasRight, setWasRight] = useState<boolean | null>(null);
  const [hintShown, setHintShown] = useState(false);
  const [lockedHint, setLockedHint] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [result, setResult] = useState<Result | null>(null);

  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;
  const fields = fieldCount(step);
  const isTyped = fields > 0;
  const filled = answers.slice(0, fields).every((a) => a.trim());

  const editField = (fn: (current: string) => string) =>
    setAnswers((prev) => prev.map((a, i) => (i === activeField ? fn(a) : a)));

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
    if (revealed || !isTyped || !filled) return;
    if (step.kind === 'input') reveal(checkAnswer(answers[0], step.accepted));
    else if (step.kind === 'roots') reveal(checkRoots(answers.slice(0, 2), step.roots));
  };

  const advance = () => {
    if (!isLast) {
      setStepIndex((i) => i + 1);
      setSelected(null);
      setAnswers(['', '']);
      setActiveField(0);
      setWasRight(null);
      setHintShown(false);
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

  const hint = 'hint' in step ? step.hint : undefined;
  const answerFieldClass = (index: number) =>
    [
      'answer-field',
      revealed
        ? wasRight
          ? 'answer-field--right'
          : 'answer-field--wrong'
        : index === activeField
          ? 'answer-field--active'
          : '',
    ]
      .filter(Boolean)
      .join(' ');

  const renderField = (index: number, label: string) => (
    <div className="answer-row" key={index}>
      <span className="answer-row__label">{label}</span>
      <button
        type="button"
        className={answerFieldClass(index)}
        disabled={revealed}
        onClick={() => setActiveField(index)}>
        {answers[index] ? (
          <>
            {answers[index]}
            {!revealed && index === activeField && <span className="caret" />}
          </>
        ) : (
          <span className="answer-field__placeholder">
            {index === activeField && !revealed ? t('lesson.typeHere') : '…'}
          </span>
        )}
      </button>
    </div>
  );

  return (
    <>
      <div className="screen" style={{ paddingBottom: 0 }}>
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

        <div className="steps" style={{ marginTop: 4 }}>
          {steps.map((_, i) => (
            <div key={i} className={`steps__seg${i <= stepIndex ? ' steps__seg--done' : ''}`} />
          ))}
        </div>

        <MascotSays mood={mood} small name>
          {says}
        </MascotSays>

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
            </>
          )}

          {step.kind === 'input' && (
            <>
              {step.problem && <p className="card__body">{step.problem}</p>}
              <h2 className="card__question" style={{ marginTop: 12 }}>
                {step.prompt}
              </h2>
              {renderField(0, '=')}
            </>
          )}

          {step.kind === 'roots' && (
            <>
              <h2 className="card__question">{step.prompt}</h2>
              <MathText>{step.equation}</MathText>
              <hr className="card__rule" />
              {renderField(0, 'x₁ =')}
              {renderField(1, 'x₂ =')}
            </>
          )}

          {/* Feedback / hints */}
          {revealed && (
            <p className="card__note">
              {(step.kind === 'input' || step.kind === 'roots') &&
                (wasRight
                  ? `${t('lesson.correct')} `
                  : `${t('lesson.correctAnswerIs', {
                      answer: step.kind === 'roots' ? step.roots.join(', ') : step.accepted[0],
                    })} `)}
              {'explanation' in step ? step.explanation : ''}
            </p>
          )}
          {!revealed && hintShown && hint && <p className="card__note">💡 {hint}</p>}
          {!revealed && lockedHint && <p className="card__note">🔒 {t('lesson.keyLocked')}</p>}

          <div className="btn--wide-pair" style={{ marginTop: 20 }}>
            {isTyped && !revealed ? (
              <button type="button" className="btn btn--primary" disabled={!filled} onClick={check}>
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
            {hint && !revealed && !hintShown && (
              <button
                type="button"
                className="btn btn--paper btn--auto"
                onClick={() => setHintShown(true)}>
                📖 {t('lesson.theory')}
              </button>
            )}
          </div>
        </div>
      </div>

      {isTyped && !revealed ? (
        <EquationKeyboard
          canSubmit={filled}
          onInsert={(v) => editField((a) => a + v)}
          onBackspace={() => editField((a) => a.slice(0, -1))}
          onClear={() => editField(() => '')}
          onSubmit={check}
          onLockedPress={() => setLockedHint(true)}
        />
      ) : (
        <div style={{ height: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }} />
      )}
    </>
  );
}
