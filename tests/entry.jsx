import assert from 'node:assert/strict';
import { renderToString } from 'react-dom/server';
import {
  seedState, projectStats, weeklyCompletions, workload, dueLabel, isOverdue, todayIso, isoOff, diffDays,
  fmtMinutes, fmtClock, MEMBERS,
} from '../src/data.js';
import { reducer, StoreProvider } from '../src/store.jsx';
import Overview from '../src/views/Overview.jsx';
import Projects from '../src/views/Projects.jsx';
import ProjectView, { Board, List, Timeline } from '../src/views/ProjectView.jsx';
import MyTasks from '../src/views/MyTasks.jsx';
import Team from '../src/views/Team.jsx';
import SignIn from '../src/views/SignIn.jsx';
import TaskDrawer from '../src/components/TaskDrawer.jsx';
import CommandPalette from '../src/components/CommandPalette.jsx';

let n = 0;
const ok = (name, fn) => { fn(); n++; console.log('  ok  ' + name); };

// ---- pure logic ----
const s = seedState();
ok('seed has projects, tasks and members', () => {
  assert.equal(s.projects.length, 4);
  assert.ok(s.tasks.length >= 30);
  assert.equal(MEMBERS.length, 5);
  assert.ok(s.tasks.every((t) => t.due >= t.start), 'every task due date is on or after its start');
  assert.ok(s.tasks.every((t) => (t.status === 'done') === !!t.completedAt), 'completedAt matches done status');
});
ok('project health covers a sensible mix', () => {
  const h = s.projects.map((p) => projectStats(p, s.tasks).health);
  assert.deepEqual([...new Set(h)].sort(), ['at-risk', 'off-track', 'on-track']);
});
ok('health: finished project is complete, late project is off-track', () => {
  const p = { id: 'x', start: isoOff(-10), due: isoOff(-1) };
  const done = [{ projectId: 'x', status: 'done', due: isoOff(-2) }];
  assert.equal(projectStats(p, done).health, 'complete');
  const open = [{ projectId: 'x', status: 'doing', due: isoOff(-2) }];
  assert.equal(projectStats(p, open).health, 'off-track');
  assert.equal(projectStats({ id: 'y', start: isoOff(-1), due: isoOff(9) }, []).progress, 0);
});
ok('due labels', () => {
  assert.equal(dueLabel({ status: 'todo', due: isoOff(-3) }), '3d overdue');
  assert.equal(dueLabel({ status: 'todo', due: isoOff(0) }), 'Due today');
  assert.equal(dueLabel({ status: 'todo', due: isoOff(1) }), 'Tomorrow');
  assert.equal(dueLabel({ status: 'done', due: isoOff(-3) }), 'Done');
  assert.equal(isOverdue({ status: 'done', due: isoOff(-3) }), false);
});
ok('weekly completions: 8 buckets, today in the last, total matches', () => {
  const w = weeklyCompletions(s.tasks);
  assert.equal(w.length, 8);
  assert.equal(w[7].to, todayIso());
  assert.equal(diffDays(w[0].from, w[0].to), 6);
  const inRange = s.tasks.filter((t) => t.completedAt && t.completedAt >= w[0].from).length;
  assert.equal(w.reduce((a, b) => a + b.count, 0), inRange);
});
ok('workload counts open and late per person', () => {
  const w = workload(s.tasks, MEMBERS);
  assert.equal(w.reduce((a, b) => a + b.open, 0), s.tasks.filter((t) => t.status !== 'done').length);
});
ok('time formats', () => {
  assert.equal(fmtMinutes(340), '5h 40m');
  assert.equal(fmtMinutes(45), '45m');
  assert.equal(fmtClock(3723000), '01:02:03');
});

// ---- reducer ----
ok('moveTask sets and clears completedAt and logs activity', () => {
  const t = s.tasks.find((x) => x.status === 'todo');
  let st = reducer(s, { type: 'moveTask', id: t.id, status: 'done' });
  assert.equal(st.tasks.find((x) => x.id === t.id).completedAt, todayIso());
  assert.equal(st.activity.length, s.activity.length + 1);
  st = reducer(st, { type: 'moveTask', id: t.id, status: 'doing' });
  assert.equal(st.tasks.find((x) => x.id === t.id).completedAt, null);
});
ok('addTask, subtasks, comments, delete', () => {
  let st = reducer(s, { type: 'addTask', projectId: 'p1', title: 'New thing', status: 'todo' });
  const t = st.tasks.find((x) => x.title === 'New thing');
  assert.ok(t);
  st = reducer(st, { type: 'addSubtask', id: t.id, text: 'a' });
  const sid = st.tasks.find((x) => x.id === t.id).subtasks[0].id;
  st = reducer(st, { type: 'toggleSubtask', id: t.id, sid });
  assert.equal(st.tasks.find((x) => x.id === t.id).subtasks[0].done, true);
  st = reducer(st, { type: 'addComment', id: t.id, text: 'hi' });
  assert.equal(st.tasks.find((x) => x.id === t.id).comments.length, 1);
  st = reducer(st, { type: 'deleteTask', id: t.id });
  assert.ok(!st.tasks.find((x) => x.id === t.id));
});
ok('timer adds minutes on stop and only one runs at a time', () => {
  const a = s.tasks[3];
  const b = s.tasks[4];
  let st = reducer(s, { type: 'startTimer', id: a.id });
  st = { ...st, timer: { ...st.timer, startedAt: Date.now() - 5 * 60000 } };
  st = reducer(st, { type: 'startTimer', id: b.id });
  assert.equal(st.timer.taskId, b.id);
  assert.equal(st.tasks.find((x) => x.id === a.id).minutes, a.minutes + 5);
  st = reducer(st, { type: 'stopTimer' });
  assert.equal(st.timer, null);
});
ok('due date can never precede start date', () => {
  const t = s.tasks[0];
  const st = reducer(s, { type: 'updateTask', id: t.id, patch: { due: '2000-01-01' } });
  assert.equal(st.tasks[0].due, st.tasks[0].start);
});

// ---- server render of every screen (catches crashes on the render path) ----
const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => mem.get(k) ?? null,
  setItem: (k, v) => mem.set(k, v),
  removeItem: (k) => mem.delete(k),
};
mem.set('redline_state_v1', JSON.stringify({ ...seedState(), user: { email: 'a@b.co' } }));
const noop = () => {};
const wrap = (el) => renderToString(<StoreProvider>{el}</StoreProvider>);
const all = seedState().tasks;
const proj = seedState().projects[1];

const screens = {
  SignIn: <SignIn />,
  Overview: <Overview go={noop} openTask={noop} />,
  Projects: <Projects go={noop} newProject={noop} />,
  'Project board': <ProjectView projectId="p2" openTask={noop} />,
  Board: <Board tasks={all} projectId="p1" openTask={noop} move={noop} />,
  List: <List tasks={all} openTask={noop} move={noop} />,
  Timeline: <Timeline tasks={all.filter((t) => t.projectId === 'p2')} project={proj} openTask={noop} />,
  'Timeline (empty)': <Timeline tasks={[]} project={proj} openTask={noop} />,
  'My tasks': <MyTasks openTask={noop} />,
  Team: <Team openTask={noop} />,
  'Task drawer': <TaskDrawer taskId={all.find((t) => t.title === 'Hero film edit').id} onClose={noop} />,
  'Command palette': <CommandPalette onClose={noop} go={noop} openTask={noop} newProject={noop} />,
};
for (const [name, el] of Object.entries(screens)) {
  ok(`renders: ${name}`, () => {
    const html = wrap(el);
    assert.ok(html.length > 50, 'produced markup');
    assert.ok(!html.includes('NaN'), 'no NaN in output');
    assert.ok(!html.includes('undefined'), 'no "undefined" text in output');
  });
}

console.log(`\n${n} checks passed`);
