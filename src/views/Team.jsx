import { useMemo } from 'react';
import { useStore } from '../store.jsx';
import { Avatar } from '../components/ui.jsx';
import { MEMBERS, fmtMinutes, isOverdue, dueLabel, priorityRank } from '../data.js';

const CAPACITY = 6; // open tasks a person can hold comfortably

export default function Team({ openTask }) {
  const { state } = useStore();

  const people = useMemo(
    () =>
      MEMBERS.map((m) => {
        const all = state.tasks.filter((t) => t.assignee === m.id);
        const open = all.filter((t) => t.status !== 'done').sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority) || a.due.localeCompare(b.due));
        return {
          m,
          open,
          overdue: open.filter((t) => isOverdue(t)).length,
          done: all.length - open.length,
          minutes: all.reduce((s, t) => s + t.minutes, 0),
        };
      }),
    [state.tasks]
  );

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <span className="eyebrow red">People</span>
          <h1>Team</h1>
        </div>
        <p className="lede muted">Capacity is measured against {CAPACITY} open tasks per person. Red marks work that is already late.</p>
      </header>

      <div className="team-grid">
        {people.map(({ m, open, overdue, done, minutes }) => {
          const load = open.length / CAPACITY;
          return (
            <article key={m.id} className="person">
              <header>
                <Avatar id={m.id} size={44} />
                <div>
                  <h3>{m.name}</h3>
                  <span className="muted small">{m.role}</span>
                </div>
              </header>

              <div className="cap">
                <div className="cap-top">
                  <span className="eyebrow">Capacity</span>
                  <span className={`tnum small ${load > 1 ? 'late' : ''}`}>{Math.round(load * 100)}%</span>
                </div>
                <div className="wl-track">
                  <span className="wl-open" style={{ width: `${Math.min(1, (open.length - overdue) / CAPACITY) * 100}%` }} />
                  {overdue > 0 && <span className="wl-late" style={{ width: `${Math.min(1, overdue / CAPACITY) * 100}%` }} />}
                </div>
              </div>

              <dl className="pc-stats">
                <div><dt>Open</dt><dd className="tnum">{open.length}</dd></div>
                <div><dt>Late</dt><dd className={`tnum ${overdue ? 'late' : ''}`}>{overdue}</dd></div>
                <div><dt>Done</dt><dd className="tnum">{done}</dd></div>
                <div><dt>Logged</dt><dd className="tnum">{fmtMinutes(minutes)}</dd></div>
              </dl>

              <ul className="person-tasks">
                {open.slice(0, 3).map((t) => (
                  <li key={t.id}>
                    <button onClick={() => openTask(t.id)}>
                      <span className="dl-title">{t.title}</span>
                      <span className={`due ${isOverdue(t) ? 'late' : ''}`}>{dueLabel(t)}</span>
                    </button>
                  </li>
                ))}
                {open.length === 0 && <li className="muted small">No open tasks.</li>}
              </ul>
            </article>
          );
        })}
      </div>
    </div>
  );
}
