import { usePlayerStore } from '@/store/playerStore';

/** The π balance chip shown in the top bar, with the gold coin from the design. */
export function PiPill({ showAdd = true }: { showAdd?: boolean }) {
  const pi = usePlayerStore((s) => s.pi);
  return (
    <div className="pi-pill">
      <span className="pi-coin" aria-hidden="true">
        π
      </span>
      <span className="pi-pill__value">{pi.toLocaleString()}</span>
      {showAdd && (
        <span className="pi-pill__add" aria-hidden="true">
          +
        </span>
      )}
    </div>
  );
}
