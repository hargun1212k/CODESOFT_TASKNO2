import { useState } from 'react';
import { Avatar, Icon, PriorityTag } from './ui.jsx';
import { dueLabel, isOverdue, STATUSES } from '../data.js';

export default function TaskCard({ task, onOpen, onMove, tracking }) {
  const [dragging, setDragging] = useState(false);
  const subDone = task.subtasks.filter((s) => s.done).length;
  const overdue = isOverdue(task);
  const next = STATUSES[STATUSES.findIndex((s) => s.id === task.status) + 1];

  return (
    <article
      className={`task prio-bar-${task.priority} ${dragging ? 'dragging' : ''}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.effectAllowed = 'move';
        setDragging(true);
      }}
      onDragEnd={() => setDragging(false)}
      onClick={() => onOpen(task.id)}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(task.id)}
    >
      <div className="task-top">
        <PriorityTag priority={task.priority} />
        {tracking && <span className="rec" title="Timer running">Tracking</span>}
      </div>
      <h4>{task.title}</h4>
      {task.labels.length > 0 && (
        <div className="labels">
          {task.labels.map((l) => (
            <span key={l} className="label">{l}</span>
          ))}
        </div>
      )}
      <div className="task-foot">
        <span className={`due ${overdue ? 'late' : ''}`}>{dueLabel(task)}</span>
        {task.subtasks.length > 0 && (
          <span className="muted small tnum">{subDone}/{task.subtasks.length}</span>
        )}
        <span className="grow" />
        <Avatar id={task.assignee} size={24} />
        {next && (
          <button
            className="icon-btn mini"
            title={`Move to ${next.label}`}
            aria-label={`Move to ${next.label}`}
            onClick={(e) => {
              e.stopPropagation();
              onMove(task.id, next.id);
            }}
          >
            <Icon name="arrow" size={14} />
          </button>
        )}
      </div>
    </article>
  );
}
