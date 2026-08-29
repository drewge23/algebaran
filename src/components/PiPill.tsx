import coin from '@/assets/currency.webp';

import { usePlayerStore } from '@/store/playerStore';

/**
 * The π balance chip shown in the top bar.
 *
 * `compact` drops the add button for a quieter version — used where the balance
 * is present for reference rather than as a control, and must not compete with
 * whatever the screen is actually about.
 */
export function PiPill({
  showAdd = true,
  compact = false,
}: {
  showAdd?: boolean;
  compact?: boolean;
}) {
  const pi = usePlayerStore((s) => s.pi);
  return (
    <div className={`pi-pill${compact ? ' pi-pill--compact' : ''}`}>
      <img className="pi-coin" src={coin} alt="" draggable={false} />
      <span className="pi-pill__value">{pi.toLocaleString()}</span>
      {showAdd && !compact && (
        <span className="pi-pill__add" aria-hidden="true">
          +
        </span>
      )}
    </div>
  );
}
