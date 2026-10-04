// Pure helpers and seed data. No React in here, so everything is easy to test.

export const DAY = 86400000;
const pad = (n) => String(n).padStart(2, '0');

export const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parse = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
export const todayIso = () => iso(today());
export const isoOff = (n, from = today()) => {
  const d = new Date(from);
  d.setDate(d.getDate() + n);
  return iso(d);
};
// whole days from a to b (b - a), safe across daylight-saving changes
export const diffDays = (a, b) => Math.round((parse(b) - parse(a)) / DAY);
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const fmtDate = (s) => {
  const x = parse(s);
  return `${x.getDate()} ${MONTHS[x.getMonth()]}`;
};
export const fmtLong = (s) => `${fmtDate(s)} ${parse(s).getFullYear()}`;
export const fmtMinutes = (m) => {
  const h = Math.floor(m / 60);
  const r = m % 60;
  return h ? `${h}h ${pad(r)}m` : `${r}m`;
};
export const fmtClock = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
};
export const timeAgo = (at, now = Date.now()) => {
  const m = Math.round((now - at) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
};
export const uid = () => Math.random().toString(36).slice(2, 9);

export const STATUSES = [
  { id: 'todo', label: 'To do' },
  { id: 'doing', label: 'In progress' },
  { id: 'review', label: 'In review' },
  { id: 'done', label: 'Done' },
];
export const PRIORITIES = [
  { id: 'urgent', label: 'Urgent', rank: 0 },
  { id: 'high', label: 'High', rank: 1 },
  { id: 'med', label: 'Medium', rank: 2 },
  { id: 'low', label: 'Low', rank: 3 },
];
export const priorityRank = (p) => PRIORITIES.find((x) => x.id === p)?.rank ?? 9;
export const HEALTH_LABEL = {
  complete: 'Complete',
  'on-track': 'On track',
  'at-risk': 'At risk',
  'off-track': 'Off track',
};

export const isOverdue = (t, now = todayIso()) => t.status !== 'done' && t.due < now;

export function dueLabel(t, now = todayIso()) {
  if (t.status === 'done') return 'Done';
  const d = diffDays(now, t.due);
  if (d < 0) return `${-d}d overdue`;
  if (d === 0) return 'Due today';
  if (d === 1) return 'Tomorrow';
  return fmtDate(t.due);
}

// Project health: compares how much work is finished against how much time has passed.
export function projectStats(project, tasks, now = todayIso()) {
  const mine = tasks.filter((t) => t.projectId === project.id);
  const total = mine.length;
  const done = mine.filter((t) => t.status === 'done').length;
  const overdue = mine.filter((t) => isOverdue(t, now)).length;
  const progress = total ? done / total : 0;
  const span = Math.max(1, diffDays(project.start, project.due));
  const elapsed = Math.min(1, Math.max(0, diffDays(project.start, now) / span));

  let health;
  if (total > 0 && done === total) health = 'complete';
  else if (now > project.due) health = 'off-track';
  else {
    const delta = progress - elapsed;
    let level = delta >= -0.1 ? 0 : delta >= -0.25 ? 1 : 2;
    if (overdue >= 2) level = Math.min(2, level + 1);
    health = ['on-track', 'at-risk', 'off-track'][level];
  }
  return { total, done, open: total - done, overdue, progress, elapsed, health };
}

// Tasks finished in each of the last N weeks (oldest first). The last bucket ends today.
export function weeklyCompletions(tasks, weeks = 8, now = todayIso()) {
  const out = [];
  for (let i = 0; i < weeks; i++) {
    const to = isoOff(-7 * (weeks - 1 - i), parse(now));
    const from = isoOff(-6, parse(to));
    const count = tasks.filter((t) => t.completedAt && t.completedAt >= from && t.completedAt <= to).length;
    out.push({ from, to, count, label: fmtDate(from), current: i === weeks - 1 });
  }
  return out;
}

export function workload(tasks, members, now = todayIso()) {
  return members.map((m) => {
    const open = tasks.filter((t) => t.assignee === m.id && t.status !== 'done');
    return { member: m, open: open.length, overdue: open.filter((t) => isOverdue(t, now)).length };
  });
}

export const MEMBERS = [
  { id: 'm1', name: 'Aanya Kapoor', role: 'Studio Director', initials: 'AK' },
  { id: 'm2', name: 'Rohan Mehta', role: 'Project Lead', initials: 'RM' },
  { id: 'm3', name: 'Ishita Verma', role: 'Art Director', initials: 'IV' },
  { id: 'm4', name: 'Kabir Singh', role: 'Lead Engineer', initials: 'KS' },
  { id: 'm5', name: 'Meera Nair', role: 'Copy Chief', initials: 'MN' },
];

const PROJECTS = [
  { id: 'p1', name: 'Aurelia Flagship Launch', client: 'Aurelia Jewellers', owner: 'm1', start: -22, due: 18, about: 'Campaign film, launch site and press for the flagship store opening.' },
  { id: 'p2', name: 'Maison Website Redesign', client: 'Maison Noir', owner: 'm2', start: -35, due: 6, about: 'Full storefront redesign with a new design system and product templates.' },
  { id: 'p3', name: 'Verve App v2', client: 'Verve Fitness', owner: 'm4', start: -14, due: 45, about: 'Second major version of the Verve training app: onboarding, tracking, payments.' },
  { id: 'p4', name: 'Annual Report 2026', client: 'Halden Group', owner: 'm3', start: -50, due: 5, about: 'Editorial design, infographics and print production for the annual report.' },
];

// [project, title, status, priority, assignee, startOffset, dueOffset, completedOffset, subtasks, labels, minutes]
const T = [
  ['p1', 'Brief and kickoff', 'done', 'med', 'm1', -22, -21, -21, [], ['Strategy'], 90],
  ['p1', 'Finalise campaign concept', 'done', 'high', 'm1', -21, -15, -16, [], ['Strategy'], 420],
  ['p1', 'Photoshoot shot list', 'done', 'med', 'm3', -20, -12, -13, [], ['Creative'], 180],
  ['p1', 'Hero film edit', 'doing', 'urgent', 'm3', -10, 3, null, [['Rough cut', 1], ['Colour grade', 0], ['Sound mix', 0], ['Client review', 0]], ['Video'], 340],
  ['p1', 'Launch landing page', 'doing', 'high', 'm4', -6, 8, null, [['Page structure', 1], ['Animation pass', 0], ['Performance budget', 0]], ['Web'], 210],
  ['p1', 'Press kit copy', 'review', 'med', 'm5', -9, 1, null, [['Founder story', 1], ['Product notes', 1], ['Legal read', 0]], ['Copy'], 260],
  ['p1', 'Influencer briefing pack', 'todo', 'med', 'm2', 1, 9, null, [], ['PR'], 0],
  ['p1', 'VIP event run of show', 'todo', 'high', 'm1', 2, 14, null, [], ['Events'], 0],
  ['p1', 'Launch day QA checklist', 'todo', 'low', 'm2', 10, 17, null, [], ['Ops'], 0],

  ['p2', 'Audit existing site', 'done', 'med', 'm2', -35, -28, -29, [], ['Research'], 300],
  ['p2', 'Sitemap and wireframes', 'done', 'high', 'm3', -30, -21, -22, [], ['UX'], 540],
  ['p2', 'Visual design system', 'done', 'high', 'm3', -24, -12, -13, [], ['Design'], 780],
  ['p2', 'Homepage build', 'doing', 'urgent', 'm4', -12, -1, null, [['Hero', 1], ['Collection grid', 1], ['Newsletter block', 0], ['Responsive pass', 0]], ['Web'], 620],
  ['p2', 'Product page template', 'doing', 'high', 'm4', -5, 3, null, [], ['Web'], 240],
  ['p2', 'Content migration', 'review', 'med', 'm5', -8, 2, null, [], ['Copy'], 330],
  ['p2', 'Accessibility review', 'todo', 'med', 'm2', 1, 5, null, [], ['QA'], 0],
  ['p2', 'Launch and redirects', 'todo', 'high', 'm4', 4, 6, null, [], ['Web'], 0],

  ['p3', 'Discovery workshop', 'done', 'med', 'm2', -14, -12, -12, [], ['Research'], 240],
  ['p3', 'User interviews', 'done', 'med', 'm2', -13, -8, -9, [], ['Research'], 360],
  ['p3', 'Onboarding flow prototype', 'done', 'high', 'm3', -10, -3, -4, [], ['UX'], 450],
  ['p3', 'Workout tracking API', 'doing', 'high', 'm4', -7, 10, null, [['Data model', 1], ['Endpoints', 0], ['Load test', 0]], ['Backend'], 410],
  ['p3', 'Push notification strategy', 'todo', 'low', 'm5', 3, 12, null, [], ['Growth'], 0],
  ['p3', 'Beta test plan', 'todo', 'med', 'm2', 8, 20, null, [], ['QA'], 0],
  ['p3', 'Payments integration', 'todo', 'urgent', 'm4', 10, 30, null, [], ['Backend'], 0],
  ['p3', 'App store assets', 'todo', 'low', 'm3', 20, 35, null, [], ['Design'], 0],

  ['p4', 'Brief and kickoff', 'done', 'med', 'm1', -50, -47, -48, [], ['Strategy'], 120],
  ['p4', 'Data collection', 'done', 'med', 'm2', -42, -34, -35, [], ['Research'], 480],
  ['p4', 'Narrative and copy', 'done', 'high', 'm5', -38, -24, -25, [], ['Copy'], 900],
  ['p4', 'Infographic suite', 'done', 'high', 'm3', -30, -14, -15, [], ['Design'], 960],
  ['p4', 'Layout and typesetting', 'done', 'med', 'm3', -20, -8, -9, [], ['Design'], 720],
  ['p4', 'Print proofing', 'done', 'med', 'm2', -12, -5, -6, [], ['Print'], 200],
  ['p4', 'Board sign-off', 'review', 'urgent', 'm1', -8, -3, null, [['Chair review', 1], ['Final amendments', 0]], ['Approvals'], 60],
  ['p4', 'Print and distribution', 'todo', 'high', 'm2', -2, 4, null, [], ['Print'], 0],
];

export function seedState() {
  const nowMs = Date.now();
  const tasks = T.map(([projectId, title, status, priority, assignee, s, d, c, subs, labels, minutes], i) => ({
    id: `t${i + 1}`,
    projectId,
    title,
    description: '',
    status,
    priority,
    assignee,
    start: isoOff(s),
    due: isoOff(d),
    completedAt: c === null ? null : isoOff(c),
    subtasks: subs.map(([text, done], j) => ({ id: `s${i}-${j}`, text, done: !!done })),
    comments: [],
    labels,
    minutes,
  }));

  const byTitle = (t) => tasks.find((x) => x.title === t);
  byTitle('Hero film edit').description =
    'Cut the 60 second hero film for the launch. Final grade and mix must be approved before the landing page goes live.';
  byTitle('Hero film edit').comments = [
    { id: 'c1', by: 'm1', text: 'Opening shot feels slow. Can we trim two seconds?', at: nowMs - 5 * 3600000 },
    { id: 'c2', by: 'm3', text: 'Trimmed. New cut is in the shared folder for review.', at: nowMs - 2 * 3600000 },
  ];
  byTitle('Homepage build').description =
    'Build the homepage from the approved design system. Newsletter block waits on the email provider.';
  byTitle('Homepage build').comments = [
    { id: 'c3', by: 'm2', text: 'This is blocking accessibility review. Where are we?', at: nowMs - 26 * 3600000 },
  ];

  const activity = [
    { id: 'a1', text: 'Ishita Verma moved "Hero film edit" to In progress', at: nowMs - 2 * 3600000 },
    { id: 'a2', text: 'Rohan Mehta commented on "Homepage build"', at: nowMs - 26 * 3600000 },
    { id: 'a3', text: 'Meera Nair moved "Press kit copy" to In review', at: nowMs - 30 * 3600000 },
    { id: 'a4', text: 'Kabir Singh finished 2 subtasks on "Homepage build"', at: nowMs - 50 * 3600000 },
    { id: 'a5', text: 'Rohan Mehta completed "Print proofing"', at: nowMs - 6 * 86400000 },
  ];

  return {
    user: null,
    me: 'm1',
    projects: PROJECTS.map((p) => ({ ...p, start: isoOff(p.start), due: isoOff(p.due), status: 'active' })),
    tasks,
    activity,
    timer: null,
  };
}
