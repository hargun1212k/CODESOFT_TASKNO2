import { useStore } from '../store.jsx';
import { Avatar, HealthPill, Icon, Progress, memberOf } from '../components/ui.jsx';
import { projectStats, fmtDate, diffDays, todayIso } from '../data.js';

export default function Projects({ go, newProject }) {
  const { state } = useStore();
  const now = todayIso();

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <span className="eyebrow red">Portfolio</span>
          <h1>Projects</h1>
        </div>
        <button className="btn" onClick={newProject}><Icon name="plus" size={15} /> New project</button>
      </header>

      <div className="project-grid">
        {state.projects.map((p) => {
          const s = projectStats(p, state.tasks);
          const left = diffDays(now, p.due);
          return (
            <button key={p.id} className="project-card" onClick={() => go({ name: 'project', id: p.id })}>
              <div className="pc-top">
                <span className="eyebrow">{p.client}</span>
                <HealthPill health={s.health} />
              </div>
              <h3>{p.name}</h3>
              <p className="muted">{p.about}</p>
              <div className="pc-progress">
                <Progress value={s.progress} label={`${p.name} progress`} />
                <span className="tnum">{Math.round(s.progress * 100)}%</span>
              </div>
              <dl className="pc-stats">
                <div><dt>Open</dt><dd className="tnum">{s.open}</dd></div>
                <div><dt>Overdue</dt><dd className={`tnum ${s.overdue ? 'late' : ''}`}>{s.overdue}</dd></div>
                <div><dt>{left < 0 ? 'Was due' : 'Due'}</dt><dd className="tnum">{fmtDate(p.due)}</dd></div>
              </dl>
              <div className="pc-foot">
                <Avatar id={p.owner} size={24} />
                <span className="small">{memberOf(p.owner)?.name}</span>
                <span className="grow" />
                <span className="small muted tnum">{left < 0 ? `${-left}d past due` : `${left}d left`}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
