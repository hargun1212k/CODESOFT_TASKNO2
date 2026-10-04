import { useMemo } from 'react';
import { useStore } from '../store.jsx';
import { Avatar, PriorityTag } from '../components/ui.jsx';
import { diffDays, dueLabel, isOverdue, todayIso, priorityRank } from '../data.js';

export default function MyTasks({ openTask }) {
  const { state, dispatch } = useStore();
  const now = todayIso();
  const mine = useMemo(() => state.tasks.filter((t) => t.assignee === state.me), [state.tasks, state.me]);

  const groups = useMemo(() => {
    const open = mine
      .filter((t) => t.status !== 'done')
      .sort((a, b) => a.due.localeCompare(b.due) || priorityRank(a.priority) - priorityRank(b.priority));
    return [
      { id: 'late', label: 'Overdue', items: open.filter((t) => isOverdue(t)) },
      { id: 'today', label: 'Today', items: open.filter((t) => t.due === now) },
      { id: 'week', label: 'Next 7 days', items: open.filter((t) => t.due > now && diffDays(now, t.due) <= 7) },
      { id: 'later', label: 'Later', items: open.filter((t) => diffDays(now, t.due) > 7) },
    ];
  }, [mine, now]);

  const done = mine.filter((t) => t.status === 'done').length;
  const projectName = (id) => state.projects.find((p) => p.id === id)?.name;

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <span className="eyebrow red">Personal</span>
          <h1>My tasks</h1>
        </div>
        <p className="lede muted">{mine.length - done} open and {done} finished, across every project.</p>
      </header>

      {groups.map((g) => (
        <section key={g.id} className="panel task-group">
          <div className="panel-head">
            <h2 className={g.id === 'late' && g.items.length ? 'late' : ''}>{g.label}</h2>
            <span className="muted small tnum">{g.items.length}</span>
          </div>
          {g.items.length === 0 ? (
            <p className="muted small empty-row">Nothing here.</p>
          ) : (
            <ul className="mine">
              {g.items.map((t) => (
                <li key={t.id}>
                  <input
                    type="checkbox"
                    id={`done-${t.id}`}
                    checked={false}
                    onChange={() => dispatch({ type: 'moveTask', id: t.id, status: 'done' })}
                    aria-label={`Mark "${t.title}" done`}
                  />
                  <button className="mine-main" onClick={() => openTask(t.id)}>
                    <strong>{t.title}</strong>
                    <span className="muted small">{projectName(t.projectId)}</span>
                  </button>
                  <PriorityTag priority={t.priority} />
                  <span className={`due ${isOverdue(t) ? 'late' : ''}`}>{dueLabel(t)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
