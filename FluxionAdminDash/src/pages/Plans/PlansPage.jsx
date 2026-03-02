const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/mo',
    accent: '#94A3B8',
    orgs: 2,
    limits: { Users: '15 / org', Assets: '500', Storage: '1 GB', 'API Calls': '10k/day', Support: 'Community' },
    stats: { active: 2, revenue: '$0' },
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/user/mo',
    accent: '#3B72F6',
    orgs: 5,
    limits: { Users: '50 / org', Assets: '5,000', Storage: '25 GB', 'API Calls': '100k/day', Support: 'Priority' },
    stats: { active: 5, revenue: '$8,400' },
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    accent: '#7C3AED',
    orgs: 2,
    limits: { Users: 'Unlimited', Assets: 'Unlimited', Storage: '500 GB', 'API Calls': 'Unlimited', Support: 'Dedicated' },
    stats: { active: 2, revenue: '$3,200' },
  },
];

export default function PlansPage() {
  return (
    <div style={{ padding: '20px 24px 40px' }}>
      <div className="plans-grid">
        {plans.map((p, i) => (
          <div className={`plan-card d${i + 1}`} key={p.name}>
            <div className="plan-top">
              <div className="plan-accent" style={{ background: p.accent }} />
              <div className="plan-name">{p.name}</div>
              <div className="plan-price">
                {p.price}
                {p.period && <span> {p.period}</span>}
              </div>
              <div className="plan-orgs-txt">{p.orgs} organisations on this plan</div>
            </div>
            <div className="plan-limits">
              {Object.entries(p.limits).map(([k, v]) => (
                <div className="pl-row" key={k}>
                  <span className="pl-key">{k}</span>
                  <span className="pl-val">{v}</span>
                </div>
              ))}
            </div>
            <div className="plan-stats">
              <div className="plan-stat">
                <div className="ps-val">{p.stats.active}</div>
                <div className="ps-lbl">Active Orgs</div>
              </div>
              <div className="plan-stat">
                <div className="ps-val">{p.stats.revenue}</div>
                <div className="ps-lbl">Monthly Rev</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
