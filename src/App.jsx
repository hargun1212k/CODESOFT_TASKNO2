import { useCallback, useEffect, useState } from 'react';
import { StoreProvider, useStore } from './store.jsx';
import SignIn from './views/SignIn.jsx';
import Overview from './views/Overview.jsx';
import Projects from './views/Projects.jsx';
import ProjectView from './views/ProjectView.jsx';
import MyTasks from './views/MyTasks.jsx';
import Team from './views/Team.jsx';
import TaskDrawer from './components/TaskDrawer.jsx';
import CommandPalette from './components/CommandPalette.jsx';
import { Avatar, Icon, Modal, memberOf, useNow } from './components/ui.jsx';
import { MEMBERS, fmtClock, isoOff } from './data.js';

const NAV = [
  { name: 'overview', label: 'Overview', icon: 'overview' },
  { name: 'projects', label: 'Projects', icon: 'projects' },
  { name: 'mine', label: 'My tasks', icon: 'tasks' },
  { name: 'team', label: 'Team', icon: 'team' },
];

function NewProject({ onClose, onCreated }) {
  const { state, dispatch } = useStore();
  const [f, setF] = useState({ name: '', client: '', owner: state.me, due: isoOff(30), about: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    if (!f.name.trim()) return;
    const project = { name: f.name.trim(), client: f.client.trim() || 'Internal', owner: f.owner, start: isoOff(0), due: f.due, about: f.about.trim() };
    dispatch({ type: 'addProject', project });
    onClose();
    onCreated?.();
  };

  return (
    <Modal title="New project" onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <label className="field"><span className="eyebrow">Project name</span><input id="np-name" autoFocus required value={f.name} onChange={set('name')} placeholder="Spring collection launch" /></label>
        <label className="field"><span className="eyebrow">Client</span><input id="np-client" value={f.client} onChange={set('client')} placeholder="Client or team" /></label>
        <div className="two">
          <label className="field"><span className="eyebrow">Lead</span>
            <select id="np-owner" value={f.owner} onChange={set('owner')}>{MEMBERS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
          </label>
          <label className="field"><span className="eyebrow">Due date</span><input id="np-due" type="date" required value={f.due} onChange={set('due')} /></label>
        </div>
        <label className="field"><span className="eyebrow">Summary</span><textarea id="np-about" rows={3} value={f.about} onChange={set('about')} placeholder="What does done look like?" /></label>
        <div className="form-actions">
          <button type="button" className="btn btn-quiet" onClick={onClose}>Cancel</button>
          <button className="btn" type="submit">Create project</button>
        </div>
      </form>
    </Modal>
  );
}

function Shell() {
  const { state, dispatch } = useStore();
  const [view, setView] = useState({ name: 'overview' });
  const [taskId, setTaskId] = useState(null);
  const [palette, setPalette] = useState(false);
  const [newProject, setNewProject] = useState(false);
  const now = useNow(!!state.timer);

  const go = useCallback((v) => {
    setView(v);
    setTaskId(null);
    window.scrollTo?.(0, 0);
  }, []);
  const openTask = useCallback((id) => setTaskId(id), []);
  const openNew = useCallback(() => setNewProject(true), []);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette((p) => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!state.user) return <SignIn />;

  const me = memberOf(state.me);
  const timerTask = state.timer && state.tasks.find((t) => t.id === state.timer.taskId);
  const activeKey = view.name === 'project' ? `p:${view.id}` : view.name;

  return (
    <div className="app">
      <aside className="side">
        <div className="brand-wrap">
          <div className="brand"><span className="brand-bar" /> Redline</div>
          <span className="brand-sub">Project Manager</span>
        </div>

        <button className="search-btn" onClick={() => setPalette(true)}>
          <Icon name="search" size={15} /> <span>Search</span> <kbd>Ctrl K</kbd>
        </button>

        <nav className="nav" aria-label="Main">
          {NAV.map((n) => (
            <button key={n.name} className={activeKey === n.name ? 'on' : ''} onClick={() => go({ name: n.name })}>
              <Icon name={n.icon} /> {n.label}
            </button>
          ))}
        </nav>

        <div className="side-projects">
          <div className="side-title eyebrow">
            Projects
            <button className="icon-btn mini" onClick={openNew} aria-label="New project"><Icon name="plus" size={14} /></button>
          </div>
          {state.projects.map((p) => (
            <button key={p.id} className={activeKey === `p:${p.id}` ? 'on' : ''} onClick={() => go({ name: 'project', id: p.id })}>
              {p.name}
            </button>
          ))}
        </div>

        <div className="side-foot">
          {timerTask && (
            <div className="timer-card">
              <span className="eyebrow red">Tracking</span>
              <button className="timer-task" onClick={() => openTask(timerTask.id)}>{timerTask.title}</button>
              <div className="timer-row">
                <span className="tnum clock">{fmtClock(now - state.timer.startedAt)}</span>
                <button className="btn btn-ink btn-sm" onClick={() => dispatch({ type: 'stopTimer' })}>Stop</button>
              </div>
            </div>
          )}
          <div className="me">
            <Avatar id={state.me} size={34} />
            <div>
              <strong>{me?.name}</strong>
              <span className="muted small">{me?.role}</span>
            </div>
            <button className="link small" onClick={() => dispatch({ type: 'signOut' })}>Sign out</button>
          </div>
        </div>
      </aside>

      <main className="main">
        {view.name === 'overview' && <Overview go={go} openTask={openTask} />}
        {view.name === 'projects' && <Projects go={go} newProject={openNew} />}
        {view.name === 'project' && <ProjectView key={view.id} projectId={view.id} openTask={openTask} />}
        {view.name === 'mine' && <MyTasks openTask={openTask} />}
        {view.name === 'team' && <Team openTask={openTask} />}
        <footer className="page-foot muted small">
          Prototype workspace with sample data. Changes are kept in this browser only.
          <button className="link small" onClick={() => dispatch({ type: 'reset' })}>Reset sample data</button>
        </footer>
      </main>

      {taskId && <TaskDrawer taskId={taskId} onClose={() => setTaskId(null)} />}
      {palette && <CommandPalette onClose={() => setPalette(false)} go={go} openTask={openTask} newProject={openNew} />}
      {newProject && <NewProject onClose={() => setNewProject(false)} onCreated={() => go({ name: 'projects' })} />}
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
