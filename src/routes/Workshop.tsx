import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import { LessonPlayer } from '@/components/LessonPlayer';
import { MascotSays } from '@/components/Mascot';
import { PiPill } from '@/components/PiPill';
import { RocketSvg } from '@/components/RocketSvg';
import {
  ALL_MISSIONS,
  PROJECT,
  getMission,
  getSystem,
  systemOfMission,
  type Mission,
  type RocketSystem,
} from '@/content/rocket';
import { useProgressStore } from '@/store/progressStore';
import { trackQuest } from '@/store/questStore';

type SystemState = 'locked' | 'open' | 'done';

/** Missions are recorded in the project slice, keyed by mission id. */
function useBuild() {
  const projects = useProgressStore((s) => s.projects);

  const missionDone = (id: string) => Boolean(projects[id]);
  const systemProgress = (system: RocketSystem) => {
    const done = system.missions.filter((m) => missionDone(m.id)).length;
    return { done, total: system.missions.length };
  };
  const systemState = (system: RocketSystem): SystemState => {
    const { done, total } = systemProgress(system);
    if (done === total) return 'done';
    const ready = system.requires.every((id) => {
      const req = getSystem(id);
      return req ? req.missions.every((m) => missionDone(m.id)) : true;
    });
    return ready ? 'open' : 'locked';
  };

  const built = new Set(PROJECT.systems.filter((s) => systemState(s) === 'done').map((s) => s.id));

  /** The next mission to offer: first unfinished one in an unlocked system. */
  const currentMission = (): { system: RocketSystem; mission: Mission } | null => {
    for (const system of PROJECT.systems) {
      if (systemState(system) === 'locked') continue;
      const mission = system.missions.find((m) => !missionDone(m.id));
      if (mission) return { system, mission };
    }
    return null;
  };

  const totalDone = ALL_MISSIONS.filter((m) => missionDone(m.id)).length;

  return { missionDone, systemProgress, systemState, built, currentMission, totalDone };
}

/** Projects tab — the workshop floor. */
export function Workshop() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { built, systemProgress, systemState, currentMission, totalDone } = useBuild();
  const current = currentMission();
  const complete = totalDone === ALL_MISSIONS.length;

  return (
    <div className="screen screen--scroll">
      <div className="topbar">
        <div className="grow">
          <div className="topbar__eyebrow">{t('workshop.eyebrow')}</div>
          <div style={{ fontWeight: 800, fontSize: 20 }}>{PROJECT.title}</div>
        </div>
        <PiPill />
      </div>

      <div className="hangar">
        <RocketSvg built={built} />
        <div className="hangar__status">
          {/* Counts systems, not missions: the rocket lights up a part per
              system, so this line must describe the same thing you can see. */}
          {complete
            ? t('workshop.ready')
            : t('workshop.assembled', { done: built.size, total: PROJECT.systems.length })}
        </div>
        <div className="hangar__sub">
          {t('workshop.missions', { done: totalDone, total: ALL_MISSIONS.length })}
        </div>
      </div>

      {current ? (
        <div className="mission-card">
          <div className="mission-card__kicker">
            {current.system.glyph} {current.system.name} · {t('workshop.currentMission')}
          </div>
          <h2 className="mission-card__title">{current.mission.title}</h2>
          <p className="mission-card__story">{current.mission.story}</p>
          <p className="mission-card__objective">🎯 {current.mission.objective}</p>
          <div className="mission-card__reward">
            +{current.mission.rewardPi} π · +{current.mission.rewardXp} XP · {current.mission.part}
          </div>
          <button
            type="button"
            className="btn btn--primary"
            style={{ marginTop: 16 }}
            onClick={() => navigate(`/projects/mission/${current.mission.id}`)}>
            {t('workshop.start')} →
          </button>
        </div>
      ) : (
        <MascotSays mood="proud">{t('workshop.allDone')}</MascotSays>
      )}

      <div className="map-section" style={{ marginTop: 28 }}>
        <span className="map-section__title grow">{t('workshop.systems')}</span>
      </div>

      <div className="system-grid">
        {PROJECT.systems.map((system) => {
          const { done, total } = systemProgress(system);
          const state = systemState(system);
          const pct = Math.round((done / total) * 100);

          return (
            <button
              type="button"
              key={system.id}
              className={`sys-tile sys-tile--${state}`}
              disabled={state === 'locked'}
              onClick={() => navigate(`/projects/system/${system.id}`)}>
              <span className="sys-tile__glyph">{state === 'locked' ? '🔒' : system.glyph}</span>
              <span className="sys-tile__name">{system.name}</span>
              <span className="sys-tile__pct">
                {state === 'locked' ? t('workshop.locked') : `${pct}%`}
              </span>
              <span className="sys-tile__bar">
                <span className="sys-tile__fill" style={{ width: `${pct}%` }} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** One rocket system and its missions. */
export function SystemWorkshop() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { systemId } = useParams<{ systemId: string }>();
  const { missionDone, systemState } = useBuild();
  const system = systemId ? getSystem(systemId) : undefined;

  if (!system) {
    return (
      <div className="screen">
        <div className="result">
          <h1 className="result__headline">404</h1>
          <button type="button" className="btn btn--primary" onClick={() => navigate('/projects')}>
            {t('common.back')}
          </button>
        </div>
      </div>
    );
  }

  const locked = systemState(system) === 'locked';

  return (
    <div className="screen screen--scroll">
      <div className="topbar">
        <button
          type="button"
          className="icon-btn"
          aria-label={t('common.back')}
          onClick={() => navigate('/projects')}>
          ←
        </button>
        <div className="grow">
          <div className="topbar__eyebrow">{PROJECT.title}</div>
          <div style={{ fontWeight: 800, fontSize: 17 }}>
            {system.glyph} {system.name}
          </div>
        </div>
        <PiPill />
      </div>

      <p className="screen__sub" style={{ marginTop: 8 }}>
        {system.blurb}
      </p>

      {locked && (
        <MascotSays mood="thinking" small>
          {t('workshop.lockedBody', {
            list: system.requires.map((id) => getSystem(id)?.name ?? id).join(', '),
          })}
        </MascotSays>
      )}

      <div className="stack stack--3" style={{ marginTop: 20 }}>
        {system.missions.map((mission, i) => {
          const done = missionDone(mission.id);
          return (
            <button
              type="button"
              key={mission.id}
              className={`mission-row${done ? ' mission-row--done' : ''}`}
              disabled={locked}
              onClick={() => navigate(`/projects/mission/${mission.id}`)}>
              <span className="level-row__index">{done ? '✓' : locked ? '🔒' : i + 1}</span>
              <span className="tile__grow">
                <span className="level-row__title">{mission.title}</span>
                <span className="tile__desc">{mission.objective}</span>
              </span>
              <span className="tile__meta">+{mission.rewardPi} π</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** A mission: the project's framing, then the ordinary lesson engine. */
export function MissionRoute() {
  const navigate = useNavigate();
  const { missionId } = useParams<{ missionId: string }>();
  const completeProject = useProgressStore((s) => s.completeProject);
  const alreadyDone = useProgressStore((s) => Boolean(s.projects[missionId ?? '']));

  const mission = missionId ? getMission(missionId) : undefined;
  const system = missionId ? systemOfMission(missionId) : undefined;

  if (!mission || !system) {
    return (
      <div className="screen">
        <div className="result">
          <h1 className="result__headline">404</h1>
          <button type="button" className="btn btn--primary" onClick={() => navigate('/projects')}>
            ←
          </button>
        </div>
      </div>
    );
  }

  return (
    <LessonPlayer
      key={mission.id}
      unit={{
        id: mission.id,
        title: mission.title,
        rewardPi: mission.rewardPi,
        rewardXp: mission.rewardXp,
      }}
      steps={mission.steps}
      alreadyRewarded={alreadyDone}
      backTo={`/projects/system/${system.id}`}
      completedLabel={mission.part}
      onComplete={(stars) => {
        completeProject(mission.id, stars);
        if (!alreadyDone) {
          trackQuest('projectSteps', mission.steps.length);
          trackQuest('piEarned', mission.rewardPi);
        }
      }}
    />
  );
}
