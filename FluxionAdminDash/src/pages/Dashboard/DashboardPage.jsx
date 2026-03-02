import { useEffect, useRef } from 'react';

const stats = [
  { icon: '\u{1F3E2}', label: 'Total Orgs', val: 48, sub: '12 active this week', delta: '+3', cls: 'cd-up', acc: 'acc-blue' },
  { icon: '\u{1F465}', label: 'Total Users', val: 1284, sub: '89 online now', delta: '+12%', cls: 'cd-up', acc: 'acc-green' },
  { icon: '\u{1F4E6}', label: 'Assets', val: 5721, sub: '340 added today', delta: '+8%', cls: 'cd-up', acc: 'acc-amber' },
  { icon: '\u{1F3AB}', label: 'Open Tickets', val: 23, sub: '5 critical', delta: '-5%', cls: 'cd-dn', acc: 'acc-red' },
  { icon: '\u{1F4B0}', label: 'MRR', val: 12480, sub: 'vs $11,200 prev', delta: '+11%', cls: 'cd-up', acc: 'acc-indigo', prefix: '$' },
  { icon: '\u{2705}', label: 'Uptime', val: 99.97, sub: 'Last 30 days', delta: 'OK', cls: 'cd-ok', acc: 'acc-teal', suffix: '%' },
  { icon: '\u{26A1}', label: 'API Calls', val: 2.4, sub: 'Avg 82k/day', delta: '+18%', cls: 'cd-up', acc: 'acc-sky', suffix: 'M' },
  { icon: '\u{1F4C2}', label: 'Storage', val: 1.8, sub: '78% of 2.3 TB', delta: '78%', cls: 'cd-warn', acc: 'acc-orange', suffix: 'TB' },
  { icon: '\u{1F512}', label: 'Failed Logins', val: 14, sub: 'Last 24 h', delta: '14', cls: 'cd-info', acc: 'acc-violet' },
];

const servers = [
  { name: 'api-prod-01', ip: '10.0.1.12', region: 'US-East', cpu: 42, mem: 68, disk: 55, status: 'up', uptime: '45d 12h' },
  { name: 'api-prod-02', ip: '10.0.1.13', region: 'US-East', cpu: 38, mem: 61, disk: 48, status: 'up', uptime: '45d 12h' },
  { name: 'db-primary', ip: '10.0.2.5', region: 'US-East', cpu: 71, mem: 82, disk: 67, status: 'warn', uptime: '12d 8h' },
  { name: 'worker-01', ip: '10.0.3.8', region: 'EU-West', cpu: 25, mem: 44, disk: 31, status: 'up', uptime: '30d 5h' },
  { name: 'cdn-edge-sg', ip: '10.0.4.2', region: 'AP-South', cpu: 12, mem: 28, disk: 19, status: 'up', uptime: '60d 0h' },
];

const alerts = [
  { title: 'Database CPU spike detected', sub: 'db-primary - 2 min ago', sev: 'crit' },
  { title: 'Storage usage above 75%', sub: 'All regions - 15 min ago', sev: 'warn' },
  { title: 'SSL certificate renewing', sub: 'api-prod-01 - 1 hr ago', sev: 'info' },
  { title: '3 failed login attempts', sub: 'IP 203.0.113.42 - 30 min ago', sev: 'warn' },
];

const activities = [
  { icon: '\u{1F3E2}', bg: '#EFF6FF', text: '<strong>Acme Corp</strong> upgraded to <strong>Pro</strong> plan', time: '2 min ago', lv: 'ok' },
  { icon: '\u{1F464}', bg: '#F0FDF4', text: '<strong>Sarah Chen</strong> added 12 new assets', time: '15 min ago', lv: 'info' },
  { icon: '\u{26A0}\u{FE0F}', bg: '#FEF3C7', text: 'Server <strong>db-primary</strong> CPU at 71%', time: '22 min ago', lv: 'warn' },
  { icon: '\u{1F512}', bg: '#FEE2E2', text: '3 failed login attempts from <strong>203.0.113.42</strong>', time: '30 min ago', lv: 'crit' },
  { icon: '\u{2705}', bg: '#F0FDF4', text: 'SSL certificate auto-renewed for <strong>api-prod-01</strong>', time: '1 hr ago', lv: 'ok' },
];

const orgsOverview = [
  { name: 'Acme Corp', slug: 'acme-corp', plan: 'Pro', users: 45, assets: 1230, color: '#3B72F6' },
  { name: 'TechStart', slug: 'techstart', plan: 'Free', users: 12, assets: 340, color: '#16A34A' },
  { name: 'BuildRight', slug: 'buildright', plan: 'Enterprise', users: 89, assets: 2100, color: '#7C3AED' },
  { name: 'DataFlow', slug: 'dataflow', plan: 'Pro', users: 34, assets: 890, color: '#D97706' },
  { name: 'CloudNine', slug: 'cloudnine', plan: 'Pro', users: 28, assets: 650, color: '#DC2626' },
];

const revenue = [
  { name: 'Pro Plans', val: 8400, pct: 67, color: '#3B72F6' },
  { name: 'Enterprise', val: 3200, pct: 26, color: '#7C3AED' },
  { name: 'Add-ons', val: 880, pct: 7, color: '#16A34A' },
];

const barData = [
  { lbl: 'Jan', h: 30 }, { lbl: 'Feb', h: 45 }, { lbl: 'Mar', h: 38 },
  { lbl: 'Apr', h: 52 }, { lbl: 'May', h: 60 }, { lbl: 'Jun', h: 48 },
  { lbl: 'Jul', h: 70 }, { lbl: 'Aug', h: 65 }, { lbl: 'Sep', h: 80 },
  { lbl: 'Oct', h: 72 }, { lbl: 'Nov', h: 85 }, { lbl: 'Dec', h: 90 },
];

function mbarColor(v) {
  if (v > 80) return '#EF4444';
  if (v > 60) return '#F59E0B';
  return '#22C55E';
}

function AnimVal({ val, prefix = '', suffix = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    let start = 0;
    const end = val;
    const dur = 1200;
    const t0 = performance.now();
    const isFloat = !Number.isInteger(end);
    function step(now) {
      const p = Math.min((now - t0) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      start = ease * end;
      if (ref.current) {
        ref.current.textContent =
          prefix + (isFloat ? start.toFixed(2) : Math.round(start).toLocaleString()) + suffix;
      }
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [val, prefix, suffix]);
  return <span ref={ref}>{prefix}{val}{suffix}</span>;
}

function srvLedClass(status) {
  return 'srv-led led-' + (status === 'warn' ? 'warn' : 'up');
}

function ubadgeClass(status) {
  return 'ubadge ' + (status === 'warn' ? 'ub-warn' : 'ub-up');
}

function planTagClass(plan) {
  if (plan === 'Pro') return 'plan-tag pt-pro';
  if (plan === 'Enterprise') return 'plan-tag pt-ent';
  return 'plan-tag pt-free';
}

export default function DashboardPage() {
  return (
    <>
      <div className="stats-strip">
        {stats.map((s, i) => (
          <div className={'strip-cell ' + s.acc} key={i}>
            <div className="cell-top">
              <span className="cell-icon">{s.icon}</span>
              <span className={'cell-delta ' + s.cls}>{s.delta}</span>
            </div>
            <div className="cell-val">
              <AnimVal val={s.val} prefix={s.prefix || ''} suffix={s.suffix || ''} />
            </div>
            <div className="cell-label">{s.label}</div>
            <div className="cell-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="pad">
        <div className="two-col">
          <div className="panel d1">
            <div className="ph">
              <div>
                <div className="ph-title">Server Infrastructure</div>
                <div className="ph-sub">5 servers across 3 regions</div>
              </div>
              <button className="ph-btn">View All</button>
            </div>
            <table className="stbl">
              <thead>
                <tr><th>Server</th><th>Region</th><th>CPU</th><th>Memory</th><th>Disk</th><th>Status</th><th>Uptime</th></tr>
              </thead>
              <tbody>
                {servers.map((s) => (
                  <tr key={s.name}>
                    <td>
                      <div className="srv-cell">
                        <span className={srvLedClass(s.status)} />
                        <div>
                          <div className="srv-name">{s.name}</div>
                          <div className="srv-ip">{s.ip}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 11, color: 'var(--muted)' }}>{s.region}</td>
                    <td><div className="mbar"><div className="mfill" style={{ width: s.cpu + '%', background: mbarColor(s.cpu) }} /></div> <span style={{ fontSize: 10, fontWeight: 600 }}>{s.cpu}%</span></td>
                    <td><div className="mbar"><div className="mfill" style={{ width: s.mem + '%', background: mbarColor(s.mem) }} /></div> <span style={{ fontSize: 10, fontWeight: 600 }}>{s.mem}%</span></td>
                    <td><div className="mbar"><div className="mfill" style={{ width: s.disk + '%', background: mbarColor(s.disk) }} /></div> <span style={{ fontSize: 10, fontWeight: 600 }}>{s.disk}%</span></td>
                    <td><span className={ubadgeClass(s.status)}>{s.status === 'warn' ? 'Warning' : 'Healthy'}</span></td>
                    <td style={{ fontSize: 11, color: 'var(--muted)' }}>{s.uptime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel d2">
            <div className="ph">
              <div>
                <div className="ph-title">Active Alerts</div>
                <div className="ph-sub">{alerts.length} alerts</div>
              </div>
              <button className="ph-btn">View All</button>
            </div>
            {alerts.map((a, i) => {
              const sevColor = a.sev === 'crit' ? '#EF4444' : a.sev === 'warn' ? '#F59E0B' : '#3B82F6';
              return (
                <div className="alert-row" key={i}>
                  <div className="asev" style={{ background: sevColor }} />
                  <div style={{ flex: 1 }}>
                    <div className="alert-title">{a.title}</div>
                    <div className="alert-sub">{a.sub}</div>
                  </div>
                  <span className={'abadge ab-' + a.sev}>{a.sev.toUpperCase()}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="three-col">
          <div className="panel d3">
            <div className="ph">
              <div><div className="ph-title">Recent Activity</div></div>
              <button className="ph-btn">View All</button>
            </div>
            {activities.map((a, i) => (
              <div className="act-row" key={i}>
                <div className="act-ico" style={{ background: a.bg }}>{a.icon}</div>
                <div style={{ flex: 1 }}>
                  <div className="act-text" dangerouslySetInnerHTML={{ __html: a.text }} />
                  <div className="act-time">
                    {a.time}
                    <span className={'alv lv-' + a.lv}>{a.lv.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="panel d4">
            <div className="ph">
              <div><div className="ph-title">Org Overview</div></div>
              <button className="ph-btn">View All</button>
            </div>
            <table className="otbl">
              <thead><tr><th>Organisation</th><th>Plan</th><th>Users</th><th>Assets</th></tr></thead>
              <tbody>
                {orgsOverview.map((o) => (
                  <tr key={o.slug}>
                    <td>
                      <div className="org-cell">
                        <div className="org-av" style={{ background: o.color }}>{o.name[0]}</div>
                        <div><div className="org-name">{o.name}</div><div className="org-slug">{o.slug}</div></div>
                      </div>
                    </td>
                    <td><span className={planTagClass(o.plan)}>{o.plan}</span></td>
                    <td style={{ fontWeight: 600, fontSize: 12 }}>{o.users}</td>
                    <td style={{ fontWeight: 600, fontSize: 12 }}>{o.assets.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel d5">
            <div className="ph">
              <div>
                <div className="ph-title">Revenue Breakdown</div>
                <div className="ph-sub">$12,480/mo total</div>
              </div>
            </div>
            <div style={{ padding: '16px 18px 8px' }}>
              <div className="bar-chart">
                {barData.map((b, i) => (
                  <div className="bc-col" key={i}>
                    <div className="bc-bar" style={{ height: b.h + '%', background: i === barData.length - 1 ? '#3B72F6' : '#E2E8F0' }} />
                    <span className="bc-lbl">{b.lbl}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rev-list">
              {revenue.map((r, i) => (
                <div className="rev-row" key={i}>
                  <div className="rev-dot" style={{ background: r.color }} />
                  <div className="rev-name">{r.name}</div>
                  <div className="rev-track"><div className="rev-fill" style={{ width: r.pct + '%', background: r.color }} /></div>
                  <div className="rev-val">{'$' + r.val.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}