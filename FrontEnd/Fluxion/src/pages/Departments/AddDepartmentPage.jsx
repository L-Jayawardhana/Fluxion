import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getOrganizations, createDepartment } from '../../services/api';
import './AddDepartmentPage.css';

/* ── back-arrow ── */
const BackIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const emptyForm = { name: '', description: '' };

export default function AddDepartmentPage() {
  const navigate        = useNavigate();
  const { user }        = useAuth();
  const [userOrg, setUserOrg]   = useState(null);
  const [form, setForm]         = useState(emptyForm);
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage]   = useState({ type: '', text: '' });

  /* ── Load user's organisation ── */
  useEffect(() => {
    setLoading(true);
    if (!user?.orgId) {
      setMessage({ type: 'error', text: 'Unable to load your organisation. Please try again.' });
      setLoading(false);
      return;
    }
    getOrganizations()
      .then(data => {
        const org = data.find(o => Number(o.orgId) === Number(user.orgId));
        if (org) {
          setUserOrg(org);
        } else {
          setMessage({ type: 'error', text: 'Your organisation was not found. Please contact your administrator.' });
        }
        setLoading(false);
      })
      .catch(() => {
        setMessage({ type: 'error', text: 'Failed to load organisation details. Please refresh the page.' });
        setLoading(false);
      });
  }, [user]);

  /* ── Validation ── */
  const validate = () => {
    const errs = {};
    if (!form.name.trim())               errs.name = 'Department name is required.';
    else if (form.name.trim().length > 100) errs.name = 'Name must be 100 characters or fewer.';
    if (form.description && form.description.length > 500)
      errs.description = 'Description must be 500 characters or fewer.';
    return errs;
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    if (!userOrg) {
      setMessage({ type: 'error', text: 'Organisation not available.' });
      return;
    }

    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      await createDepartment({
        orgId: userOrg.orgId,
        name: form.name.trim(),
        description: form.description.trim() || null,
      });
      setMessage({ type: 'success', text: 'Department created successfully!' });
      setForm(emptyForm);
      setErrors({});
      setTimeout(() => navigate('/departments'), 1400);
    } catch (err) {
      const status = err.response?.status;
      const msg =
        err.response?.data?.message ||
        err.response?.data?.title ||
        (status === 403 ? 'You do not have permission to create departments.' :
         status === 401 ? 'Your session expired. Please log in again.' :
         'Failed to create department.');
      if (status === 409) setErrors({ name: msg });
      else setMessage({ type: 'error', text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Render ── */
  return (
    <div className="page adp-page">

      {/* ── Page header ── */}
      <div className="adp-header">
        <Link to="/departments" className="adp-back">
          <BackIcon /> Back to Departments
        </Link>
        <h1 className="adp-title">Add Department</h1>
        <p className="adp-subtitle">Create a new department for your organisation</p>
      </div>

      {/* ── Card ── */}
      <div className="adp-card">

        {/* Card header */}
        <div className="adp-card-head">
          <div className="adp-card-head-title">New Department</div>
          <div className="adp-card-head-sub">Fill in the details below to create a department</div>
        </div>

        {/* Card body */}
        <div className="adp-card-body">

          {/* Success / error message */}
          {message.text && (
            <div className={`adp-msg adp-msg-${message.type}`}>
              {message.type === 'success' ? '✓' : '⚠'} {message.text}
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="adp-loading">
              <div className="adp-spinner" />
              Loading organisation…
            </div>
          ) : !userOrg && !message.text ? (
            <div className="adp-org-missing">
              Unable to load your organisation. Please contact your administrator.
            </div>
          ) : userOrg ? (
            <form onSubmit={handleSubmit} className="adp-form">

              {/* Organisation (read-only) */}
              <div className="adp-field">
                <label className="adp-label">Organisation</label>
                <div className="adp-org-chip">
                  <span className="adp-org-chip-label">Org</span>
                  {userOrg.orgName}
                </div>
              </div>

              <hr className="adp-divider" />

              {/* Department name */}
              <div className="adp-field">
                <label className="adp-label" htmlFor="dept-name">
                  Department Name <span className="adp-required">*</span>
                </label>
                <input
                  id="dept-name"
                  type="text"
                  className={`adp-input${errors.name ? ' err' : ''}`}
                  value={form.name}
                  onChange={e => {
                    setForm(f => ({ ...f, name: e.target.value }));
                    if (errors.name) setErrors(err => ({ ...err, name: '' }));
                  }}
                  placeholder="e.g. Engineering, Sales, HR"
                  maxLength={100}
                  autoFocus
                  disabled={submitting}
                />
                {errors.name && <div className="adp-field-err">{errors.name}</div>}
                <div className="adp-field-hint">{form.name.length}/100</div>
              </div>

              {/* Description */}
              <div className="adp-field">
                <label className="adp-label" htmlFor="dept-desc">Description</label>
                <textarea
                  id="dept-desc"
                  className={`adp-textarea${errors.description ? ' err' : ''}`}
                  value={form.description}
                  onChange={e => {
                    setForm(f => ({ ...f, description: e.target.value }));
                    if (errors.description) setErrors(er => ({ ...er, description: '' }));
                  }}
                  placeholder="Optional: describe the purpose or role of this department"
                  maxLength={500}
                  disabled={submitting}
                />
                {errors.description && <div className="adp-field-err">{errors.description}</div>}
                <div className="adp-field-hint">{form.description.length}/500</div>
              </div>

              {/* Actions */}
              <div className="adp-actions">
                <button
                  type="button"
                  className="adp-btn adp-btn-cancel"
                  onClick={() => navigate('/departments')}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="adp-btn adp-btn-submit"
                  disabled={submitting}
                >
                  {submitting ? 'Creating…' : 'Create Department'}
                </button>
              </div>

            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
}
