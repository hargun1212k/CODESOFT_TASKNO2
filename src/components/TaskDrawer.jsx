import { useEffect, useState } from 'react';
import { useStore } from '../store.jsx';
import { Avatar, Icon, memberOf, useNow } from './ui.jsx';
import { MEMBERS, PRIORITIES, STATUSES, fmtClock, fmtMinutes, timeAgo, dueLabel, isOverdue } from '../data.js';

export default function TaskDrawer({ taskId, onClose }) {
  const { state, dispatch } = useStore();
  const task = state.tasks.find((t) => t.id === taskId);
  const project = task && state.projects.find((p) => p.id === task.projectId);
  const [sub, setSub] = useState('');
  const [comment, setComment] = useState('');
  const running = state.timer?.taskId === taskId;
  const now = useNow(running);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!task) return null;
  const set = (patch) => dispatch({ type: 'updateTask', id: task.id, patch });
  const subDone = task.subtasks.filter((s) => s.done).length;
  const live = running ? now - state.timer.startedAt : 0;

  return (
    <div className="overlay drawer-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Task details">
        <header className="drawer-head">
          <div>
            <span className="eyebrow">{project?.name}</span>
            <span className={`due ${isOverdue(task) ? 'late' : ''}`}>{dueLabel(task)}</span>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        </header>

        <div className="drawer-body">
          <input
            id="task-title"
            className="title-input"
            value={task.title}
            onChange={(e) => set({ title: e.target.value })}
            aria-label="Task title"
          />

          <div className="seg" role="group" aria-label="Status">
            {STATUSES.map((s) => (
              <button
                key={s.id}
                className={task.status === s.id ? 'on' : ''}
                onClick={() => dispatch({ type: 'moveTask', id: task.id, status: s.id })}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="fields">
            <label className="field">
              <span className="eyebrow">Assignee</span>
              <select id="task-assignee" value={task.assignee} onChange={(e) => set({ assignee: e.target.value })}>
                {MEMBERS.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="eyebrow">Priority</span>
              <select id="task-priority" value={task.priority} onChange={(e) => set({ priority: e.target.value })}>
                {PRIORITIES.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="eyebrow">Start</span>
              <input id="task-start" type="date" value={task.start} onChange={(e) => e.target.value && set({ start: e.target.value })} />
            </label>
            <label className="field">
              <span className="eyebrow">Due</span>
              <input id="task-due" type="date" value={task.due} onChange={(e) => e.target.value && set({ due: e.target.value })} />
            </label>
          </div>

          <label className="field">
            <span className="eyebrow">Description</span>
            <textarea
              id="task-description"
              rows={3}
              placeholder="Add context, links or acceptance criteria"
              value={task.description}
              onChange={(e) => set({ description: e.target.value })}
            />
          </label>

          <section className="block">
            <div className="block-head">
              <span className="eyebrow">Time tracked</span>
              <span className="tnum big-time">{fmtMinutes(task.minutes)}{running && <em> + {fmtClock(live)}</em>}</span>
            </div>
            {running ? (
              <button className="btn btn-ink" onClick={() => dispatch({ type: 'stopTimer' })}>
                <Icon name="stop" size={14} /> Stop timer
              </button>
            ) : (
              <button className="btn btn-ink" onClick={() => dispatch({ type: 'startTimer', id: task.id })} disabled={task.status === 'done'}>
                <Icon name="play" size={14} /> Start timer
              </button>
            )}
          </section>

          <section className="block">
            <div className="block-head">
              <span className="eyebrow">Subtasks</span>
              {task.subtasks.length > 0 && <span className="muted small tnum">{subDone} of {task.subtasks.length}</span>}
            </div>
            <ul className="checks">
              {task.subtasks.map((s) => (
                <li key={s.id} className={s.done ? 'done' : ''}>
                  <label>
                    <input type="checkbox" checked={s.done} onChange={() => dispatch({ type: 'toggleSubtask', id: task.id, sid: s.id })} />
                    <span>{s.text}</span>
                  </label>
                  <button className="icon-btn mini" aria-label="Remove subtask" onClick={() => dispatch({ type: 'deleteSubtask', id: task.id, sid: s.id })}>
                    <Icon name="close" size={13} />
                  </button>
                </li>
              ))}
            </ul>
            <form
              className="inline-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (!sub.trim()) return;
                dispatch({ type: 'addSubtask', id: task.id, text: sub.trim() });
                setSub('');
              }}
            >
              <input id="subtask-new" placeholder="Add a subtask" value={sub} onChange={(e) => setSub(e.target.value)} />
              <button className="btn btn-quiet" type="submit">Add</button>
            </form>
          </section>

          <section className="block">
            <div className="block-head"><span className="eyebrow">Discussion</span></div>
            <ul className="comments">
              {task.comments.map((c) => (
                <li key={c.id}>
                  <Avatar id={c.by} size={26} />
                  <div>
                    <strong>{memberOf(c.by)?.name}</strong> <span className="muted small">{timeAgo(c.at)}</span>
                    <p>{c.text}</p>
                  </div>
                </li>
              ))}
              {task.comments.length === 0 && <li className="muted small">No comments yet.</li>}
            </ul>
            <form
              className="inline-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (!comment.trim()) return;
                dispatch({ type: 'addComment', id: task.id, text: comment.trim() });
                setComment('');
              }}
            >
              <input id="comment-new" placeholder="Write a comment" value={comment} onChange={(e) => setComment(e.target.value)} />
              <button className="btn btn-quiet" type="submit">Post</button>
            </form>
          </section>
        </div>

        <footer className="drawer-foot">
          <button
            className="btn btn-quiet danger"
            onClick={() => {
              dispatch({ type: 'deleteTask', id: task.id });
              onClose();
            }}
          >
            <Icon name="trash" size={15} /> Delete task
          </button>
        </footer>
      </aside>
    </div>
  );
}
