import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../store.jsx';
import TaskCard from '../components/TaskCard.jsx';
import { Avatar, HealthPill, Icon, PriorityTag, Progress, memberOf } from '../components/ui.jsx';
import {
  MEMBERS, PRIORITIES, STATUSES, projectStats, priorityRank, dueLabel, isOverdue, fmtDate, fmtLong, diffDays, parse, iso, todayIso,
} from '../data.js';

const TABS = [
  { id: 'board', label: 'Board', icon: 'board' },
  { id: 'list', label: 'List', icon: 'list' },
  { id: 'timeline', label: 'Timeline', icon: 'timeline' },
];

export default function ProjectView({ projectId, openTask }) {
  const { state, dispatch } = useStore();
  const project = state.projects.find((p) => p.id === projectId);
  const [tab, setTab] = useState('board');
  const [q, setQ] = useState('');
  const [who, setWho] = useState('all');
  const [prio, setPrio] = useState('all');

  const all = useMemo(() => state.tasks.filter((t) => t.projectId === projectId), [state.tasks, projectId]);
  const tasks = useMemo(() => {
    const s = q.trim().toLowerCase();
    return all
      .filter((t) => (who === 'all' || t.assignee === who) && (prio === 'all' || t.priority === prio))
      .filter((t) => !s || t.title.toLowerCase().includes(s) || t.labels.some((l) => l.toLowerCase().includes(s)))
      .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority) || a.due.localeCompare(b.due));
  }, [all, q, who, prio]);

  if (!project) return <div className="page"><p className="muted">This project no longer exists.</p></div>;

  const stats = projectStats(project, state.tasks);
  const move = (id, status) => dispatch({ type: 'moveTask', id, status });

  return (
    <div className="page">
      <header className="page-head project-head">
        <div>
          <span className="eyebrow red">{project.client}</span>
          <h1>{project.name}</h1>
          <p className="muted lede-left">{project.about}</p>
        </div>
        <dl className="head-facts">
          <div><dt>Health</dt><dd><HealthPill health={stats.health} /></dd></div>
          <div><dt>Progress</dt><dd className="tnum">{Math.round(stats.progress * 100)}%<Progress value={stats.progress} label="Project progress" /></dd></div>
          <div><dt>Due</dt><dd className="tnum">{fmtLong(project.due)}</dd></div>
          <div><dt>Lead</dt><dd className="lead"><Avatar id={project.owner} size={22} /> {memberOf(project.owner)?.name}</dd></div>
        </dl>
      </header>

      <div className="toolbar">
        <div className="tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
              <Icon name={t.icon} size={15} /> {t.label}
            </button>
          ))}
        </div>
        <div className="filters">
          <label className="search">
            <Icon name="search" size={15} />
            <input id="task-search" placeholder="Filter tasks" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter tasks" />
          </label>
          <select id="filter-who" value={who} onChange={(e) => setWho(e.target.value)} aria-label="Assignee">
            <option value="all">Everyone</option>
            {MEMBERS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <select id="filter-prio" value={prio} onChange={(e) => setPrio(e.target.value)} aria-label="Priority">
            <option value="all">Any priority</option>
            {PRIORITIES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>
      </div>

      {tab === 'board' && <Board tasks={tasks} projectId={projectId} openTask={openTask} move={move} />}
      {tab === 'list' && <List tasks={tasks} openTask={openTask} move={move} />}
      {tab === 'timeline' && <Timeline tasks={tasks} project={project} openTask={openTask} />}
    </div>
  );
}

export function Board({ tasks, projectId, openTask, move }) {
  const { state, dispatch } = useStore();
  const [over, setOver] = useState(null);
  const [adding, setAdding] = useState(null);
  const [title, setTitle] = useState('');

  const submit = (status) => {
    if (title.trim()) dispatch({ type: 'addTask', projectId, title: title.trim(), status });
    setTitle('');
    setAdding(null);
  };

  return (
    <div className="board">
      {STATUSES.map((col) => {
        const items = tasks.filter((t) => t.status === col.id);
        return (
          <section
            key={col.id}
            className={`col ${over === col.id ? 'over' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(col.id);
            }}
            onDragLeave={() => setOver((o) => (o === col.id ? null : o))}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData('text/plain');
              setOver(null);
              if (id) move(id, col.id);
            }}
          >
            <header className="col-head">
              <h3>{col.label}</h3>
              <span className="count tnum">{items.length}</span>
            </header>
            <div className="col-body">
              {items.map((t) => (
                <TaskCard key={t.id} task={t} onOpen={openTask} onMove={move} tracking={state.timer?.taskId === t.id} />
              ))}
              {items.length === 0 && <p className="col-empty">Drop a task here</p>}
            </div>
            {adding === col.id ? (
              <form className="quick-add" onSubmit={(e) => { e.preventDefault(); submit(col.id); }}>
                <input
                  id={`quick-${col.id}`}
                  autoFocus
                  placeholder="Task title, then Enter"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => submit(col.id)}
                  onKeyDown={(e) => e.key === 'Escape' && (setTitle(''), setAdding(null))}
                />
              </form>
            ) : (
              <button className="add-task" onClick={() => setAdding(col.id)}><Icon name="plus" size={14} /> Add task</button>
            )}
          </section>
        );
      })}
    </div>
  );
}

export function List({ tasks, openTask, move }) {
  return (
    <div className="table-wrap panel flush">
      <table className="table list">
        <thead>
          <tr><th>Task</th><th>Status</th><th>Priority</th><th>Owner</th><th>Due</th><th>Subtasks</th></tr>
        </thead>
        <tbody>
          {tasks.map((t) => {
            const done = t.subtasks.filter((s) => s.done).length;
            return (
              <tr key={t.id} className="click" onClick={() => openTask(t.id)}>
                <td><strong>{t.title}</strong></td>
                <td onClick={(e) => e.stopPropagation()}>
                  <select value={t.status} onChange={(e) => move(t.id, e.target.value)} aria-label={`Status of ${t.title}`}>
                    {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </td>
                <td><PriorityTag priority={t.priority} /></td>
                <td><span className="who"><Avatar id={t.assignee} size={22} /> {memberOf(t.assignee)?.name.split(' ')[0]}</span></td>
                <td className={`tnum due ${isOverdue(t) ? 'late' : ''}`}>{dueLabel(t)}</td>
                <td className="tnum muted">{t.subtasks.length ? `${done}/${t.subtasks.length}` : '-'}</td>
              </tr>
            );
          })}
          {tasks.length === 0 && <tr><td colSpan={6} className="muted empty-row">No tasks match these filters.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

const PPD = 30; // pixels per day on the timeline

export function Timeline({ tasks, project, openTask }) {
  if (tasks.length === 0) return <div className="panel"><p className="muted empty-row">No tasks to plot.</p></div>;
  return <TimelineChart tasks={tasks} project={project} openTask={openTask} />;
}

function TimelineChart({ tasks, project, openTask }) {
  const now = todayIso();
  const scroller = useRef(null);
  const rows = useMemo(() => [...tasks].sort((a, b) => a.start.localeCompare(b.start) || a.due.localeCompare(b.due)), [tasks]);

  const minStart = rows.reduce((m, t) => (t.start < m ? t.start : m), project.start);
  const maxDue = rows.reduce((m, t) => (t.due > m ? t.due : m), project.due);
  const first = iso(new Date(parse(minStart).getFullYear(), parse(minStart).getMonth(), parse(minStart).getDate() - 2));
  const days = diffDays(first, maxDue) + 4;
  const todayX = diffDays(first, now) * PPD + PPD / 2;
  // open scrolled so that today is comfortably in view
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = Math.max(0, todayX - el.clientWidth * 0.35);
  }, [todayX]);
  const weekTicks = [];
  for (let d = 0; d < days; d += 7) {
    const x = new Date(parse(first));
    x.setDate(x.getDate() + d);
    weekTicks.push({ x: d * PPD, label: fmtDate(iso(x)) });
  }

  return (
    <div className="timeline panel flush">
      <div className="tl-labels">
        <div className="tl-corner eyebrow">Task</div>
        {rows.map((t) => (
          <button key={t.id} className="tl-label" onClick={() => openTask(t.id)} title={t.title}>
            <span>{t.title}</span>
          </button>
        ))}
      </div>
      <div className="tl-scroll" ref={scroller}>
        <div className="tl-canvas" style={{ width: days * PPD }}>
          <div className="tl-head">
            {weekTicks.map((w) => (
              <span key={w.x} className="tl-tick tnum" style={{ left: w.x }}>{w.label}</span>
            ))}
          </div>
          {weekTicks.map((w) => <span key={w.x} className="tl-grid" style={{ left: w.x }} />)}
          {todayX >= 0 && todayX <= days * PPD && <span className="tl-today" style={{ left: todayX }}><em>Today</em></span>}
          {rows.map((t) => {
            const left = diffDays(first, t.start) * PPD;
            const width = Math.max(1, diffDays(t.start, t.due) + 1) * PPD - 4;
            return (
              <div key={t.id} className="tl-row">
                <button
                  className={`tl-bar st-${t.status} ${isOverdue(t) ? 'late' : ''}`}
                  style={{ left, width }}
                  onClick={() => openTask(t.id)}
                  title={`${t.title}: ${fmtDate(t.start)} to ${fmtDate(t.due)}`}
                >
                  <span>{width > 90 ? t.title : ''}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
