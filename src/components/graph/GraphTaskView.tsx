import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';

import { GraphCanvas, type GraphCurve, type GraphPoint } from '@/components/graph/GraphCanvas';
import { looksLikeMath } from '@/lib/format';
import {
  DEFAULT_TOLERANCE,
  DEFAULT_VIEWPORT,
  functionsMatch,
  roots,
  validatePoint,
  validateRoots,
  validateTrajectory,
  validateVertex,
  vertex,
  type FunctionDef,
  type Pt,
} from '@/lib/graph';
import type { GraphTask } from '@/types/graph-task';

/**
 * Runs one `GraphTask` and reports whether the learner got it right.
 *
 * Everything specific to a task lives in the data; this component only decides
 * which interaction to offer and how to check it. Checking always goes through
 * `lib/graph`, so an answer is judged by where it lands on the plane rather than
 * by how closely it resembles an expected drawing — a vertex tapped at (3.1,
 * −3.9) is right, and one tapped on the correct-looking pixel of the wrong
 * curve is not.
 */
export function GraphTaskView({
  task,
  revealed,
  onAnswer,
  onReadyChange,
  submitRef,
}: {
  task: GraphTask;
  revealed: boolean;
  /** Called once, with the verdict, when the learner submits. */
  onAnswer: (correct: boolean) => void;
  /**
   * Lets a host put the Check somewhere of its own — the lesson screen keeps it
   * pinned to the bottom with every other step's. Supplying `submitRef` hands
   * over the button; `onReadyChange` says when it should be live. Without them
   * the task carries its own, as it does in the arcade.
   */
  onReadyChange?: (ready: boolean) => void;
  submitRef?: RefObject<() => void>;
}) {
  const { t } = useTranslation();
  const view = task.viewport ?? DEFAULT_VIEWPORT;
  const tol = task.tolerance ?? DEFAULT_TOLERANCE;

  const [placed, setPlaced] = useState<Pt[]>([]);
  const [chosen, setChosen] = useState<number | null>(null);
  const [coeffs, setCoeffs] = useState(task.start ?? { a: 1, b: 0, c: 0 });

  const taps = task.kind === 'plot-roots' ? (task.fn ? roots(task.fn).length : 0) : 1;
  const placesPoints =
    task.kind === 'plot-point' || task.kind === 'plot-roots' || task.kind === 'find-vertex';

  const liveFn: FunctionDef = { kind: 'quadratic', ...coeffs };

  const submit = (choiceIndex?: number) => {
    let correct = false;
    switch (task.kind) {
      case 'plot-point':
        correct =
          !!task.expected && placed.length === 1 && validatePoint(placed[0], task.expected, tol);
        break;
      case 'plot-roots':
        correct = !!task.fn && validateRoots(placed, task.fn, tol);
        break;
      case 'find-vertex':
        correct = !!task.fn && placed.length === 1 && validateVertex(placed[0], task.fn, tol);
        break;
      case 'parameters':
        if (task.goal?.kind === 'match-function') correct = functionsMatch(liveFn, task.goal.fn);
        else correct = validateTrajectory(liveFn, task.targets ?? []);
        break;
      case 'identify':
        correct = choiceIndex === task.correctIndex;
        break;
    }
    onAnswer(correct);
  };

  const place = (p: Pt) => {
    if (revealed || !placesPoints) return;
    setPlaced((prev) => {
      // Tapping a point again removes it — the undo people reach for first.
      const hit = prev.findIndex((q) => Math.abs(q.x - p.x) < 0.4 && Math.abs(q.y - p.y) < 0.4);
      if (hit !== -1) return prev.filter((_, i) => i !== hit);
      // Past the quota the oldest tap drops out, so a wrong first guess is not a dead end.
      return prev.length >= taps ? [...prev.slice(1), p] : [...prev, p];
    });
  };

  const choose = (i: number) => {
    if (revealed) return;
    setChosen(i);
    submit(i);
  };

  // --- what to draw ---------------------------------------------------------
  const curves: GraphCurve[] = [];
  if (task.kind === 'parameters') {
    if (revealed && task.goal?.kind === 'match-function') {
      curves.push({ fn: task.goal.fn, role: 'target' });
    }
    curves.push({ fn: liveFn, role: 'main' });
  } else if (task.fn) {
    curves.push({ fn: task.fn, role: 'main' });
  }
  for (const extra of task.extraFns ?? [])
    curves.push({ fn: extra.fn, role: extra.role ?? 'ghost' });

  const isRight = (p: Pt): boolean => {
    if (task.kind === 'plot-point' && task.expected) return validatePoint(p, task.expected, tol);
    if (task.kind === 'find-vertex' && task.fn) return validateVertex(p, task.fn, tol);
    // Roots sit *on* the axis, so a tap above the right x is not a right answer —
    // this has to agree with validateRoots or the marking contradicts the colours.
    if (task.kind === 'plot-roots' && task.fn) {
      return Math.abs(p.y) <= tol && roots(task.fn).some((r) => Math.abs(p.x - r) <= tol);
    }
    return false;
  };

  /** Where the answer actually is, so a reveal can show what was missed. */
  const answers: { p: Pt; label: string }[] = [];
  if (task.kind === 'plot-point' && task.expected) {
    answers.push({ p: task.expected, label: `(${num(task.expected.x)}, ${num(task.expected.y)})` });
  } else if (task.kind === 'find-vertex' && task.fn) {
    const v = vertex(task.fn);
    if (v) answers.push({ p: v, label: `(${num(v.x)}, ${num(v.y)})` });
  } else if (task.kind === 'plot-roots' && task.fn) {
    for (const r of roots(task.fn)) answers.push({ p: { x: r, y: 0 }, label: num(r) });
  }

  const points: GraphPoint[] = [
    ...(task.given ?? []).map((p) => ({ ...p, role: 'given' as const })),
    ...(task.targets ?? []).map((p) => ({ ...p, role: 'target' as const })),
    ...placed.map((p) => ({
      ...p,
      role: revealed ? (isRight(p) ? ('correct' as const) : ('wrong' as const)) : ('user' as const),
      // Naming the point the learner found is the confirmation; the answer
      // markers below are only for the ones they did not.
      label: revealed ? answers.find((a) => validatePoint(p, a.p, tol))?.label : undefined,
    })),
  ];

  // A wrong tap next to the right place teaches nothing unless the right place
  // is visible — so on a reveal, fill in whatever the learner did not find.
  if (revealed) {
    for (const answer of answers) {
      if (placed.some((p) => validatePoint(p, answer.p, tol))) continue;
      points.push({ ...answer.p, role: 'correct', label: answer.label });
    }
  }

  const ready = task.kind === 'parameters' ? true : placed.length === taps;
  const hoisted = !!submitRef;

  // `submit` closes over this render's placement, so the host's button has to be
  // handed the current one each time rather than a stale copy.
  useEffect(() => {
    if (submitRef) submitRef.current = () => submit();
  });

  useEffect(() => {
    onReadyChange?.(ready);
  }, [ready, onReadyChange]);

  return (
    <div className="graph-task">
      <p className="card__question">{task.prompt}</p>

      <GraphCanvas
        viewport={view}
        curves={curves}
        points={points}
        interactive={!revealed && placesPoints}
        snapStep={task.snapStep ?? 1}
        onPlace={place}
        ariaLabel={task.prompt}
      />

      {task.kind === 'parameters' && (
        <div className="coeff-controls">
          {(['a', 'b', 'c'] as const).map((key) => (
            <label className="coeff" key={key}>
              <span className="coeff__name">{key}</span>
              <input
                type="range"
                min={key === 'a' ? -3 : -8}
                max={key === 'a' ? 3 : 8}
                step={key === 'a' ? 0.5 : 1}
                value={coeffs[key]}
                disabled={revealed}
                onChange={(e) => setCoeffs({ ...coeffs, [key]: Number(e.target.value) })}
              />
              <span className="coeff__value">{signed(coeffs[key])}</span>
            </label>
          ))}
        </div>
      )}

      {task.kind === 'identify' && (
        <div className="choices" style={{ marginTop: 16 }}>
          {(task.options ?? []).map((option, i) => {
            const classes = ['choice'];
            if (revealed && i === task.correctIndex) classes.push('choice--right');
            else if (revealed && i === chosen) classes.push('choice--wrong');
            return (
              <button
                type="button"
                key={`${option}-${i}`}
                className={classes.join(' ')}
                disabled={revealed}
                onClick={() => choose(i)}>
                <span className={looksLikeMath(option) ? 'choice__math' : undefined}>{option}</span>
              </button>
            );
          })}
        </div>
      )}

      {!revealed && (placesPoints || task.kind === 'parameters') && (
        <p className="card__note">
          {placesPoints ? t('graph.tapHint', { count: taps }) : t('graph.sliderHint')}
        </p>
      )}

      {!revealed && task.kind !== 'identify' && (placesPoints || !hoisted) && (
        <div className="graph-task__actions">
          {placesPoints && (
            <button
              type="button"
              className="btn btn--paper btn--auto"
              disabled={placed.length === 0}
              onClick={() => setPlaced([])}>
              {t('graph.clear')}
            </button>
          )}
          {!hoisted && (
            <button
              type="button"
              className="btn btn--primary"
              disabled={!ready}
              onClick={() => submit()}>
              {t('lesson.check')} →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Displays negatives with the true minus sign, as the rest of the app does. */
const signed = (n: number) => (n < 0 ? `−${Math.abs(n)}` : `${n}`);

/** Caption form of a derived value: short, and written like the equations are. */
const num = (n: number) => signed(Number(n.toFixed(2)));
