/** Profile pictures are emoji for now — no uploads, no moderation, no storage. */
export const AVATAR_EMOJI = [
  '🧑‍🚀',
  '👩‍🚀',
  '🧑‍🔬',
  '👩‍🔬',
  '🦊',
  '🐼',
  '🐙',
  '🦉',
  '🐝',
  '🦄',
  '🐲',
  '🪐',
  '🚀',
  '⭐',
  '☄️',
  '🌙',
  '🔭',
  '🧠',
  '🎓',
  '🏆',
] as const;

export function EmojiPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (emoji: string) => void;
}) {
  return (
    <div className="emoji-grid" role="radiogroup" aria-label="Profile picture">
      {AVATAR_EMOJI.map((emoji) => (
        <button
          type="button"
          key={emoji}
          role="radio"
          aria-checked={emoji === value}
          aria-label={emoji}
          className={`emoji-opt${emoji === value ? ' emoji-opt--on' : ''}`}
          onClick={() => onChange(emoji)}>
          {emoji}
        </button>
      ))}
    </div>
  );
}
