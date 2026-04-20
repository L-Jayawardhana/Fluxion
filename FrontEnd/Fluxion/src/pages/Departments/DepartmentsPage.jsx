import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getOrganizations, getDepartments, updateDepartment, toggleDepartment } from '../../services/api';
import './DepartmentsPage.css';

/* ── SVG icons ──────────────────────────────────────────── */
const PlusIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M8 1v14M1 8h14" strokeLinecap="round"/>
  </svg>
);
const RefreshIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M1 8a7 7 0 0013.3-3M15 8A7 7 0 001.7 11" strokeLinecap="round"/>
    <path d="M12 1l2.3 4-4 .3M4 15l-2.3-4 4-.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const DeactivateIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9" x2="9" y2="15"/>
    <line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);
const ActivateIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="9 12 11 14 15 10"/>
  </svg>
);
const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

/* ── Helpers ────────────────────────────────────────────── */
const FILTERS = ['All', 'Active', 'Inactive'];
const emptyForm = { name: '', description: '' };
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

/* ████████████████████████████████████████████████████████ */
export default function DepartmentsPage() {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner' || user?.role === 'systemAdmin' || user?.role === 'admin' || user?.role === 'manager';

  const [userOrg, setUserOrg]         = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [filter, setFilter]           = useState('All');

  // Edit modal
  const [editingDept, setEditingDept]     = useState(null);
  const [editForm, setEditForm]           = useState(emptyForm);
  const [editErrors, setEditErrors]       = useState({});
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editMsg, setEditMsg]             = useState({ type: '', text: '' });

  // Confirm deactivate/activate
  const [confirmTarget, setConfirmTarget] = useState(null); // { dept, newIsActive }
  const [isToggling, setIsToggling]       = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);

    if (!user?.orgId) {
      setError('Unable to load your organisation. Please try again.');
      setLoading(false);
      return;
    }

    Promise.all([
      getOrganizations(),
      getDepartments(user.orgId),
    ])
      .then(([orgs, depts]) => {
        const org = orgs.find(o => Number(o.orgId) === Number(user.orgId));
        setUserOrg(org || null);
        setDepartments(depts);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load departments. Please try again.');
        setLoading(false);
      });
  }, [user?.orgId]);

  /* ── Load data ──────────────────────────────────────────── */
  useEffect(() => { loadData(); }, [loadData]);

  /* ── Filtered list ──────────────────────────────────────── */
  const filtered =
    filter === 'Active'   ? departments.filter(d => d.isActive) :
    filter === 'Inactive' ? departments.filter(d => !d.isActive) :
    departments;

  const activeCount   = departments.filter(d => d.isActive).length;
  const inactiveCount = departments.filter(d => !d.isActive).length;

  /* ── Edit modal ─────────────────────────────────────────── */
  const openEdit = (dept) => {
    setEditingDept(dept);
    setEditForm({ name: dept.departmentName, description: dept.description || '' });
    setEditErrors({});
    setEditMsg({ type: '', text: '' });
  };
  const closeEdit = () => {
    setEditingDept(null);
    setEditForm(emptyForm);
    setEditErrors({});
    setEditMsg({ type: '', text: '' });
  };
  const validateEditForm = () => {
    const errs = {};
    if (!editForm.name.trim())                errs.name = 'Department name is required.';
    else if (editForm.name.trim().length > 100) errs.name = 'Name must be 100 characters or fewer.';
    if (editForm.description && editForm.description.length > 500)
      errs.description = 'Description must be 500 characters or fewer.';
    return errs;
  };
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const errs = validateEditForm();
    if (Object.keys(errs).length) { setEditErrors(errs); return; }
    setEditSubmitting(true);
    setEditMsg({ type: '', text: '' });
    try {
      await updateDepartment(editingDept.departmentId, userOrg.orgId, {
        name: editForm.name.trim(),
        description: editForm.description.trim() || null,
      });
      setEditMsg({ type: 'success', text: 'Department updated successfully!' });
      setTimeout(() => { closeEdit(); loadData(); }, 1000);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.title || 'Failed to update department.';
      if (err.response?.status === 409) setEditErrors({ name: msg });
      else setEditMsg({ type: 'error', text: msg });
    } finally {
      setEditSubmitting(false);
    }
  };

  /* ── Toggle (activate / deactivate) ───────────────────── */
  const handleToggle = async () => {
    if (!confirmTarget) return;
    setIsToggling(true);
    const { dept, newIsActive } = confirmTarget;
    try {
      await toggleDepartment(dept.departmentId, userOrg.orgId, newIsActive);
      setDepartments(prev =>
        prev.map(d => d.departmentId === dept.departmentId ? { ...d, isActive: newIsActive } : d)
      );
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update department status.';
      setError(msg);
    } finally {
      setIsToggling(false);
      setConfirmTarget(null);
    }
  };

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div className="page dp-page">

      {/* ── Confirm overlay ─────────────────────────────── */}
      {confirmTarget && (
        <div className="dp-overlay" onClick={() => setConfirmTarget(null)}>
          <div className="dp-confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="dp-confirm-icon">
              {confirmTarget.dept.isActive ? '⚠️' : '✅'}
            </div>
            <div className="dp-confirm-title">
              {confirmTarget.dept.isActive ? 'Deactivate Department' : 'Activate Department'}
            </div>
            <div className="dp-confirm-msg">
              {confirmTarget.dept.isActive
                ? `"${confirmTarget.dept.departmentName}" will no longer be available for assignment.`
                : `Reactivate "${confirmTarget.dept.departmentName}" and make it available again.`}
            </div>
            <div className="dp-confirm-acts">
              <button className="dp-btn dp-btn-secondary" onClick={() => setConfirmTarget(null)} disabled={isToggling}>Cancel</button>
              {confirmTarget.dept.isActive
                ? <button className="dp-btn dp-btn-danger" onClick={handleToggle} disabled={isToggling}>{isToggling ? 'Deactivating…' : 'Deactivate'}</button>
                : <button className="dp-btn dp-btn-safe" onClick={handleToggle} disabled={isToggling}>{isToggling ? 'Activating…' : 'Activate'}</button>}
            </div>
          </div>
        </div>
      )}

      {/* ── Edit modal ──────────────────────────────────── */}
      {editingDept && (
        <div className="dp-overlay" onClick={closeEdit}>
          <div className="dp-modal" onClick={e => e.stopPropagation()}>
            <div className="dp-modal-head">
              <div className="dp-modal-title">Edit Department</div>
              <button className="dp-modal-x" onClick={closeEdit}><CloseIcon /></button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="dp-modal-body">
                {editMsg.text && (
                  <div className={`dp-msg dp-msg-${editMsg.type}`}>
                    {editMsg.type === 'success' ? '✓' : '⚠'} {editMsg.text}
                  </div>
                )}
                <div className="dp-field">
                  <label className="dp-label">Name <span className="dp-required">*</span></label>
                  <input
                    className={`dp-input${editErrors.name ? ' err' : ''}`}
                    type="text"
                    value={editForm.name}
                    onChange={e => { setEditForm(f => ({ ...f, name: e.target.value })); setEditErrors(err => ({ ...err, name: '' })); }}
                    placeholder="e.g. Engineering, Sales, HR"
                    maxLength={100}
                    autoFocus
                    disabled={editSubmitting}
                  />
                  {editErrors.name && <div className="dp-field-err">{editErrors.name}</div>}
                  <div className="dp-field-hint">{editForm.name.length}/100</div>
                </div>
                <div className="dp-field">
                  <label className="dp-label">Description</label>
                  <textarea
                    className={`dp-textarea${editErrors.description ? ' err' : ''}`}
                    value={editForm.description}
                    onChange={e => { setEditForm(f => ({ ...f, description: e.target.value })); setEditErrors(err => ({ ...err, description: '' })); }}
                    placeholder="Optional: describe the purpose of this department"
                    maxLength={500}
                    disabled={editSubmitting}
                  />
                  {editErrors.description && <div className="dp-field-err">{editErrors.description}</div>}
                  <div className="dp-field-hint">{editForm.description.length}/500</div>
                </div>
              </div>
              <div className="dp-modal-foot">
                <button type="button" className="dp-btn dp-btn-secondary" onClick={closeEdit} disabled={editSubmitting}>Cancel</button>
                <button type="submit" className="dp-btn dp-btn-primary" disabled={editSubmitting}>
                  {editSubmitting ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Page header ─────────────────────────────────── */}
      <div className="dp-header">
        <div className="dp-header-text">
          <h1 className="dp-title">Departments</h1>
          <p className="dp-subtitle">{isOwner ? 'View and manage departments in your organisation' : 'View departments in your organisation'}</p>
        </div>
        <div className="dp-header-actions">
          <button className="dp-btn-refresh" onClick={loadData} title="Refresh">
            <RefreshIcon /> Refresh
          </button>
          {isOwner && (
            <Link to="/add-department" className="dp-btn-add">
              <PlusIcon /> Add Department
            </Link>
          )}
        </div>
      </div>

      {/* ── Org pill ────────────────────────────────────── */}
      {userOrg && (
        <div className="dp-org-pill">
          <span>Organisation</span>
          {userOrg.orgName}
        </div>
      )}

      {/* ── Error ───────────────────────────────────────── */}
      {error && (
        <div className="dp-error">
          ⚠ {error}
        </div>
      )}

      {/* ── Stats row ───────────────────────────────────── */}
      {!loading && (
        <div className="dp-stats-row">
          <div className="dp-stat-card blue">
            <div className="dp-stat-label">Total</div>
            <div className="dp-stat-value">{departments.length}</div>
            <div className="dp-stat-sub">departments</div>
          </div>
          <div className="dp-stat-card green">
            <div className="dp-stat-label">Active</div>
            <div className="dp-stat-value">{activeCount}</div>
            <div className="dp-stat-sub">currently active</div>
          </div>
          <div className="dp-stat-card amber">
            <div className="dp-stat-label">Inactive</div>
            <div className="dp-stat-value">{inactiveCount}</div>
            <div className="dp-stat-sub">deactivated</div>
          </div>
        </div>
      )}

      {/* ── Main panel ──────────────────────────────────── */}
      <div className="dp-panel">
        <div className="dp-panel-head">
          <div className="dp-panel-title">All Departments</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div className="dp-filter-pills">
              {FILTERS.map(f => (
                <button
                  key={f}
                  className={`dp-pill${filter === f ? ' active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f}
                  {f === 'Active' && ` · ${activeCount}`}
                  {f === 'Inactive' && ` · ${inactiveCount}`}
                </button>
              ))}
            </div>
            <span className="dp-panel-count">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* ── Loading ── */}
        {loading ? (
          <div className="dp-loading">
            <div className="dp-spinner" />
            Loading departments…
          </div>
        ) : filtered.length === 0 ? (
          /* ── Empty state ── */
          <div className="dp-empty">
            <div className="dp-empty-icon">🏢</div>
            <div className="dp-empty-title">
              {departments.length === 0
                ? 'No departments yet'
                : `No ${filter.toLowerCase()} departments`}
            </div>
            <div className="dp-empty-sub">
              {departments.length === 0
                ? 'Create your first department to get started.'
                : 'Try switching the filter above.'}
            </div>
          </div>
        ) : (
          <>
            {/* ── Desktop table ── */}
            <div className="dp-table-wrap">
              <table className="dp-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Created</th>
                    {isOwner && <th />}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(dept => (
                    <tr key={dept.departmentId}>
                      <td>
                        <div className="dp-dept-name">{dept.departmentName}</div>
                      </td>
                      <td>
                        <div className="dp-dept-desc">
                          {dept.description || <span style={{ fontStyle: 'italic', opacity: .5 }}>No description</span>}
                        </div>
                      </td>
                      <td>
                        <span className={`dp-badge dp-badge-${dept.isActive ? 'active' : 'inactive'}`}>
                          {dept.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="dp-date">{fmtDate(dept.createdAt)}</td>
                      {isOwner && (
                      <td>
                        <div className="dp-row-acts">
                          <button className="dp-ract" title="Edit" onClick={() => openEdit(dept)}>
                            <EditIcon />
                          </button>
                          {dept.isActive ? (
                            <button
                              className="dp-ract del"
                              title="Deactivate"
                              onClick={() => setConfirmTarget({ dept, newIsActive: false })}
                            >
                              <DeactivateIcon />
                            </button>
                          ) : (
                            <button
                              className="dp-ract act"
                              title="Activate"
                              onClick={() => setConfirmTarget({ dept, newIsActive: true })}
                            >
                              <ActivateIcon />
                            </button>
                          )}
                        </div>
                      </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Mobile cards ── */}
            <div className="dp-cards">
              {filtered.map(dept => (
                <div key={dept.departmentId} className="dp-card">
                  <div className="dp-card-top">
                    <div className="dp-card-name">{dept.departmentName}</div>
                    <span className={`dp-badge dp-badge-${dept.isActive ? 'active' : 'inactive'}`}>
                      {dept.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {dept.description && (
                    <div className="dp-card-desc">{dept.description}</div>
                  )}
                  <div className="dp-card-meta">
                    <span className="dp-card-date">{fmtDate(dept.createdAt)}</span>
                    {isOwner && (
                    <div className="dp-card-acts">
                      <button className="dp-ract" title="Edit" onClick={() => openEdit(dept)}>
                        <EditIcon />
                      </button>
                      {dept.isActive ? (
                        <button className="dp-ract del" title="Deactivate" onClick={() => setConfirmTarget({ dept, newIsActive: false })}>
                          <DeactivateIcon />
                        </button>
                      ) : (
                        <button className="dp-ract act" title="Activate" onClick={() => setConfirmTarget({ dept, newIsActive: true })}>
                          <ActivateIcon />
                        </button>
                      )}
                    </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
