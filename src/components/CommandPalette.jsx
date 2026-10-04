import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../store.jsx';
import { Icon } from './ui.jsx';

// Cmd/Ctrl+K: jump to any view, project or task, or start something new.
export default function CommandPalette({ onClose, go, openTask, newProject }) {
  const { state } = useStore();
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const input = useRef(null);

  useEffect(() => input.current?.focus(), []);

  const items = useMemo(() => {
    const nav = [
      { group: 'Go to', label: 'Overview', run: () => go({ name: 'overview' }) },
      { group: 'Go to', label: 'Projects', run: () => go({ name: 'projects' }) },
      { group: 'Go to', label: 'My tasks', run: () => go({ name: 'mine' }) },
      { group: 'Go to', label: 'Team', run: () => go({ name: 'team' }) },
      { group: 'Create', label: 'New project', run: newProject },
    ];
    const projects = state.projects.map((p) => ({
      group: 'Projects',
      label: p.name,
      hint: p.client,
      run: () => go({ name: 'project', id: p.id }),
    }));
    const tasks = state.tasks.map((t) => ({
      group: 'Tasks',
      label: t.title,
      hint: state.projects.find((p) => p.id === t.projectId)?.name,
      run: () => openTask(t.id),
    }));
    return [...nav, ...projects, ...tasks];
  }, [state.projects, state.tasks, go, openTask, newProject]);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = s ? items.filter((i) => `${i.label} ${i.hint || ''}`.toLowerCase().includes(s)) : items.slice(0, 9);
    return list.slice(0, 10);
  }, [items, q]);

  useEffect(() => setActive(0), [q]);

  const choose = (item) => {
    onClose();
    item?.run();
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(results.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(results[active]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="overlay palette-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Command palette">
        <div className="palette-input">
          <Icon name="search" />
          <input
            id="palette-q"
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search projects and tasks, or jump anywhere"
            aria-label="Search"
          />
          <kbd>Esc</kbd>
        </div>
        <ul role="listbox">
          {results.map((r, i) => (
            <li
              key={`${r.group}-${r.label}-${i}`}
              role="option"
              aria-selected={i === active}
              className={i === active ? 'active' : ''}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(r)}
            >
              <span className="eyebrow">{r.group}</span>
              <span className="pl">{r.label}</span>
              {r.hint && <span className="muted small ph">{r.hint}</span>}
            </li>
          ))}
          {results.length === 0 && <li className="muted empty-row">Nothing matches "{q}".</li>}
        </ul>
      </div>
    </div>
  );
}
