import { SECTION_SEAL, type NodeArtState } from '@/content/art';
import { levelsOfSection } from '@/content/curriculum';
import type { Section } from '@/types/curriculum';
import { statusForLevel, tally, type LessonRecord } from '@/store/progressStore';

/**
 * The sections of one world, as a vertical journey.
 *
 * Plain DOM rather than one big SVG: at this size the map is a column of nodes
 * joined by a hairline, and CSS does that better than a drawing does — the
 * labels stay real text and the touch targets stay honest. Every seal is the
 * same blue; where you are is said by the ring, the check and the dimming.
 */
export function SectionMap({
  sections,
  completed,
  onOpen,
}: {
  sections: Section[];
  completed: Record<string, LessonRecord>;
  onOpen: (section: Section) => void;
}) {
  const nodes = sections.map((section) => {
    const levels = levelsOfSection(section.id);
    const { done, total } = tally(completed, levels);
    const reachable = levels.some((l) => statusForLevel(completed, l) !== 'locked');
    const state: NodeArtState =
      done === total && total > 0 ? 'done' : reachable ? 'open' : 'locked';
    return { section, done, total, state };
  });

  return (
    <div className="sections-map">
      {nodes.map(({ section, done, total, state }, i) => (
        <div className="section-step" key={section.id}>
          {i > 0 && <span className="section-connector" aria-hidden="true" />}

          <button
            type="button"
            className={`section-node section-node--${state}`}
            disabled={state === 'locked'}
            aria-label={`${section.title} — ${done} / ${total}`}
            onClick={() => onOpen(section)}>
            <img src={SECTION_SEAL} alt="" draggable={false} />
            <span className="section-node__glyph" aria-hidden="true">
              {section.glyph}
            </span>
            {state === 'done' && (
              <span className="section-node__check" aria-hidden="true">
                ✓
              </span>
            )}
          </button>

          <span className="section-title">{section.title}</span>
          <span className="section-progress">
            {done} / {total}
          </span>
        </div>
      ))}
    </div>
  );
}
