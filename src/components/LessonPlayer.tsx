import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Flame, Lightbulb, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import COIN from '@/assets/currency.webp';
import GOOD_JOB_STAR from '@/assets/good_job_star.webp';

import { EquationKeyboard } from '@/components/EquationKeyboard';
import { CountUp } from '@/components/CountUp';
import { GraphTaskView } from '@/components/graph/GraphTaskView';
import { MathText } from '@/components/MathText';
import { checkAnswer, checkRoots, matchWork, type WorkLine } from '@/lib/answer';
import { looksLikeMath } from '@/lib/format';
import { usePlayerStore } from '@/store/playerStore';
import type { LessonStep } from '@/types/content';
import { buzz } from '@/lib/haptics';

type Result = { stars: number; pi: number; rewarded: boolean; streakGained: boolean };

/** Anything the player can work through: a lesson or a project. */
export interface PlayableUnit {
  id: string;
  title: string;
  rewardPi: number;
  rewardXp: number;
}

/**
 * One line of the answer sheet. `labelled` prints the left-hand side (x₁ = ▢);
 * `free` leaves it blank, so naming the step is part of the answer. Every typed
 * step — a single blank, a pair of roots, a whole worksheet — is laid out as a
 * list of these, which is why they all share one keyboard and one Check.
 */
type Line =
  | { kind: 'labelled'; label: string; slot: number }
  | { kind: 'free'; nameSlot: number; slot: number };

function linesFor(step: LessonStep): Line[] {
  switch (step.kind) {
    case 'input':
      return [{ kind: 'labelled', label: '=', slot: 0 }];
    case 'roots':
      return [
        { kind: 'labelled', label: 'x₁ =', slot: 0 },
        { kind: 'labelled', label: 'x₂ =', slot: 1 },
      ];
    case 'fields':
      return step.blanks.map((blank, i) => ({
        kind: 'labelled',
        label: `${blank.label} =`,
        slot: i,
      }));
    case 'canvas': {
      // Two slots per free line (the name and the value), then the closing
      // roots — so slot numbers stay a plain running index into `answers`.
      const lines: Line[] = step.work.map((_, i) => ({
        kind: 'free',
        nameSlot: i * 2,
        slot: i * 2 + 1,
      }));
      const base = step.work.length * 2;
      if (step.roots) {
        lines.push(
          { kind: 'labelled', label: 'x₁ =', slot: base },
          { kind: 'labelled', label: 'x₂ =', slot: base + 1 },
        );
      }
      return lines;
    }
    default:
      return [];
  }
}

/** Every slot a line occupies, in the order the keyboard should walk them. */
const slotsOf = (line: Line): number[] =>
  line.kind === 'free' ? [line.nameSlot, line.slot] : [line.slot];

/**
 * The lesson engine: renders one step at a time — explanation cards, multiple
 * choice, typed answers, worked solutions and graph exercises — all driven by
 * the on-screen keyboard. Mistakes cost stars (3 → 1) and π/XP are awarded
 * once, never on replay of a completed lesson.
 */
export function LessonPlayer({
  unit,
  steps,
  alreadyRewarded,
  onComplete,
  backTo = '/',
  nextTo,
  completedLabel,
}: {
  unit: PlayableUnit;
  steps: LessonStep[];
  /** Already finished before, so π/XP must not be paid again. */
  alreadyRewarded: boolean;
  /** Records the result; the caller decides whether it is a lesson or project. */
  onComplete: (stars: number) => void;
  backTo?: string;
  /**
   * Where "Continue" goes when there is somewhere to continue *to* — the next
   * unfinished level. Without it, Continue and the back link would be the same
   * button twice.
   */
  nextTo?: string;
  /** Headline on the result screen; defaults to the lesson wording. */
  completedLabel?: string;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const earnPi = usePlayerStore((s) => s.earnPi);
  const addXp = usePlayerStore((s) => s.addXp);
  const registerActivity = usePlayerStore((s) => s.registerActivity);

  const [stepIndex, setStepIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [activeField, setActiveField] = useState(0);
  const [wasRight, setWasRight] = useState<boolean | null>(null);
  const [hintShown, setHintShown] = useState(false);
  const [lockedHint, setLockedHint] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  // A graph step decides for itself when a placement is ready to be judged, but
  // the button that judges it lives in the pinned bar with every other step's —
  // so readiness comes up as state and the submit goes down as a ref.
  const [graphReady, setGraphReady] = useState(false);
  const submitGraph = useRef<() => void>(() => {});

  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;
  const lines = linesFor(step);
  const isTyped = lines.length > 0;
  /** Graph steps carry their own Check button, since only they know if a placement is ready. */
  const isGraph = step.kind === 'graph';

  const at = (slot: number) => answers[slot] ?? '';
  const slots = lines.flatMap(slotsOf);
  const filled = slots.every((slot) => at(slot).trim());

  const editField = (fn: (current: string) => string) =>
    setAnswers((prev) => {
      const next = [...prev];
      while (next.length <= activeField) next.push('');
      next[activeField] = fn(next[activeField] ?? '');
      return next;
    });

  /** The tick beside a line closes it off and moves on to the next empty slot. */
  const closeLine = (line: Line) => {
    const after = slots.slice(slots.indexOf(slotsOf(line)[0]) + slotsOf(line).length);
    const nextEmpty = after.find((slot) => !at(slot).trim()) ?? slots.find((s) => !at(s).trim());
    if (nextEmpty !== undefined) setActiveField(nextEmpty);
  };

  const reveal = (correct: boolean) => {
    setRevealed(true);
    setWasRight(correct);
    if (!correct) setMistakes((m) => m + 1);
    buzz(correct ? 12 : [18, 40, 18]);
  };

  const choose = (index: number, correctIndex: number) => {
    if (revealed) return;
    setSelected(index);
    reveal(index === correctIndex);
  };

  /** The learner's worksheet, as `name = value` pairs. */
  const workLines = (count: number): WorkLine[] =>
    Array.from({ length: count }, (_, i) => ({ name: at(i * 2), value: at(i * 2 + 1) }));

  const check = () => {
    if (revealed || !isTyped || !filled) return;
    switch (step.kind) {
      case 'input':
        return reveal(checkAnswer(at(0), step.accepted));
      case 'roots':
        return reveal(checkRoots([at(0), at(1)], step.roots));
      case 'fields':
        return reveal(step.blanks.every((blank, i) => checkAnswer(at(i), blank.accepted)));
      case 'canvas': {
        const base = step.work.length * 2;
        const workDone = matchWork(workLines(step.work.length), step.work).every((m) => m !== -1);
        const rootsDone = !step.roots || checkRoots([at(base), at(base + 1)], step.roots);
        return reveal(workDone && rootsDone);
      }
    }
  };

  const advance = () => {
    if (!isLast) {
      setStepIndex((i) => i + 1);
      setSelected(null);
      setAnswers([]);
      setActiveField(0);
      setWasRight(null);
      setHintShown(false);
      setLockedHint(false);
      setRevealed(false);
      setGraphReady(false);
      return;
    }
    const stars = Math.max(1, 3 - mistakes);
    let pi = 0;
    // XP is still awarded — the whole levelling curve runs on it — it is just
    // not listed on this screen.
    const streakBefore = usePlayerStore.getState().streakCount;
    if (!alreadyRewarded) {
      pi = earnPi(unit.rewardPi);
      addXp(unit.rewardXp);
      registerActivity();
    }
    onComplete(stars);
    setResult({
      stars,
      pi,
      rewarded: !alreadyRewarded,
      // Only a day that was actually added is worth showing as +1.
      streakGained: usePlayerStore.getState().streakCount > streakBefore,
    });
  };

  if (result) {
    const perfect = result.stars === 3;
    return (
      <div className="result-screen">
        <h1 className="result-title">
          {perfect ? t('lesson.resultPerfect') : t('lesson.resultGood')}
        </h1>
        <p className="result-subtitle">
          {completedLabel ?? (perfect ? t('lesson.resultSubPerfect') : t('lesson.resultSub'))}
        </p>

        <img className="result-star" src={GOOD_JOB_STAR} alt="" draggable={false} />

        {result.rewarded ? (
          <div className="reward-list">
            <div className="reward-row">
              <img className="reward-row__coin" src={COIN} alt="" draggable={false} />
              <strong className="reward-row__value">
                <CountUp value={result.pi} prefix="+" /> π
              </strong>
              <span className="reward-row__label">{t('lesson.rewardPi')}</span>
            </div>

            {result.streakGained && (
              <div className="reward-row">
                <span className="reward-row__icon reward-row__icon--streak" aria-hidden="true">
                  <Flame size={18} />
                </span>
                <strong className="reward-row__value">+1</strong>
                <span className="reward-row__label">{t('lesson.rewardStreak')}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="result-subtitle">{t('lesson.replay')}</p>
        )}

        <div className="result-actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => navigate(nextTo ?? backTo)}>
            {t('common.continue')}
          </button>
          {nextTo && (
            <button type="button" className="btn btn--quiet" onClick={() => navigate(backTo)}>
              {t('lesson.backToLevels')}
            </button>
          )}
        </div>
      </div>
    );
  }

  const hint = step.kind === 'graph' ? step.task.hint : 'hint' in step ? step.hint : undefined;
  const explanation =
    step.kind === 'graph' ? step.task.explanation : 'explanation' in step ? step.explanation : '';

  /**
   * Whether a single line came out right, once the step has been marked. Every
   * kind is graded here the same way it is graded in `check`, so a green tick
   * never sits beside an answer the verdict rejected.
   */
  const lineVerdict = (line: Line, index: number): boolean | null => {
    if (!revealed) return null;
    switch (step.kind) {
      case 'fields':
        return checkAnswer(at(line.slot), step.blanks[index].accepted);
      case 'canvas': {
        if (line.kind === 'free') {
          return matchWork(workLines(step.work.length), step.work).includes(index);
        }
        const base = step.work.length * 2;
        return !!step.roots && checkRoots([at(base), at(base + 1)], step.roots);
      }
      // One blank, or a pair of roots graded together: the step's verdict is
      // the line's verdict.
      default:
        return wasRight;
    }
  };

  const fieldClass = (slot: number, verdict: boolean | null, name = false) =>
    [
      'answer-field',
      name && 'answer-field--name',
      verdict === true && 'answer-field--right',
      verdict === false && 'answer-field--wrong',
      verdict === null && slot === activeField && 'answer-field--active',
    ]
      .filter(Boolean)
      .join(' ');

  const renderField = (slot: number, verdict: boolean | null, name = false) => {
    const value = at(slot);
    const isActive = !revealed && slot === activeField;
    return (
      <button
        type="button"
        className={fieldClass(slot, verdict, name)}
        disabled={revealed}
        onClick={() => setActiveField(slot)}>
        {value}
        {isActive && <span className="caret" />}
        {/* An empty box and a caret say "type here" without a sentence that has
            to fit inside the box — the pad is already open below. */}
        {!value && !isActive && (
          <span className="answer-field__placeholder">{name ? '?' : '…'}</span>
        )}
      </button>
    );
  };

  const renderLines = () => (
    <div className="answer-lines">
      {lines.map((line, index) => {
        const verdict = lineVerdict(line, index);
        const ready = slotsOf(line).every((slot) => at(slot).trim());
        return (
          <div className="answer-line" key={index}>
            {line.kind === 'labelled' ? (
              <span className="answer-line__label">{line.label}</span>
            ) : (
              renderField(line.nameSlot, verdict, true)
            )}
            {line.kind === 'free' && <span className="answer-line__eq">=</span>}
            {renderField(line.slot, verdict)}
            {revealed ? (
              <span
                className={`answer-line__tick answer-line__tick--${verdict ? 'right' : 'wrong'}`}
                aria-hidden="true">
                {verdict ? <Check size={20} /> : <X size={20} />}
              </span>
            ) : (
              <button
                type="button"
                className="answer-line__tick"
                aria-label={t('lesson.lineDone')}
                disabled={!ready}
                onClick={() => closeLine(line)}>
                <Check size={20} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="lesson-screen">
      <div className="lesson-header">
        <div className="topbar">
          <button
            type="button"
            className="icon-btn"
            aria-label={t('common.back')}
            onClick={() => navigate(backTo)}>
            ←
          </button>
          <div className="grow" style={{ minWidth: 0 }}>
            <div className="lesson-title">{unit.title}</div>
            <div className="topbar__label">
              {t('lesson.counter', { index: stepIndex + 1, total: steps.length })}
            </div>
          </div>
          {/* Theory sits where the balance used to: inside a lesson the useful
              thing to reach for is the hint, not the wallet. */}
          <button
            type="button"
            className={`icon-btn icon-btn--theory${hintShown ? ' icon-btn--on' : ''}`}
            aria-label={t('lesson.theory')}
            aria-pressed={hintShown}
            disabled={!hint || revealed}
            onClick={() => setHintShown((shown) => !shown)}>
            <Lightbulb size={20} />
          </button>
        </div>

        <div className="steps">
          {steps.map((_, i) => (
            <div
              key={i}
              className={[
                'steps__seg',
                i < stepIndex && 'steps__seg--done',
                i === stepIndex && 'steps__seg--now',
              ]
                .filter(Boolean)
                .join(' ')}
            />
          ))}
        </div>
      </div>

      <div className="lesson-body">
        <div className="lesson-step fade-in" key={stepIndex}>
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
            </>
          )}

          {(step.kind === 'roots' || step.kind === 'fields' || step.kind === 'canvas') && (
            <>
              <h2 className="card__question">{step.prompt}</h2>
              {step.equation && (
                <>
                  <MathText>{step.equation}</MathText>
                  <hr className="card__rule" />
                </>
              )}
            </>
          )}

          {isTyped && renderLines()}

          {step.kind === 'graph' && (
            <GraphTaskView
              task={step.task}
              revealed={revealed}
              onAnswer={reveal}
              onReadyChange={setGraphReady}
              submitRef={submitGraph}
            />
          )}

          {/* Feedback / hints */}
          {revealed && (
            <p className="card__note">
              {isTyped && (wasRight ? `${t('lesson.correct')} ` : `${t('lesson.solutionIs')} `)}
              {/* Graph steps mark the answer on the plane, so words only confirm. */}
              {isGraph && wasRight && `${t('lesson.correct')} `}
              {explanation}
            </p>
          )}
          {revealed && !wasRight && isTyped && <Solution step={step} />}
          {!revealed && hintShown && hint && <p className="card__note">💡 {hint}</p>}
          {!revealed && lockedHint && <p className="card__note">🔒 {t('lesson.keyLocked')}</p>}
        </div>
      </div>

      {/* One button, always in the same place: whatever the step is, the way on
          is at the bottom of the screen rather than at the end of the content. */}
      <div className="lesson-actions">
        {isTyped && !revealed ? (
          <button type="button" className="btn btn--primary" disabled={!filled} onClick={check}>
            {t('lesson.check')}
          </button>
        ) : isGraph && !revealed ? (
          <button
            type="button"
            className="btn btn--primary"
            disabled={!graphReady}
            onClick={() => submitGraph.current()}>
            {t('lesson.check')}
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

      {isTyped && !revealed ? (
        <EquationKeyboard
          canSubmit={filled}
          names={step.kind === 'canvas'}
          onInsert={(v) => editField((a) => a + v)}
          onBackspace={() => editField((a) => a.slice(0, -1))}
          onClear={() => editField(() => '')}
          onSubmit={check}
          onLockedPress={() => setLockedHint(true)}
        />
      ) : (
        <div className="lesson-footer-inset" />
      )}
    </div>
  );
}

/**
 * The worked answer, shown only after a wrong attempt. A multi-line step needs
 * more than "Answer: 2" — what was missed is usually one line of the method.
 */
function Solution({ step }: { step: LessonStep }) {
  const rows: string[] = [];
  if (step.kind === 'input') rows.push(`= ${step.accepted[0]}`);
  else if (step.kind === 'roots') rows.push(`x₁ = ${step.roots[0]}`, `x₂ = ${step.roots[1]}`);
  else if (step.kind === 'fields')
    rows.push(...step.blanks.map((b) => `${b.label} = ${b.accepted[0]}`));
  else if (step.kind === 'canvas') {
    rows.push(...step.work.map((w) => `${w.name[0]} = ${w.accepted[0]}`));
    if (step.roots) rows.push(`x₁ = ${step.roots[0]}`, `x₂ = ${step.roots[1]}`);
  }
  if (!rows.length) return null;
  return (
    <div className="solution">
      {rows.map((row) => (
        <div className="solution__line" key={row}>
          {row}
        </div>
      ))}
    </div>
  );
}
