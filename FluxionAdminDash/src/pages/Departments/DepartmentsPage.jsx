import { useState, useEffect, useCallback } from 'react';
import { getOrganizations, getDepartments, createDepartment, updateDepartment, toggleDepartment } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ConfirmModal';

const FILTERS = ['All', 'Active', 'Inactive'];

const emptyForm = { name: '', description: '' };

export default function DepartmentsPage() {
  const [orgs, setOrgs] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [departments, setDepartments] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [orgsLoading, setOrgsLoading] = useState(true);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [createErrors, setCreateErrors] = useState({});
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Edit modal
  const [editingDept, setEditingDept] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editErrors, setEditErrors] = useState({});
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Toggle confirm
  const [toggleTarget, setToggleTarget] = useState(null); // { dept, newIsActive }

  const { addToast } = useToast();

  const fetchDepts = useCallback(async () => {
    if (!selectedOrgId) return;
    try {
      setLoading(true);
      const data = await getDepartments(Number(selectedOrgId));
      setDepartments(data);
    } catch {
      addToast('Failed to load departments', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedOrgId, addToast]);

  // Load orgs on mount
  useEffect(() => {
    const load = async () => {
      setOrgsLoading(true);
      try {
        const data = await getOrganizations();
        setOrgs(data);
        if (data.length > 0) setSelectedOrgId(String(data[0].orgId));
      } catch {
        addToast('Failed to load organisations', 'error');
      } finally {
        setOrgsLoading(false);
      }
    };
    load();
  }, [addToast]);

  // Load departments when selected org changes
  useEffect(() => {
    if (!selectedOrgId) return;
    const load = async () => {
      await fetchDepts();
    };
    load();
  }, [selectedOrgId, fetchDepts]);

  // ── Filtered list ────────────────────────────────────────────────

  const filtered = filter === 'All'
    ? departments
    : filter === 'Active'
      ? departments.filter(d => d.isActive)
      : departments.filter(d => !d.isActive);

  // ── Validation ───────────────────────────────────────────────────

  const validateForm = (form) => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Department name is required.';
    else if (form.name.trim().length > 100) errs.name = 'Name must be 100 characters or fewer.';
    if (form.description && form.description.length > 500) errs.description = 'Description must be 500 characters or fewer.';
    return errs;
  };

  // ── Create ───────────────────────────────────────────────────────

  const openCreate = () => {
    setCreateForm(emptyForm);
    setCreateErrors({});
    setShowCreate(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const errs = validateForm(createForm);
    if (Object.keys(errs).length) { setCreateErrors(errs); return; }
    setCreateSubmitting(true);
    try {
      await createDepartment({
        orgId: Number(selectedOrgId),
        name: createForm.name.trim(),
        description: createForm.description.trim() || null,
      });
      addToast('Department created successfully', 'success');
      setShowCreate(false);
      fetchDepts();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create department';
      if (err.response?.status === 409) setCreateErrors({ name: msg });
      else addToast(msg, 'error');
    } finally {
      setCreateSubmitting(false);
    }
  };

  // ── Edit ─────────────────────────────────────────────────────────

  const openEdit = (dept) => {
    setEditingDept(dept);
    setEditForm({ name: dept.departmentName, description: dept.description || '' });
    setEditErrors({});
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editingDept) return;
    const errs = validateForm(editForm);
    if (Object.keys(errs).length) { setEditErrors(errs); return; }
    setEditSubmitting(true);
    try {
      await updateDepartment(editingDept.departmentId, {
        departmentId: editingDept.departmentId,
        orgId: Number(selectedOrgId),
        name: editForm.name.trim(),
        description: editForm.description.trim() || null,
      });
      addToast('Department updated successfully', 'success');
      setEditingDept(null);
      fetchDepts();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update department';
      if (err.response?.status === 409) setEditErrors({ name: msg });
      else if (err.response?.status === 404) addToast('Department not found', 'error');
      else addToast(msg, 'error');
    } finally {
      setEditSubmitting(false);
    }
  };

  // ── Toggle ───────────────────────────────────────────────────────

  const handleToggleConfirm = async () => {
    if (!toggleTarget) return;
    const { dept, newIsActive } = toggleTarget;
    try {
      await toggleDepartment(dept.departmentId, Number(selectedOrgId), newIsActive);
      addToast(
        newIsActive ? 'Department activated' : 'Department deactivated',
        'success'
      );
      fetchDepts();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update department status';
      addToast(msg, 'error');
    } finally {
      setToggleTarget(null);
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────

  const formatDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  const selectedOrg = orgs.find(o => String(o.orgId) === selectedOrgId);

  // ── Render ───────────────────────────────────────────────────────

  return (
    <div className="pad">

      {/* Toggle Confirm */}
      <ConfirmModal
        open={!!toggleTarget}
        title={toggleTarget?.newIsActive ? 'Activate Department' : 'Deactivate Department'}
        message={
          toggleTarget?.newIsActive
            ? `Activate "${toggleTarget?.dept?.departmentName}"?`
            : `Deactivate "${toggleTarget?.dept?.departmentName}"? It will no longer be available for assignment.`
        }
        onConfirm={handleToggleConfirm}
        onCancel={() => setToggleTarget(null)}
      />

      {/* Create Modal */}
      {showCreate && (
        <div className="overlay open" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-title">New Department</div>
              <button className="modal-x" onClick={() => setShowCreate(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="mf">
                  <label className="ml">Name <span style={{ color: '#EF4444' }}>*</span></label>
                  <input
                    id="create-dept-name"
                    className={`mi${createErrors.name ? ' mi-error' : ''}`}
                    type="text"
                    value={createForm.name}
                    onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="e.g. Engineering"
                    maxLength={100}
                    autoFocus
                  />
                  {createErrors.name && <div className="field-error">{createErrors.name}</div>}
                </div>
                <div className="mf">
                  <label className="ml">Description</label>
                  <textarea
                    id="create-dept-desc"
                    className="mi"
                    style={{ minHeight: 72, resize: 'vertical' }}
                    value={createForm.description}
                    onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                    placeholder="Optional description"
                    maxLength={500}
                  />
                  {createErrors.description && <div className="field-error">{createErrors.description}</div>}
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="mc" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="mok" disabled={createSubmitting}>
                  {createSubmitting ? 'Creating…' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingDept && (
        <div className="overlay open" onClick={() => setEditingDept(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-title">Edit Department</div>
              <button className="modal-x" onClick={() => setEditingDept(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="modal-body">
                <div className="mf">
                  <label className="ml">Name <span style={{ color: '#EF4444' }}>*</span></label>
                  <input
                    id="edit-dept-name"
                    className={`mi${editErrors.name ? ' mi-error' : ''}`}
                    type="text"
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    maxLength={100}
                    autoFocus
                  />
                  {editErrors.name && <div className="field-error">{editErrors.name}</div>}
                </div>
                <div className="mf">
                  <label className="ml">Description</label>
                  <textarea
                    id="edit-dept-desc"
                    className="mi"
                    style={{ minHeight: 72, resize: 'vertical' }}
                    value={editForm.description}
                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                    maxLength={500}
                  />
                  {editErrors.description && <div className="field-error">{editErrors.description}</div>}
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="mc" onClick={() => setEditingDept(null)}>Cancel</button>
                <button type="submit" className="mok" disabled={editSubmitting}>
                  {editSubmitting ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--txt)' }}>Departments</h1>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
            Manage departments for each organisation
          </div>
        </div>

        {/* Org selector */}
        {orgsLoading ? (
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Loading organisations…</div>
        ) : (
          <select
            id="dept-org-select"
            className="mi"
            style={{ width: 220 }}
            value={selectedOrgId}
            onChange={e => setSelectedOrgId(e.target.value)}
          >
            {orgs.map(o => (
              <option key={o.orgId} value={o.orgId}>{o.orgName}</option>
            ))}
          </select>
        )}

        <button
          id="dept-create-btn"
          className="mok"
          style={{ whiteSpace: 'nowrap' }}
          onClick={openCreate}
          disabled={!selectedOrgId}
        >
          + New Department
        </button>
      </div>

      {/* Filter pills */}
      <div className="filter-row">
        {FILTERS.map(f => (
          <button
            key={f}
            className={`fpill${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
            {f !== 'All' && ` (${f === 'Active'
              ? departments.filter(d => d.isActive).length
              : departments.filter(d => !d.isActive).length})`}
          </button>
        ))}
        <div className="fspacer" />
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)' }}>
          {filtered.length} department{filtered.length !== 1 ? 's' : ''}
          {selectedOrg ? ` · ${selectedOrg.orgName}` : ''}
        </span>
      </div>

      {/* Table */}
      <div className="panel">
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
            Loading departments…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
            {departments.length === 0
              ? 'No departments yet. Create the first one!'
              : `No ${filter.toLowerCase()} departments found.`}
          </div>
        ) : (
          <table className="otbl">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Status</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(dept => (
                <tr key={dept.departmentId}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--txt)', fontSize: 13 }}>
                      {dept.departmentName}
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--muted)', maxWidth: 280 }}>
                    {dept.description || <span style={{ fontStyle: 'italic' }}>No description</span>}
                  </td>
                  <td>
                    <span className={`spill ${dept.isActive ? 'sp-active' : 'sp-inactive'}`}>
                      {dept.isActive ? 'active' : 'inactive'}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>{formatDate(dept.createdAt)}</td>
                  <td>
                    <div className="row-acts">
                      {/* Edit */}
                      <button
                        className="ract"
                        title="Edit"
                        onClick={() => openEdit(dept)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      {/* Toggle */}
                      <button
                        className={`ract${dept.isActive ? ' del' : ''}`}
                        title={dept.isActive ? 'Deactivate' : 'Activate'}
                        onClick={() => setToggleTarget({ dept, newIsActive: !dept.isActive })}
                      >
                        {dept.isActive ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="15" y1="9" x2="9" y2="15"/>
                            <line x1="9" y1="9" x2="15" y2="15"/>
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="9 12 11 14 15 10"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
