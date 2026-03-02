const SERVERS = [
  { name: 'api-prod-01', ip: '10.0.1.12', region: 'US-East', cpu: 42, mem: 68, disk: 55, status: 'up', uptime: '45d 12h', lastCheck: '30s ago' },
  { name: 'api-prod-02', ip: '10.0.1.13', region: 'US-East', cpu: 38, mem: 61, disk: 48, status: 'up', uptime: '45d 12h', lastCheck: '30s ago' },
  { name: 'db-primary', ip: '10.0.2.5', region: 'US-East', cpu: 71, mem: 82, disk: 67, status: 'warn', uptime: '12d 8h', lastCheck: '15s ago' },
  { name: 'db-replica', ip: '10.0.2.6', region: 'US-East', cpu: 35, mem: 54, disk: 67, status: 'up', uptime: '12d 8h', lastCheck: '15s ago' },
  { name: 'worker-01', ip: '10.0.3.8', region: 'EU-West', cpu: 25, mem: 44, disk: 31, status: 'up', uptime: '30d 5h', lastCheck: '1m ago' },
  { name: 'worker-02', ip: '10.0.3.9', region: 'EU-West', cpu: 22, mem: 38, disk: 28, status: 'up', uptime: '30d 5h', lastCheck: '1m ago' },
  { name: 'cdn-edge-sg', ip: '10.0.4.2', region: 'AP-South', cpu: 12, mem: 28, disk: 19, status: 'up', uptime: '60d 0h', lastCheck: '45s ago' },
  { name: 'cdn-edge-eu', ip: '10.0.4.3', region: 'EU-West', cpu: 15, mem: 32, disk: 22, status: 'up', uptime: '58d 4h', lastCheck: '45s ago' },
  { name: 'mail-01', ip: '10.0.5.2', region: 'US-East', cpu: 8, mem: 22, disk: 14, status: 'up', uptime: '90d 1h', lastCheck: '2m ago' },
  { name: 'cache-redis', ip: '10.0.6.1', region: 'US-East', cpu: 18, mem: 45, disk: 12, status: 'up', uptime: '45d 12h', lastCheck: '10s ago' },
];

function barColor(v) {
  if (v > 80) return '#EF4444';
  if (v > 60) return '#F59E0B';
  return '#22C55E';
}

function ledCls(s) {
  if (s === 'warn') return 'led-warn';
  if (s === 'down') return 'led-dn';
  return 'led-up';
}

function badgeCls(s) {
  if (s === 'warn') return 'ub-warn';
  if (s === 'down') return 'ub-dn';
  return 'ub-up';
}

function badgeLabel(s) {
  if (s === 'warn') return 'Warning';
  if (s === 'down') return 'Down';
  return 'Healthy';
}

export default function ServersPage() {
  return (
    <div style={{ padding: '20px 24px 40px' }}>
      <div className="panel">
        <div className="ph">
          <div>
            <div className="ph-title">Server Infrastructure</div>
            <div className="ph-sub">{SERVERS.length} servers across 3 regions</div>
          </div>
        </div>
        <table className="bigtbl">
          <thead>
            <tr>
              <th>Server</th>
              <th>Region</th>
              <th>CPU</th>
              <th>Memory</th>
              <th>Disk</th>
              <th>Status</th>
              <th>Uptime</th>
              <th>Last Check</th>
            </tr>
          </thead>
          <tbody>
            {SERVERS.map((s) => (
              <tr key={s.name}>
                <td>
                  <div className="srv-cell">
                    <span className={`srv-led ${ledCls(s.status)}`} />
                    <div>
                      <div className="srv-name">{s.name}</div>
                      <div className="srv-ip">{s.ip}</div>
                    </div>
                  </div>
                </td>
                <td style={{ fontSize: 11, color: 'var(--muted)' }}>{s.region}</td>
                <td>
                  <div className="mbar">
                    <div className="mfill" style={{ width: s.cpu + '%', background: barColor(s.cpu) }} />
                  </div>{' '}
                  <span style={{ fontSize: 10, fontWeight: 600 }}>{s.cpu}%</span>
                </td>
                <td>
                  <div className="mbar">
                    <div className="mfill" style={{ width: s.mem + '%', background: barColor(s.mem) }} />
                  </div>{' '}
                  <span style={{ fontSize: 10, fontWeight: 600 }}>{s.mem}%</span>
                </td>
                <td>
                  <div className="mbar">
                    <div className="mfill" style={{ width: s.disk + '%', background: barColor(s.disk) }} />
                  </div>{' '}
                  <span style={{ fontSize: 10, fontWeight: 600 }}>{s.disk}%</span>
                </td>
                <td>
                  <span className={`ubadge ${badgeCls(s.status)}`}>{badgeLabel(s.status)}</span>
                </td>
                <td style={{ fontSize: 11, color: 'var(--muted)' }}>{s.uptime}</td>
                <td style={{ fontSize: 11, color: 'var(--dim)' }}>{s.lastCheck}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
