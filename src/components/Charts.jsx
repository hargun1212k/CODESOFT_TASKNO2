import { useState } from 'react';
import { fmtDate } from '../data.js';

// Tasks finished per week. One series, so no legend; the title names it.
// Past weeks are ink, the current week is red. Hover or focus a bar for the exact count.
export function WeeklyBars({ data }) {
  const [hover, setHover] = useState(null);
  const W = 520;
  const H = 270;
  const m = { l: 30, r: 8, t: 14, b: 30 };
  const max = Math.max(4, ...data.map((d) => d.count));
  const top = max % 2 === 0 ? max : max + 1;
  const iw = W - m.l - m.r;
  const ih = H - m.t - m.b;
  const step = iw / data.length;
  const bw = Math.min(26, step * 0.5);
  const y = (v) => m.t + ih - (v / top) * ih;
  const ticks = [0, top / 2, top];

  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Tasks completed per week over the last eight weeks">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={m.l} x2={W - m.r} y1={y(t)} y2={y(t)} className={t === 0 ? 'ax' : 'grid'} />
            <text x={m.l - 8} y={y(t) + 4} textAnchor="end" className="tick">{t}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = m.l + step * i + (step - bw) / 2;
          const h = ih - (y(d.count) - m.t);
          return (
            <g key={d.from}>
              <rect x={m.l + step * i} y={m.t} width={step} height={ih} fill="transparent" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
              {d.count > 0 && (
                <rect
                  x={x}
                  y={y(d.count)}
                  width={bw}
                  height={h}
                  className={d.current ? 'bar-now' : 'bar'}
                  opacity={hover === null || hover === i ? 1 : 0.45}
                  pointerEvents="none"
                />
              )}
              {(d.current || d.count === max) && d.count > 0 && (
                <text x={x + bw / 2} y={y(d.count) - 6} textAnchor="middle" className="val">{d.count}</text>
              )}
              <text x={m.l + step * i + step / 2} y={H - 10} textAnchor="middle" className="tick">{d.label}</text>
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div className="tip" style={{ left: `${((m.l + step * hover + step / 2) / W) * 100}%` }}>
          <strong>{data[hover].count} {data[hover].count === 1 ? 'task' : 'tasks'}</strong>
          <span>{data[hover].label} to {fmtDate(data[hover].to)}</span>
        </div>
      )}
      <table className="sr-only">
        <caption>Tasks completed per week</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.from}><th>Week of {d.label}</th><td>{d.count}</td></tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

// Open work per person, with the overdue share in red.
export function WorkloadBars({ rows, onPick }) {
  const max = Math.max(1, ...rows.map((r) => r.open));
  return (
    <ul className="workload">
      {rows.map((r) => (
        <li key={r.member.id}>
          <button className="wl-name" onClick={() => onPick(r.member.id)}>
            <span>{r.member.name}</span>
            <span className="muted small">{r.member.role}</span>
          </button>
          <div className="wl-track" aria-hidden="true">
            <span className="wl-open" style={{ width: `${((r.open - r.overdue) / max) * 100}%` }} />
            {r.overdue > 0 && <span className="wl-late" style={{ width: `${(r.overdue / max) * 100}%` }} />}
          </div>
          <span className="tnum wl-n">
            {r.open}
            {r.overdue > 0 && <em> / {r.overdue} late</em>}
          </span>
        </li>
      ))}
    </ul>
  );
}
