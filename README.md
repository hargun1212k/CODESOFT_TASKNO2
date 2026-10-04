# Redline Project Manager

**A project management tool for creative studios, built with React.**
Plan projects, run work on a drag-and-drop board, see a real timeline, track time on every task and watch project health update on its own, all in a sharp white and red interface.


---

## Overview

Redline Project Manager helps a small team keep several projects moving at once. Each project has tasks that move through a board, a list or a timeline. The overview page turns that work into numbers: how much was finished this week, who is overloaded, and which projects are slipping.

This version is a front-end prototype. It runs entirely in the browser on built-in sample data and keeps your changes in local storage, so it can be reviewed without any server or database. The state logic is kept separate from the screens, so a Node and MongoDB back end can be added later without redesigning the UI.

## Features

**Projects**
- Portfolio page with progress, overdue count and days left for every project
- New project form (name, client, lead, due date, summary)
- Project health calculated automatically by comparing finished work with elapsed time: on track, at risk, off track or complete

**Tasks and views**
- Kanban board with drag and drop, quick add in every column and a one-click advance arrow for touch screens
- List view with inline status changes
- Timeline view that opens scrolled to today, with overdue bars highlighted
- Filters by text, assignee and priority
- Task drawer with status, assignee, priority, dates, description, subtasks, comments and delete

**Time and workload**
- Start a timer on any task. One timer runs at a time and shows in the sidebar
- My tasks grouped by overdue, today, next 7 days and later, with tick-to-complete
- Team page with capacity bars, late work and hours logged per person
- Overview with key figures, weekly delivery chart, workload per person, next deadlines and recent activity

**Speed**
- Command palette (Ctrl or Cmd + K) to jump to any view, project or task, or to create a project
- Responsive layout down to phone width

**UI**
- White, ink and red theme with square corners and hairline rules
- Bodoni Moda display type paired with Archivo for the interface
- Keyboard-friendly, visible focus states, reduced-motion support

## Tech stack

| Layer | Technology |
|---|---|
| Front end | React 18, Vite 5, plain CSS (no UI framework) |
| State | Reducer and Context store, saved to local storage |
| Charts | Hand-built SVG |
| Drag and drop | Native HTML5 drag and drop |
| Fonts | Bodoni Moda and Archivo (Google Fonts) |
| Tests | Node assert checks, esbuild bundle, server-side render of every screen |

## How it works

- `data.js` holds the sample workspace and the pure calculations: project health, weekly completions and workload per person.
- `store.jsx` is a reducer. Every change (move a task, add a comment, start a timer) is an action, and the whole state is saved to local storage after each change.
- Project health compares progress (finished tasks) with time elapsed between the project start and due date. Overdue tasks push a project further toward off track.
- Moving a task to Done stamps its completion date and stops its timer if it was running.

## Project structure

```
.
├── index.html
├── vite.config.js
├── src/
│   ├── App.jsx             shell, sidebar, routing, new project form
│   ├── data.js             sample data, date helpers, health and chart maths
│   ├── store.jsx           reducer, persistence, activity log, timer
│   ├── views/              SignIn, Overview, Projects, ProjectView,
│   │                       MyTasks, Team
│   ├── components/         TaskCard, TaskDrawer, CommandPalette,
│   │                       Charts, ui
│   └── styles.css          theme and components
└── tests/                  logic.test.mjs runs entry.jsx
```

## Getting started

**Requirements:** Node.js 18 or newer.

```bash
git clone https://github.com/hargun1212k/CODESOFT_TASKNO2.git
cd CODESOFT_TASKNO2
npm install
npm run dev
```

Open **http://localhost:5173** and sign in. The sign-in details are pre-filled, and any valid email with a password of six characters or more works.

**Useful scripts**

| Command | What it does |
|---|---|
| `npm run dev` | Starts the Vite dev server |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serves the production build locally |
| `npm test` | Runs the logic, reducer and render checks |

## Data

All data is sample data created in `seedState()`: four projects, five team members, 33 tasks, comments and an activity log. Use **Reset sample data** at the bottom of any page to restore it.

## Deployment

The app is static, so any free host works.

1. **GitHub Pages:** run `npm run build` and publish the `dist/` folder. The build uses relative paths, so it works from a project sub-path.
2. **Netlify:** import the repository with build command `npm run build` and publish directory `dist`.
3. **GitLab Pages:** build in CI and publish `dist/` as `public/`.

## Roadmap

- Express and MongoDB back end with real accounts, projects and tasks
- Invitations and roles
- File attachments and notifications
- Calendar view and recurring tasks

## Prototype

**Local link:** http://localhost:5173

This address works on your own computer once the app is running (`npm run dev`). Sign in with the pre-filled details.

**Hosted demo:** https://hargun1212k.github.io/CODESOFT_TASKNO2/

The same prototype hosted on GitHub Pages. It uses sample data and stores changes only in your browser.

---

