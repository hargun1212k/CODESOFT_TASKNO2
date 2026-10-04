import { createContext, useContext, useEffect, useReducer } from 'react';
import { seedState, uid, todayIso, MEMBERS, STATUSES } from './data.js';

const KEY = 'redline_state_v1';
const nameOf = (id) => MEMBERS.find((m) => m.id === id)?.name ?? 'Someone';
const statusLabel = (id) => STATUSES.find((s) => s.id === id)?.label ?? id;

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && Array.isArray(s.tasks) && Array.isArray(s.projects)) return s;
    }
  } catch {
    /* storage unavailable or corrupt; fall back to the sample workspace */
  }
  return seedState();
}

const log = (state, text) => ({
  ...state,
  activity: [{ id: uid(), text, at: Date.now() }, ...state.activity].slice(0, 40),
});

const patchTask = (state, id, fn) => ({
  ...state,
  tasks: state.tasks.map((t) => (t.id === id ? fn(t) : t)),
});

// Stops a running timer and adds the elapsed time to its task.
function settleTimer(state) {
  if (!state.timer) return state;
  const mins = Math.max(1, Math.round((Date.now() - state.timer.startedAt) / 60000));
  return { ...patchTask(state, state.timer.taskId, (t) => ({ ...t, minutes: t.minutes + mins })), timer: null };
}

export function reducer(state, a) {
  switch (a.type) {
    case 'signIn':
      return { ...state, user: a.user };
    case 'signOut':
      return { ...settleTimer(state), user: null };
    case 'reset':
      return { ...seedState(), user: state.user };

    case 'addProject': {
      const project = { id: uid(), status: 'active', about: '', ...a.project };
      return log({ ...state, projects: [...state.projects, project] }, `${nameOf(state.me)} created project "${project.name}"`);
    }
    case 'addTask': {
      const t = {
        id: uid(),
        projectId: a.projectId,
        title: a.title,
        description: '',
        status: a.status || 'todo',
        priority: a.priority || 'med',
        assignee: a.assignee || state.me,
        start: todayIso(),
        due: a.due || todayIso(),
        completedAt: a.status === 'done' ? todayIso() : null,
        subtasks: [],
        comments: [],
        labels: [],
        minutes: 0,
      };
      return log({ ...state, tasks: [...state.tasks, t] }, `${nameOf(state.me)} added "${t.title}"`);
    }
    case 'updateTask': {
      let next = patchTask(state, a.id, (t) => {
        const merged = { ...t, ...a.patch };
        if (merged.due < merged.start) merged.due = merged.start;
        return merged;
      });
      return next;
    }
    case 'moveTask': {
      const t = state.tasks.find((x) => x.id === a.id);
      if (!t || t.status === a.status) return state;
      let next = patchTask(state, a.id, (x) => ({
        ...x,
        status: a.status,
        completedAt: a.status === 'done' ? todayIso() : null,
      }));
      if (a.status === 'done' && state.timer?.taskId === a.id) next = settleTimer(next);
      return log(next, `${nameOf(state.me)} moved "${t.title}" to ${statusLabel(a.status)}`);
    }
    case 'deleteTask': {
      const t = state.tasks.find((x) => x.id === a.id);
      let next = state.timer?.taskId === a.id ? { ...state, timer: null } : state;
      next = { ...next, tasks: next.tasks.filter((x) => x.id !== a.id) };
      return t ? log(next, `${nameOf(state.me)} deleted "${t.title}"`) : next;
    }
    case 'addSubtask':
      return patchTask(state, a.id, (t) => ({ ...t, subtasks: [...t.subtasks, { id: uid(), text: a.text, done: false }] }));
    case 'toggleSubtask':
      return patchTask(state, a.id, (t) => ({
        ...t,
        subtasks: t.subtasks.map((s) => (s.id === a.sid ? { ...s, done: !s.done } : s)),
      }));
    case 'deleteSubtask':
      return patchTask(state, a.id, (t) => ({ ...t, subtasks: t.subtasks.filter((s) => s.id !== a.sid) }));
    case 'addComment': {
      const t = state.tasks.find((x) => x.id === a.id);
      const next = patchTask(state, a.id, (x) => ({
        ...x,
        comments: [...x.comments, { id: uid(), by: state.me, text: a.text, at: Date.now() }],
      }));
      return t ? log(next, `${nameOf(state.me)} commented on "${t.title}"`) : next;
    }
    case 'startTimer':
      return { ...settleTimer(state), timer: { taskId: a.id, startedAt: Date.now() } };
    case 'stopTimer':
      return settleTimer(state);
    default:
      return state;
  }
}

const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable; the workspace just won't persist */
    }
  }, [state]);
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}
