import { useState } from 'react';

const LOGS = [
  { level: 'ERR', time: '14:23:01', svc: 'AuthSvc', msg: 'Failed login attempt from IP 203.0.113.42 — account locked', org: 'Acme Corp' },
  { level: 'WARN', time: '14:21:45', svc: 'StorageSvc', msg: 'Storage usage exceeds 75% threshold — consider cleanup', org: 'BuildRight' },
  { level: 'INFO', time: '14:20:12', svc: 'BillingSvc', msg: 'Subscription upgraded: Free → Pro plan', org: 'TechStart' },
  { level: 'OK', time: '14:18:30', svc: 'APISvc', msg: 'SSL certificate auto-renewed successfully', org: 'System' },
  { level: 'ERR', time: '14:15:22', svc: 'DBSvc', msg: 'Query timeout exceeded 30s — connection pool exhausted', org: 'Quantum Labs' },
  { level: 'WARN', time: '14:12:10', svc: 'AuthSvc', msg: 'Password reset requested — email sent to user', org: 'DataFlow' },
  { level: 'INFO', time: '14:10:55', svc: 'AssetSvc', msg: '12 new assets imported via CSV bulk upload', org: 'Acme Corp' },
  { level: 'OK', time: '14:08:33', svc: 'MonitorSvc', msg: 'Health check passed — all services operational', org: 'System' },
  { level: 'WARN', time: '14:05:18', svc: 'APISvc', msg: 'Rate limit approaching for client app key ****3f2a', org: 'CloudNine' },
  { level: 'INFO', time: '14:01:42', svc: 'OrgSvc', msg: 'New organisation created: SolarEdge Inc', org: 'SolarEdge' },
];

const levelFilters = ['All', 'ERR', 'WARN', 'INFO', 'OK'];
const badgeCls = { ERR: 'lb-err', WARN: 'lb-warn', INFO: 'lb-info', OK: 'lb-ok' };

export default function LogsPage() {
  const [filter, setFilter] = useState('All');

  const filtered = filter === 'All' ? LOGS : LOGS.filter((l) => l.level === filter);

  return (
    <div style={{ padding: '20px 24px 40px' }}>
      <div className="filter-row">
        {levelFilters.map((f) => (
          <button key={f} className={`fpill${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
            {f}{f !== 'All' && ` (${LOGS.filter((l) => l.level === f).length})`}
          </button>
        ))}
        <div className="fspacer" />
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)' }}>{filtered.length} entries</span>
      </div>

      <div className="log-wrap">
        {filtered.map((l, i) => (
          <div className="log-row" key={i}>
            <div className="log-lv">
              <span className={`lbadge ${badgeCls[l.level]}`}>{l.level}</span>
            </div>
            <div className="log-time">{l.time}</div>
            <div className="log-svc">{l.svc}</div>
            <div className="log-msg">{l.msg}</div>
            <div className="log-org">{l.org}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
