import { WORK_NAMES } from '@/content/work-names';
import { usePlayerStore } from '@/store/playerStore';
import { buzz } from '@/lib/haptics';

type Key =
  | { t: 'ins'; label: string; value: string; math?: boolean; keyId?: string }
  | { t: 'back' }
  | { t: 'clear' }
  | { t: 'submit' };

const ins = (value: string, math = false, keyId?: string): Key => ({
  t: 'ins',
  label: value,
  value,
  math,
  keyId,
});

/**
 * The names a worked solution is built from. Shown only for steps where the
 * learner writes the left-hand side too — the pad has no letters otherwise, and
 * a worksheet you cannot label is not a worksheet. These are never locked: they
 * are how the answer is written, not a shortcut for writing it.
 */
const NAME_ROW: Key[] = WORK_NAMES.map((name) => ins(name, true));

/**
 * Layout mirrors the design's calculator pad. Keys carrying a `keyId` are
 * *unlockable* — they stay locked until the matching item is bought in Collect,
 * which is the "unlockable keyboard keys" mechanic from the plan.
 */
const ROWS: Key[][] = [
  [
    ins('1'),
    ins('2'),
    ins('3'),
    ins('4'),
    ins('5'),
    ins('6'),
    ins('7'),
    ins('8'),
    ins('9'),
    ins('0'),
  ],
  [
    ins('x', true),
    ins('y', true, 'var-y'),
    ins('+'),
    ins('−'),
    ins('×'),
    ins('÷', false, 'divide'),
    ins('('),
    ins(')'),
    ins('='),
    { t: 'back' },
  ],
  [
    ins('²', true),
    ins('√', true, 'sqrt'),
    ins('π', true),
    ins('±', true, 'pm'),
    ins('<'),
    ins('>'),
    ins(','),
    ins('.'),
    { t: 'clear' },
    { t: 'submit' },
  ],
];

export function EquationKeyboard({
  onInsert,
  onBackspace,
  onClear,
  onSubmit,
  onLockedPress,
  canSubmit = false,
  names = false,
}: {
  onInsert: (value: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onSubmit: () => void;
  onLockedPress?: (keyId: string) => void;
  canSubmit?: boolean;
  /** Offer the a / b / c / D / x₁ / x₂ row, for steps that ask for names. */
  names?: boolean;
}) {
  const unlockedKeyIds = usePlayerStore((s) => s.unlockedKeyIds);
  const isLocked = (k: Key) => k.t === 'ins' && !!k.keyId && !unlockedKeyIds.includes(k.keyId);

  const press = (k: Key) => {
    // A short tap pulse makes the on-screen pad feel physical on phones.
    buzz(8);
    switch (k.t) {
      case 'back':
        return onBackspace();
      case 'clear':
        return onClear();
      case 'submit':
        return canSubmit ? onSubmit() : undefined;
      case 'ins':
        if (isLocked(k)) return onLockedPress?.(k.keyId!);
        return onInsert(k.value);
    }
  };

  return (
    <div className="kb">
      {(names ? [NAME_ROW, ...ROWS] : ROWS).map((row, r) => (
        <div className="kb__row" key={r}>
          {row.map((k, c) => {
            const locked = isLocked(k);
            const classes = ['key'];
            if (k.t === 'ins' && k.math) classes.push('key--math');
            if (k.t === 'back') classes.push('key--accent');
            if (k.t === 'clear') classes.push('key--util');
            if (k.t === 'submit') classes.push('key--submit');
            if (locked) classes.push('key--locked');

            const label =
              k.t === 'ins' ? k.label : k.t === 'back' ? '⌫' : k.t === 'clear' ? 'C' : '✓';

            return (
              <button
                type="button"
                key={c}
                className={classes.join(' ')}
                disabled={k.t === 'submit' && !canSubmit}
                aria-label={k.t === 'ins' ? k.label : k.t}
                onClick={() => press(k)}>
                {locked && (
                  <span className="key__lock" aria-hidden="true">
                    🔒
                  </span>
                )}
                {label}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
