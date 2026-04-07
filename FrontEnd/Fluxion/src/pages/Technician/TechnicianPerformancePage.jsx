import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getTechnicianPerformance } from '../../services/technicianService';
import './Technician.css';

/* ── AnimVal ─────────────────────────────────────────────── */
function AnimVal({ val, prefix = '', suffix = '', decimals = 0 }) {
  const ref = useRef(null);
  useEffect(() => {
    let frame;
    const dur = 1000, t0 = performance.now(), end = Number(val) || 0;
    function step(now) {
      const p = Math.min((now - t0) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      if (ref.current) ref.current.textContent = prefix + (ease * end).toFixed(decimals) + suffix;
      if (p < 1) frame = requestAnimationFrame(step);
    }
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [val, prefix, suffix, decimals]);
  return <span ref={ref}>{prefix}0{suffix}</span>;
}

/* ████████████████████████████████████████████████████████████ */
export default function TechnicianPerformancePage() {
  const [perf, setPerf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getTechnicianPerformance()
      .then(d => { if (!cancelled) setPerf(d); })
      .catch(() => { if (!cancelled) setError('Failed to load performance data.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const cards = [
    {
      label:    'Total Tickets Resolved',
      val:      perf?.totalResolved ?? 0,
      icon:     '🏆',
      color:    'green',
      sub:      'all time',
      prefix:   '',
      suffix:   '',
      decimals: 0,
    },
    {
      label:    'Resolved This Month',
      val:      perf?.resolvedThisMonth ?? 0,
      icon:     '📅',
      color:    'blue',
      sub:      'current calendar month',
      prefix:   '',
      suffix:   '',
      decimals: 0,
    },
    {
      label:    'Avg. Resolution Time',
      val:      perf?.avgResolutionHours ?? 0,
      icon:     '⏱',
      color:    'amber',
      sub:      'hours per ticket',
      prefix:   '',
      suffix:   'h',
      decimals: 1,
    },
    {
      label:    'Total Repair Cost Logged',
      val:      perf?.totalRepairCost ?? 0,
      icon:     '💰',
      color:    'rust',
      sub:      'across all tickets',
      prefix:   '$',
      suffix:   '',
      decimals: 2,
    },
  ];

  return (
    <div className="tc-page">
      <div className="tc-header">
        <div>
          <div className="tc-eyebrow">Technician Portal</div>
          <h1 className="tc-title">My Performance</h1>
          <p className="tc-subtitle">A summary of your maintenance track record and efficiency metrics.</p>
        </div>
        <Link to="/technician/dashboard" className="tc-btn tc-btn-secondary">
          ← Back to Dashboard
        </Link>
      </div>

      {error && <div className="tc-toast tc-toast-error">⚠ {error}</div>}

      {/* Stats cards */}
      <div className="tc-kpi-grid">
        {cards.map((c, i) => (
          <div className="tc-kpi" key={i} style={{ animationDelay: `${0.05 + i * 0.07}s` }}>
            <div className={`tc-kpi-icon ${c.color}`} style={{ fontSize: 22 }}>{c.icon}</div>
            <div style={{ flex: 1 }}>
              <div className="tc-kpi-lbl">{c.label}</div>
              <div className="tc-kpi-val" style={{ fontSize: 30 }}>
                {loading ? '—' : <AnimVal val={c.val} prefix={c.prefix} suffix={c.suffix} decimals={c.decimals} />}
              </div>
              <div style={{ fontSize: 11, color: 'var(--tc-dim)', marginTop: 2 }}>{c.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tips panel */}
      <div className="tc-panel">
        <div className="tc-panel-head">
          <span className="tc-panel-title">Performance Tips</span>
        </div>
        <div className="tc-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            '✅ Always update ticket status promptly so the team stays informed.',
            '📝 Log detailed repair descriptions for future asset history reference.',
            '⏱ Faster resolution times improve overall SLA compliance.',
            '💬 Use comments to communicate blockers or progress updates.',
          ].map((tip, i) => (
            <div key={i} style={{ fontSize: 13, color: 'var(--tc-muted)', padding: '8px 0', borderBottom: i < 3 ? '1px solid var(--tc-border)' : 'none' }}>
              {tip}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
