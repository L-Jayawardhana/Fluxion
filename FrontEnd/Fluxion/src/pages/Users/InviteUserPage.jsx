import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import './InviteUserPage.css';

/* ── SVG icons ───────────────────────────────── */
const Icons = {
  send: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2L7 9M14 2l-5 12-2-5-5-2 12-5z" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  user: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>,
  mail: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="14" height="10" rx="2"/><path d="M1 5l7 5 7-5"/></svg>,
  lock: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="7" width="10" height="7" rx="1.5"/><path d="M5 7V5a3 3 0 016 0v2"/></svg>,
  dept: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="7" width="4" height="7" rx="1"/><rect x="6" y="4" width="4" height="10" rx="1"/><rect x="11" y="1" width="4" height="13" rx="1"/></svg>,
  shield: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 1L2 4v4c0 3.5 2.6 6.5 6 7.5 3.4-1 6-4 6-7.5V4L8 1z"/><path d="M6 8l2 2 3-3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  check: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  alert: <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 4zm0 8a1 1 0 110-2 1 1 0 010 2z"/></svg>,
  eye: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/></svg>,
  eyeOff: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 2l12 12M6.7 6.8a3 3 0 004.4 4.3M4.2 4.3C2.6 5.4 1 8 1 8s2.5 5 7 5c1.5 0 2.9-.5 4-.3M11.8 11.9C13.4 10.8 15 8 15 8s-2.5-5-7-5c-.5 0-.9 0-1.4.1"/></svg>,
};

/* ── Invite history item ─────────────────────── */
function InviteHistoryItem({ name, email, status, time }) {
  return (
    <div className="iu-history-item">
      <div className="iu-h-avatar">{name.charAt(0).toUpperCase()}</div>
      <div className="iu-h-info">
        <div className="iu-h-name">{name}</div>
        <div className="iu-h-email">{email}</div>
      </div>
      <div className="iu-h-right">
        <span className={`iu-h-badge iu-h-${status}`}>
          {status === 'pending' ? 'Pending' : 'Accepted'}
        </span>
        <div className="iu-h-time">{time}</div>
      </div>
    </div>
  );
}

/* ████████████████████████████████████████████████ */
export default function InviteUserPage() {
  const { user } = useAuth();
  const currentOrgId = user?.orgId;

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '', departmentId: '', role: 'user',
  });
  const [showPw, setShowPw] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [recentInvites, setRecentInvites] = useState([]);

  /* ── Fetch departments ── */
  useEffect(() => {
    if (!currentOrgId) return;
    let cancelled = false;
    setLoadingDepts(true);
    api.get(`/Department?orgId=${currentOrgId}`)
      .then(res => {
        if (cancelled) return;
        const active = res.data.filter(d => d.isActive);
        setDepartments(active);
        if (active.length > 0) setFormData(p => ({ ...p, departmentId: active[0].departmentId }));
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingDepts(false); });
    return () => { cancelled = true; };
  }, [currentOrgId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(''); setSuccessMsg('');
    setIsSubmitting(true);
    try {
      await api.post('/User/employee', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        orgId: parseInt(currentOrgId, 10),
        departmentId: parseInt(formData.departmentId, 10),
        role: formData.role,
      });
      const invitedName = `${formData.firstName} ${formData.lastName}`;
      const invitedEmail = formData.email;
      setSuccessMsg(`Invitation sent successfully to ${invitedEmail}!`);
      setRecentInvites(prev => [
        { name: invitedName, email: invitedEmail, status: 'pending', time: 'Just now' },
        ...prev,
      ]);
      setFormData({ firstName: '', lastName: '', email: '', password: '', role: 'user', departmentId: departments.length > 0 ? departments[0].departmentId : '' });
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to send invitation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── No org guard ── */
  if (!currentOrgId) {
    return (
      <div className="iu-page">
        <div className="iu-empty-state">
          <div className="iu-empty-icon">🏢</div>
          <h3>No Organisation Found</h3>
          <p>You must belong to an organisation before you can invite employees.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="iu-page">

      {/* ── Header ───────────────────────────────── */}
      <div className="iu-header">
        <div>
          <div className="iu-eyebrow">People Management</div>
          <h1 className="iu-title">Invite Users</h1>
          <p className="iu-subtitle">
            Register a new employee account and send them an invitation to join your workspace.
          </p>
        </div>
        <div className="iu-header-stats">
          <div className="iu-stat">
            <div className="iu-stat-icon">{Icons.user}</div>
            <div>
              <div className="iu-stat-val">{recentInvites.length}</div>
              <div className="iu-stat-lbl">Invited Today</div>
            </div>
          </div>
          <div className="iu-stat">
            <div className="iu-stat-icon green">{Icons.dept}</div>
            <div>
              <div className="iu-stat-val">{departments.length}</div>
              <div className="iu-stat-lbl">Departments</div>
            </div>
          </div>
        </div>
      </div>

      <div className="iu-grid">

        {/* ── Registration Form Card ─────────────── */}
        <div className="iu-form-card">
          <div className="iu-card-head">
            <div className="iu-card-icon">{Icons.send}</div>
            <div>
              <div className="iu-card-title">Register & Invite Employee</div>
              <div className="iu-card-sub">Create credentials and send an invitation email</div>
            </div>
          </div>

          {errorMsg && (
            <div className="iu-toast iu-toast-error">
              <span className="iu-toast-icon">{Icons.alert}</span>
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="iu-toast iu-toast-success">
              <span className="iu-toast-icon">{Icons.check}</span>
              <span>{successMsg}</span>
            </div>
          )}

          <form className="iu-form" onSubmit={handleSubmit}>

            {/* Name row */}
            <div className="iu-row">
              <div className="iu-field">
                <label htmlFor="iu-fname">First Name</label>
                <div className="iu-input-wrap">
                  <span className="iu-in-icon">{Icons.user}</span>
                  <input id="iu-fname" name="firstName" required placeholder="Jane"
                    value={formData.firstName} onChange={handleChange} disabled={isSubmitting} />
                </div>
              </div>
              <div className="iu-field">
                <label htmlFor="iu-lname">Last Name</label>
                <div className="iu-input-wrap">
                  <span className="iu-in-icon">{Icons.user}</span>
                  <input id="iu-lname" name="lastName" required placeholder="Doe"
                    value={formData.lastName} onChange={handleChange} disabled={isSubmitting} />
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="iu-field">
              <label htmlFor="iu-email">Email Address</label>
              <div className="iu-input-wrap">
                <span className="iu-in-icon">{Icons.mail}</span>
                <input id="iu-email" type="email" name="email" required placeholder="jane.doe@company.com"
                  value={formData.email} onChange={handleChange} disabled={isSubmitting} />
              </div>
              <small className="iu-hint">An invitation link will be sent to this email address.</small>
            </div>

            {/* Password */}
            <div className="iu-field">
              <label htmlFor="iu-pw">Initial Password</label>
              <div className="iu-input-wrap">
                <span className="iu-in-icon">{Icons.lock}</span>
                <input id="iu-pw" type={showPw ? 'text' : 'password'} name="password" required minLength="8"
                  placeholder="Minimum 8 characters"
                  value={formData.password} onChange={handleChange} disabled={isSubmitting} />
                <button type="button" className="iu-pw-toggle" onClick={() => setShowPw(!showPw)} aria-label="Toggle password">
                  {showPw ? Icons.eyeOff : Icons.eye}
                </button>
              </div>
              <small className="iu-hint">The employee can change this upon first login.</small>
            </div>

            {/* Role + Department */}
            <div className="iu-row">
              <div className="iu-field">
                <label htmlFor="iu-role">Role</label>
                <div className="iu-input-wrap">
                  <span className="iu-in-icon">{Icons.shield}</span>
                  <select id="iu-role" name="role" required
                    value={formData.role} onChange={handleChange} disabled={isSubmitting}>
                    <option value="user">Employee</option>
                    <option value="technician">Technician</option>
                  </select>
                </div>
              </div>
              <div className="iu-field">
                <label htmlFor="iu-dept">Department</label>
                <div className="iu-input-wrap">
                  <span className="iu-in-icon">{Icons.dept}</span>
                  <select id="iu-dept" name="departmentId" required
                    value={formData.departmentId} onChange={handleChange}
                    disabled={isSubmitting || loadingDepts || departments.length === 0}>
                    {loadingDepts && <option value="">Loading departments…</option>}
                    {!loadingDepts && departments.length === 0 && <option value="">No active departments</option>}
                    {!loadingDepts && departments.map(d => (
                      <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="iu-footer">
              <button type="submit" className="iu-btn-submit" disabled={isSubmitting || departments.length === 0}>
                {isSubmitting ? (
                  <><span className="iu-spinner" /> Sending…</>
                ) : (
                  <>{Icons.send} Register & Send Invite</>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ── Sidebar: How it works + Recent ─────── */}
        <div className="iu-sidebar">

          {/* How it works */}
          <div className="iu-info-card">
            <div className="iu-info-title">How it works</div>
            <div className="iu-steps">
              <div className="iu-step">
                <div className="iu-step-num">1</div>
                <div>
                  <div className="iu-step-head">Fill in details</div>
                  <div className="iu-step-desc">Enter the employee's name, email, and set an initial password.</div>
                </div>
              </div>
              <div className="iu-step">
                <div className="iu-step-num">2</div>
                <div>
                  <div className="iu-step-head">Send invitation</div>
                  <div className="iu-step-desc">An email with an acceptance link is sent to the employee.</div>
                </div>
              </div>
              <div className="iu-step">
                <div className="iu-step-num">3</div>
                <div>
                  <div className="iu-step-head">Employee accepts</div>
                  <div className="iu-step-desc">They click the link, accept the invite, and can log in immediately.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent invitations */}
          {recentInvites.length > 0 && (
            <div className="iu-info-card">
              <div className="iu-info-title">Recent Invitations</div>
              <div className="iu-history-list">
                {recentInvites.map((inv, i) => (
                  <InviteHistoryItem key={i} {...inv} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
