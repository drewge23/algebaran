import content from '@/assets/professorson/content.webp';
import full from '@/assets/professorson/full.webp';
import glad from '@/assets/professorson/glad.webp';
import inspired from '@/assets/professorson/inspired.webp';
import inspired2 from '@/assets/professorson/inspired_2.webp';
import meditating from '@/assets/professorson/meditating.webp';
import surprised from '@/assets/professorson/surprised.webp';

/** Professorson's moods, picked to match what just happened on screen. */
export type Mood = 'happy' | 'thinking' | 'excited' | 'proud' | 'wink' | 'sleepy' | 'pointing';

/**
 * Mood → art. The drawings are named for the expression, the moods for the
 * moment they belong to, so the mapping lives here rather than in the filenames.
 * `wink` and `pointing` share the glasses-adjust pose — they never appear on the
 * same screen, and a knowing look reads correctly for both.
 */
const ART: Record<Mood, string> = {
  happy: content,
  proud: glad,
  excited: surprised,
  thinking: inspired,
  wink: inspired2,
  pointing: inspired2,
  sleepy: meditating,
};

/** The full-body drawing, for the places that have room for a hero. */
export const PROFESSORSON_FULL = full;

/** A head shot, for circular chips too small to read a whole figure. */
export const PROFESSORSON_AVATAR = content;

export function Mascot({ mood = 'happy', small = false }: { mood?: Mood; small?: boolean }) {
  return (
    <img
      className={small ? 'mascot mascot--sm' : 'mascot'}
      src={ART[mood]}
      alt="Professorson"
      draggable={false}
    />
  );
}

/**
 * Professorson with a speech bubble — the app's voice for encouragement and
 * hints. `name` shows his label tag (used on the lesson screen).
 */
export function MascotSays({
  children,
  mood = 'happy',
  small = false,
  name = false,
}: {
  children: React.ReactNode;
  mood?: Mood;
  small?: boolean;
  name?: boolean;
}) {
  return (
    <div className="mascot-row">
      <div className="speech fade-in">{children}</div>
      <div className="stack" style={{ alignItems: 'center' }}>
        <Mascot mood={mood} small={small} />
        {name && <span className="mascot-name">Professorson</span>}
      </div>
    </div>
  );
}
