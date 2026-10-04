import { useEffect, useState } from 'react';
import { MEMBERS, HEALTH_LABEL, PRIORITIES } from '../data.js';

const PATHS = {
  overview: 'M3 3h8v8H3z M13 3h8v5h-8z M13 10h8v11h-8z M3 13h8v8H3z',
  projects: 'M3 6h7l2 2h9v12H3z',
  tasks: 'M4 4h16v16H4z M8 12l3 3 5-6',
  team: 'M9 11a3 3 0 100-6 3 3 0 000 6z M3 20v-2a4 4 0 014-4h4a4 4 0 014 4v2 M17 5a3 3 0 010 6 M21 20v-2a4 4 0 00-3-3.9',
  search: 'M11 4a7 7 0 100 14 7 7 0 000-14z M20 20l-4-4',
  plus: 'M12 4v16 M4 12h16',
  clock: 'M12 3a9 9 0 100 18 9 9 0 000-18z M12 7v5l3 2',
  close: 'M5 5l14 14 M19 5L5 19',
  arrow: 'M5 12h14 M13 6l6 6-6 6',
  play: 'M7 4l13 8-13 8z',
  stop: 'M6 6h12v12H6z',
  trash: 'M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13',
  board: 'M3 4h5v16H3z M10 4h5v10h-5z M17 4h4v13h-4z',
  list: 'M4 6h16 M4 12h16 M4 18h16',
  timeline: 'M3 6h9 M8 12h12 M5 18h8',
};

export function Icon({ name, size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="square" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}

export const memberOf = (id) => MEMBERS.find((m) => m.id === id);

export function Avatar({ id, size = 28, title }) {
  const m = memberOf(id);
  if (!m) return null;
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.38 }} title={title || m.name}>
      {m.initials}
    </span>
  );
}

export function HealthPill({ health }) {
  return <span className={`pill pill-${health}`}>{HEALTH_LABEL[health]}</span>;
}

export function PriorityTag({ priority }) {
  const label = PRIORITIES.find((p) => p.id === priority)?.label ?? priority;
  return <span className={`prio prio-${priority}`}>{label}</span>;
}

export function Progress({ value, label }) {
  const pct = Math.round(value * 100);
  return (
    <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label || 'Progress'}>
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

export function useNow(active) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return undefined;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
