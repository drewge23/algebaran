import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import { LessonPlayer } from '@/components/LessonPlayer';
import { MascotSays } from '@/components/Mascot';
import { PiPill } from '@/components/PiPill';
import { getLevel } from '@/content/curriculum';
import { getProject, PROJECTS, type Project } from '@/content/projects';
import { useProgressStore } from '@/store/progressStore';
import { trackQuest } from '@/store/questStore';

/** A project is unlocked once every prerequisite lesson is complete. */
function missingPrereqs(project: Project, completed: Record<string, unknown>): string[] {
  return project.requires.filter((id) => !completed[id]);
}

export function ProjectList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const completed = useProgressStore((s) => s.completed);
  const projects = useProgressStore((s) => s.projects);

  return (
    <div className="screen screen--scroll">
      <div className="topbar">
        <div className="grow">
          <h1 className="screen__title" style={{ fontSize: 26 }}>
            {t('projects.title')}
          </h1>
        </div>
        <PiPill />
      </div>
      <p className="screen__sub">{t('projects.subtitle')}</p>

      <MascotSays mood="thinking">{t('projects.intro')}</MascotSays>

      <div className="stack stack--3" style={{ marginTop: 8 }}>
        {PROJECTS.map((project) => {
          const missing = missingPrereqs(project, completed);
          const locked = missing.length > 0;
          const done = Boolean(projects[project.id]);

          return (
            <button
              type="button"
              key={project.id}
              className={`project-card${locked ? ' project-card--locked' : ''}`}
              disabled={locked}
              onClick={() => navigate(`/projects/${project.id}`)}>
              <div className="project-card__head">
                <span className="project-card__glyph">{locked ? '🔒' : project.glyph}</span>
                <div className="tile__grow">
                  <div className="project-card__title">{project.title}</div>
                  <div className="tile__desc">{project.blurb}</div>
                </div>
                {done && <span className="badge-done">✓</span>}
              </div>
              <div className="project-card__foot">
                {locked ? (
                  <span className="tiny dim">
                    {t('projects.needs', {
                      list: missing.map((id) => getLevel(id)?.title ?? id).join(', '),
                    })}
                  </span>
                ) : (
                  <span className="tile__meta">
                    +{project.rewardPi} π · +{project.rewardXp} XP
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ProjectRoute() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const project = id ? getProject(id) : undefined;

  const completed = useProgressStore((s) => s.completed);
  const completeProject = useProgressStore((s) => s.completeProject);
  const alreadyDone = useProgressStore((s) => Boolean(s.projects[id ?? '']));
  const [started, setStarted] = useState(false);

  if (!project) {
    return (
      <div className="screen">
        <div className="result">
          <h1 className="result__headline">404</h1>
          <button
            type="button"
            className="btn btn--ghost btn--auto"
            onClick={() => navigate('/projects')}>
            ←
          </button>
        </div>
      </div>
    );
  }

  if (missingPrereqs(project, completed).length > 0) {
    return (
      <div className="screen">
        <div className="result">
          <h1 className="result__headline">🔒</h1>
          <p className="dim center-text">{t('projects.lockedBody')}</p>
          <button type="button" className="btn btn--primary" onClick={() => navigate('/projects')}>
            {t('common.back')}
          </button>
        </div>
      </div>
    );
  }

  if (!started) {
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
          <div className="grow" style={{ fontWeight: 800, fontSize: 17 }}>
            {project.title}
          </div>
          <PiPill />
        </div>

        <MascotSays mood="pointing" small name>
          {t('projects.briefingSays')}
        </MascotSays>

        <div className="card">
          <div className="card__kicker">
            {project.glyph} {t('projects.brief')}
          </div>
          <p className="card__body">{project.brief}</p>
          <hr className="card__rule" />
          <p className="card__note">
            {t('projects.reward', { pi: project.rewardPi, xp: project.rewardXp })}
          </p>
          <div style={{ marginTop: 20 }}>
            <button type="button" className="btn btn--primary" onClick={() => setStarted(true)}>
              {alreadyDone ? t('projects.replay') : t('projects.start')} →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <LessonPlayer
      key={project.id}
      unit={project}
      steps={project.steps}
      alreadyRewarded={alreadyDone}
      backTo="/projects"
      completedLabel={t('projects.completed')}
      onComplete={(stars) => {
        completeProject(project.id, stars);
        if (!alreadyDone) {
          trackQuest('projectSteps', project.steps.length);
          trackQuest('piEarned', project.rewardPi);
        }
      }}
    />
  );
}
