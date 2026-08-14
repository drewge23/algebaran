import excited from '@/assets/professorson/excited.webp';
import happy from '@/assets/professorson/happy.webp';
import pointing from '@/assets/professorson/pointing.webp';
import proud from '@/assets/professorson/proud.webp';
import sleepy from '@/assets/professorson/sleepy.webp';
import thinking from '@/assets/professorson/thinking.webp';
import wink from '@/assets/professorson/wink.webp';

/** Professorson's moods, picked to match what just happened on screen. */
export type Mood = 'happy' | 'thinking' | 'excited' | 'proud' | 'wink' | 'sleepy' | 'pointing';

const ART: Record<Mood, string> = {
  happy,
  thinking,
  excited,
  proud,
  wink,
  sleepy,
  pointing,
};

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
