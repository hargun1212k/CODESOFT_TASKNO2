import { useMemo } from 'react';
import { useStore } from '../store.jsx';
import { WeeklyBars, WorkloadBars } from '../components/Charts.jsx';
import { Avatar, HealthPill, Progress } from '../components/ui.jsx';
import {
  MEMBERS, projectStats, weeklyCompletions, workload, isOverdue, dueLabel, diffDays, todayIso, fmtDate, timeAgo,
} from '../data.js';

export default function Overview({ go, openTask }) {
  const { state } = useStore();
  const { tasks, projects } = state;
  const now = todayIso();

  const k = useMemo(() => {
    const open = tasks.filter((t) => t.status !== 'done');
    return {
      active: projects.filter((p) => p.status === 'active').length,
      open: open.length,
      week: open.filter((t) => !isOverdue(t) && diffDays(now, t.due) <= 7).length,
      overdue: open.filter((t) => isOverdue(t)).length,
      rate: tasks.length ? Math.round((tasks.filter((t) => t.status === 'done').length / tasks.length) * 100) : 0,
    };
  }, [tasks, projects, now]);

  const weekly = useMemo(() => weeklyCompletions(tasks), [tasks]);
  const load = useMemo(() => workload(tasks, MEMBERS), [tasks]);
  const stats = useMemo(() => projects.map((p) => ({ p, s: projectStats(p, tasks) })), [projects, tasks]);
  const upcoming = useMemo(
    () => tasks.filter((t) => t.status !== 'done').sort((a, b) => a.due.localeCompare(b.due)).slice(0, 6),
    [tasks]
  );
  const attention = stats.filter((x) => x.s.health === 'off-track' || x.s.health === 'at-risk').length;

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <span className="eyebrow red">Overview</span>
          <h1>{attention > 0 ? `${attention} ${attention === 1 ? 'project needs' : 'projects need'} attention.` : 'Everything is on track.'}</h1>
        </div>
        <p className="lede muted">Live snapshot of the studio: what is moving, what is late and who is carrying the load.</p>
      </header>

      <section className="kpis" aria-label="Key figures">
        <div><span className="kpi-n">{k.active}</span><span className="eyebrow">Active projects</span></div>
        <div><span className="kpi-n">{k.open}</span><span className="eyebrow">Open tasks</span></div>
        <div><span className="kpi-n">{k.week}</span><span className="eyebrow">Due in 7 days</span></div>
        <div className={k.overdue ? 'alert' : ''}><span className="kpi-n">{k.overdue}</span><span className="eyebrow">Overdue</span></div>
        <div><span className="kpi-n">{k.rate}<small>%</small></span><span className="eyebrow">Completed</span></div>
      </section>

      <div className="grid-2">
        <section className="panel">
          <div className="panel-head">
            <h2>Delivery pace</h2>
            <span className="muted small">Tasks completed per week · this week in red</span>
          </div>
          <WeeklyBars data={weekly} />
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Workload</h2>
            <span className="muted small">Open tasks per person · late in red</span>
          </div>
          <WorkloadBars rows={load} onPick={() => go({ name: 'team' })} />
        </section>
      </div>

      <div className="grid-2 wide-left">
        <section className="panel">
          <div className="panel-head">
            <h2>Project health</h2>
            <button className="link" onClick={() => go({ name: 'projects' })}>All projects</button>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Project</th><th>Progress</th><th>Health</th><th>Due</th></tr>
              </thead>
              <tbody>
                {stats.map(({ p, s }) => (
                  <tr key={p.id} className="click" onClick={() => go({ name: 'project', id: p.id })} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && go({ name: 'project', id: p.id })}>
                    <td><strong>{p.name}</strong><span className="muted small sub">{p.client}</span></td>
                    <td className="w-prog"><Progress value={s.progress} label={`${p.name} progress`} /><span className="small tnum">{Math.round(s.progress * 100)}%</span></td>
                    <td><HealthPill health={s.health} /></td>
                    <td className="tnum">{fmtDate(p.due)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head"><h2>Next deadlines</h2></div>
          <ul className="deadlines">
            {upcoming.map((t) => (
              <li key={t.id}>
                <button onClick={() => openTask(t.id)}>
                  <span className={`due ${isOverdue(t) ? 'late' : ''}`}>{dueLabel(t)}</span>
                  <span className="dl-title">{t.title}</span>
                  <Avatar id={t.assignee} size={22} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="panel">
        <div className="panel-head"><h2>Recent activity</h2></div>
        <ul className="activity">
          {state.activity.slice(0, 6).map((a) => (
            <li key={a.id}><span>{a.text}</span><span className="muted small">{timeAgo(a.at)}</span></li>
          ))}
        </ul>
      </section>
    </div>
  );
}
