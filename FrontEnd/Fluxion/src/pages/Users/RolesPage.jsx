import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getUsers } from '../../services/api';
import './RolesPage.css';

/* ── SVG Icons ───────────────────────────────────────────────── */
const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
  </svg>
);
const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const ROLE_METADATA = [
  {
    id: 'admin',
    name: 'Administrator / Owner',
    description: 'The highest level of access. Responsible for overall account management, billing, and day-to-day operations.',
    color: '#6366f1',
    isCombined: true,
    capabilityIds: ['owner', 'admin'],
    capabilities: [
      'Full administrative control over all resources',
      'Manage billing, subscriptions, and settings',
      'Complete user and role management',
      'Full control over asset registry and tracking',
      'Access sensitive financial insights'
    ],
    canDo: [
      'Update organization profile and branding',
      'Invite, edit, and deactivate any user account',
      'Register new assets and configure departments',
      'Oversee all maintenance tickets and logs',
      'Override any system-wide constraints'
    ]
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Departmental lead responsible for team assets and operational uptime.',
    color: '#f59e0b',
    capabilities: [
      'Visibility into department-specific assets',
      'Team resource allocation and oversight',
      'Direct ticket raising and priority management'
    ],
    canDo: [
      'Request new assets for the department',
      'Reassign assets within their own team',
      'Raise tickets for any managed asset',
      'Review team productivity and asset health'
    ]
  },
  {
    id: 'technician',
    name: 'Maintenance Technician',
    description: 'Specialized role focused on repair, maintenance, and asset longevity.',
    color: '#10b981',
    capabilities: [
      'Full access to technical maintenance logs',
      'Update asset physical condition and status',
      'Manage assigned repair workflows'
    ],
    canDo: [
      'Update maintenance ticket status and notes',
      'Log replacement parts and labor costs',
      'Perform asset condition audits',
      'Receive instant alerts for critical issues'
    ]
  },
  {
    id: 'user',
    name: 'Standard User / Employee',
    description: 'The end-user focused on utilizing assigned resources effectively.',
    color: '#64748b',
    capabilities: [
      'View personal dashboard and assigned tools',
      'Native issue reporting for personal assets',
      'Personalized notification alerts'
    ],
    canDo: [
      'Acknowledge receipt of assigned assets',
      'Report broken or malfunctioning equipment',
      'Track the status of their raised tickets',
      'Update basic personal profile details'
    ]
  }
];

export default function RolesPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeRoleId, setActiveRoleId] = useState('admin');

  useEffect(() => {
    if (currentUser?.orgId) {
      getUsers(currentUser.orgId)
        .then(data => {
          setUsers(data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch users", err);
          setLoading(false);
        });
    }
  }, [currentUser]);

  const activeRole = ROLE_METADATA.find(r => r.id === activeRoleId);
  const usersInActiveRole = users.filter(u => {
    const roleLower = u.role?.toLowerCase();
    if (activeRole.isCombined) {
      return activeRole.capabilityIds.includes(roleLower);
    }
    return roleLower === activeRoleId.toLowerCase();
  });

  return (
    <div className="page up-page rl-page">
      {/* ── Header ── */}
      <div className="rl-header">
        <div className="rl-header-eyebrow">Access Control</div>
        <h1 className="rl-header-title">Roles & Permissions</h1>
        <p className="rl-header-subtitle">Define what users can see and do within your organization.</p>
      </div>

      <div className="rl-grid">
        {/* ── Sidebar Selector ── */}
        <aside className="rl-sidebar">
          <div className="rl-sidebar-label">Organization Roles</div>
          {ROLE_METADATA.map(role => (
            <button 
              key={role.id}
              className={`rl-tab ${activeRoleId === role.id ? 'active' : ''}`}
              onClick={() => setActiveRoleId(role.id)}
            >
              <div className="rl-tab-indicator" style={{ backgroundColor: role.color }} />
              <span className="rl-tab-name">{role.name}</span>
              <span className="rl-tab-count">
                {users.filter(u => {
                  const r = u.role?.toLowerCase();
                  return role.isCombined ? role.capabilityIds.includes(r) : r === role.id;
                }).length}
              </span>
            </button>
          ))}
        </aside>

        {/* ── Main Content ── */}
        <main className="rl-main">
          <div className="rl-card">
            <div className="rl-card-header" style={{ borderLeftColor: activeRole.color }}>
              <div className="rl-role-info">
                <div className="rl-role-avatar" style={{ backgroundColor: activeRole.color }}>
                  {activeRole.name.charAt(0)}
                </div>
                <div>
                  <h2 className="rl-role-title">{activeRole.name}</h2>
                  <p className="rl-role-desc">{activeRole.description}</p>
                </div>
              </div>
            </div>

            <div className="rl-perms-grid">
              <section className="rl-perm-col">
                <div className="rl-section-head">
                  <CheckIcon />
                  <span>CORE CAPABILITIES</span>
                </div>
                <ul className="rl-perm-list">
                  {activeRole.capabilities.map((cap, i) => (
                    <li key={i}>{cap}</li>
                  ))}
                </ul>
              </section>

              <section className="rl-perm-col">
                <div className="rl-section-head">
                  <CheckIcon />
                  <span>PRIMARY ACTIONS</span>
                </div>
                <ul className="rl-perm-list">
                  {activeRole.canDo.map((action, i) => (
                    <li key={i}>{action}</li>
                  ))}
                </ul>
              </section>
            </div>

            <div className="rl-users-section">
              <div className="rl-section-head">
                <UserIcon />
                <span>CURRENTLY ASSIGNED PEOPLE</span>
              </div>
              
              {loading ? (
                <div className="rl-loading">
                  <div className="rl-spinner" />
                  Drawing user directory…
                </div>
              ) : usersInActiveRole.length > 0 ? (
                <div className="rl-table-wrap">
                  <table className="rl-table">
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>Email</th>
                        <th style={{ textAlign: 'right' }}>Role Label</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersInActiveRole.map(u => (
                        <tr key={u.userId}>
                          <td>
                            <div className="rl-user-cell">
                              <div className="rl-user-av" style={{ background: activeRole.color }}>
                                {u.fullName?.charAt(0).toUpperCase()}
                              </div>
                              <span className="rl-user-name">{u.fullName}</span>
                            </div>
                          </td>
                          <td><span className="rl-user-email">{u.email}</span></td>
                          <td style={{ textAlign: 'right' }}>
                            <span className="rl-status-chip" style={{ color: activeRole.color, background: `${activeRole.color}15` }}>
                              {u.role?.toLowerCase() === 'owner' ? 'Admin' : u.role}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rl-empty">
                  No users are currently assigned the <strong>{activeRole.name}</strong> role.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
