import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getOrganizations, getDepartments, createAsset } from '../../services/api';
import { QRCodeCanvas } from 'qrcode.react';
import './RegisterAssetPage.css';

/* ── SVG Icons ── */
const BackIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ASSET_TYPES = [
  'Laptop',
  'Desktop',
  'Monitor',
  'Printer',
  'Phone',
  'Tablet',
  'Vehicle',
  'Furniture',
  'Networking',
  'Other',
];

const emptyForm = {
  departmentId: '',
  assetName: '',
  assetType: '',
  serialNumber: '',
  purchaseDate: '',
  warrantyEndDate: '',
  cost: '',
  requiresRegularService: false,
  customAssetType: '',
};

export default function RegisterAssetPage() {
  const navigate        = useNavigate();
  const { user }        = useAuth();
  const [userOrg, setUserOrg]         = useState(null);
  const [departments, setDepartments] = useState([]);
  const [form, setForm]               = useState(emptyForm);
  const [errors, setErrors]           = useState({});
  const [loading, setLoading]         = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [message, setMessage]         = useState({ type: '', text: '' });
  const [createdAsset, setCreatedAsset] = useState(null);

  /* ── Load organisation & departments ── */
  useEffect(() => {
    setLoading(true);
    if (!user?.orgId) {
      setMessage({ type: 'error', text: 'Unable to load your organisation. Please try again.' });
      setLoading(false);
      return;
    }

    Promise.all([
      getOrganizations(),
      getDepartments(user.orgId),
    ])
      .then(([orgs, depts]) => {
        const org = orgs.find(o => Number(o.orgId) === Number(user.orgId));
        if (org) {
          setUserOrg(org);
        } else {
          setMessage({ type: 'error', text: 'Your organisation was not found.' });
        }
        setDepartments(depts.filter(d => d.isActive));
        setLoading(false);
      })
      .catch(() => {
        setMessage({ type: 'error', text: 'Failed to load organisation details. Please refresh the page.' });
        setLoading(false);
      });
  }, [user]);

  /* ── Helpers ── */
  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
  };

  /* ── Validation ── */
  const validate = () => {
    const errs = {};
    if (!form.assetName.trim())                 errs.assetName = 'Asset name is required.';
    else if (form.assetName.trim().length > 100) errs.assetName = 'Name must be 100 characters or fewer.';
    if (!form.assetType)                        errs.assetType = 'Asset type is required.';
    if (form.assetType === 'Other' && !form.customAssetType.trim()) errs.customAssetType = 'Custom asset type is required.';
    if (!form.departmentId)                     errs.departmentId = 'Department is required.';
    if (form.serialNumber && form.serialNumber.length > 100)
      errs.serialNumber = 'Serial number must be 100 characters or fewer.';
    if (form.cost !== '' && (isNaN(Number(form.cost)) || Number(form.cost) < 0))
      errs.cost = 'Cost must be zero or greater.';
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
      const payload = {
        orgId: userOrg.orgId,
        departmentId: Number(form.departmentId),
        assetName: form.assetName.trim(),
        assetType: form.assetType === 'Other' ? form.customAssetType.trim() : form.assetType,
        assetTag: null,
        serialNumber: form.serialNumber.trim() || null,
        purchaseDate: form.purchaseDate || null,
        warrantyEndDate: form.warrantyEndDate || null,
        cost: form.cost !== '' ? Number(form.cost) : null,
        requiresRegularService: form.requiresRegularService,
        createdBy: Number(user.userId),
      };

      const result = await createAsset(payload);
      setCreatedAsset(result);
      setMessage({ type: 'success', text: 'Asset registered successfully!' });
      setForm(emptyForm);
      setErrors({});
    } catch (err) {
      const status = err.response?.status;
      const msg =
        err.response?.data?.message ||
        err.response?.data?.title ||
        (status === 403 ? 'You do not have permission to register assets.' :
         status === 401 ? 'Your session expired. Please log in again.' :
         status === 404 ? err.response?.data?.message || 'Organisation or department not found.' :
         'Failed to register asset.');
      setMessage({ type: 'error', text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const downloadQR = () => {
    const canvas = document.getElementById('asset-qr-canvas');
    if (!canvas) return;
    const pngUrl = canvas.toDataURL("image/png");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `QR_${createdAsset?.assetTag || 'Asset'}.png`;
    downloadLink.click();
  };

  /* ── Render ── */
  return (
    <div className="page rap-page">

      {/* ── Page header ── */}
      <div className="rap-header">
        <Link to="/dashboard" className="rap-back">
          <BackIcon /> Back to Dashboard
        </Link>
        <h1 className="rap-title">Register Asset</h1>
        <p className="rap-subtitle">Add a new asset to your organisation's inventory</p>
      </div>

      {/* ── Card ── */}
      <div className="rap-card">

        {/* Card header */}
        <div className="rap-card-head">
          <div className="rap-card-head-title">New Asset</div>
          <div className="rap-card-head-sub">Fill in the details below to register an asset</div>
        </div>

        {/* Card body */}
        <div className="rap-card-body">

          {/* Success / error message */}
          {message.text && (
            <div className={`rap-msg rap-msg-${message.type}`}>
              {message.type === 'success' ? '✓' : '⚠'} {message.text}
            </div>
          )}

          {/* Success view with QR code */}
          {createdAsset ? (
            <div className="rap-success-card">
              <div className="rap-success-icon">✅</div>
              <div className="rap-success-title">{createdAsset.assetName}</div>
              <p className="rap-success-sub">
                {createdAsset.assetType} · {createdAsset.serialNumber || 'No serial'} · {createdAsset.status}
              </p>
              <div className="rap-qr-box" style={{ textAlign: 'center', marginTop: '20px' }}>
                <span className="rap-qr-label">Asset QR Code</span>
                <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', display: 'inline-block', border: '1px solid var(--rap-border)' }}>
                  <QRCodeCanvas 
                    id="asset-qr-canvas"
                    value={`Asset: ${createdAsset.assetName}\nType: ${createdAsset.assetType}\nDept: ${createdAsset.departmentName || 'Unassigned'}\nTag: ${createdAsset.assetTag || 'N/A'}\nSN: ${createdAsset.serialNumber || 'N/A'}\nWarranty: ${createdAsset.warrantyEndDate ? new Date(createdAsset.warrantyEndDate).toLocaleDateString() : 'N/A'}\nPrice: ${createdAsset.cost != null ? '$' + Number(createdAsset.cost).toFixed(2) : 'N/A'}`} 
                    size={140} 
                  />
                </div>
                <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--rap-mist)', fontFamily: 'DM Mono, monospace', fontWeight: 600 }}>
                  {createdAsset.assetTag}
                </div>
              </div>
              <div className="rap-actions" style={{ justifyContent: 'center', marginTop: 24 }}>
                <button
                  className="rap-btn"
                  style={{ background: 'var(--rap-mist)', color: '#fff' }}
                  onClick={downloadQR}
                >
                  Download QR
                </button>
                <button
                  className="rap-btn rap-btn-cancel"
                  onClick={() => { setCreatedAsset(null); setMessage({ type: '', text: '' }); }}
                >
                  Register Another
                </button>
                <button
                  className="rap-btn rap-btn-submit"
                  onClick={() => navigate('/dashboard')}
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          ) : loading ? (
            <div className="rap-loading">
              <div className="rap-spinner" />
              Loading organisation & departments…
            </div>
          ) : !userOrg && !message.text ? (
            <div className="rap-org-missing">
              Unable to load your organisation. Please contact your administrator.
            </div>
          ) : userOrg ? (
            <form onSubmit={handleSubmit} className="rap-form">

              {/* Organisation (read-only) */}
              <div className="rap-field">
                <label className="rap-label">Organisation</label>
                <div className="rap-org-chip">
                  <span className="rap-org-chip-label">Org</span>
                  {userOrg.orgName}
                </div>
              </div>

              <hr className="rap-divider" />

              {/* ── Section: Basic Info ── */}
              <div className="rap-section">
                <span className="rap-section-icon">📦</span>
                Asset Information
              </div>

              {/* Department */}
              <div className="rap-field">
                <label className="rap-label" htmlFor="asset-dept">
                  Department <span className="rap-required">*</span>
                </label>
                <select
                  id="asset-dept"
                  className={`rap-select${errors.departmentId ? ' err' : ''}`}
                  value={form.departmentId}
                  onChange={e => set('departmentId', e.target.value)}
                  disabled={submitting}
                >
                  <option value="">Select a department…</option>
                  {departments.map(d => (
                    <option key={d.departmentId} value={d.departmentId}>
                      {d.departmentName}
                    </option>
                  ))}
                </select>
                {errors.departmentId && <div className="rap-field-err">{errors.departmentId}</div>}
              </div>

              {/* Asset Name */}
              <div className="rap-field">
                <label className="rap-label" htmlFor="asset-name">
                  Asset Name <span className="rap-required">*</span>
                </label>
                <input
                  id="asset-name"
                  type="text"
                  className={`rap-input${errors.assetName ? ' err' : ''}`}
                  value={form.assetName}
                  onChange={e => set('assetName', e.target.value)}
                  placeholder="e.g. MacBook Pro 16-inch, Canon iR2625"
                  maxLength={100}
                  autoFocus
                  disabled={submitting}
                />
                {errors.assetName && <div className="rap-field-err">{errors.assetName}</div>}
                <div className="rap-field-hint">{form.assetName.length}/100</div>
              </div>

              {/* Asset Type + Asset Tag (side by side) */}
              <div className="rap-row">
                <div className="rap-field">
                  <label className="rap-label" htmlFor="asset-type">
                    Asset Type <span className="rap-required">*</span>
                  </label>
                  <select
                    id="asset-type"
                    className={`rap-select${errors.assetType ? ' err' : ''}`}
                    value={form.assetType}
                    onChange={e => set('assetType', e.target.value)}
                    disabled={submitting}
                  >
                    <option value="">Select type…</option>
                    {ASSET_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  {errors.assetType && <div className="rap-field-err">{errors.assetType}</div>}
                  
                  {form.assetType === 'Other' && (
                    <div style={{ marginTop: 10 }}>
                      <input
                        type="text"
                        className={`rap-input${errors.customAssetType ? ' err' : ''}`}
                        value={form.customAssetType}
                        onChange={e => set('customAssetType', e.target.value)}
                        placeholder="Please specify…"
                        maxLength={50}
                        disabled={submitting}
                      />
                      {errors.customAssetType && <div className="rap-field-err">{errors.customAssetType}</div>}
                    </div>
                  )}
                </div>

                <div className="rap-field">
                  <label className="rap-label" htmlFor="asset-tag">Asset Tag</label>
                  <input
                    id="asset-tag"
                    type="text"
                    className="rap-input"
                    value="Auto-generated"
                    disabled
                  />
                  <div className="rap-field-hint">e.g. AA-001</div>
                </div>
              </div>

              {/* Serial Number */}
              <div className="rap-field">
                <label className="rap-label" htmlFor="asset-serial">Serial Number</label>
                <input
                  id="asset-serial"
                  type="text"
                  className={`rap-input${errors.serialNumber ? ' err' : ''}`}
                  value={form.serialNumber}
                  onChange={e => set('serialNumber', e.target.value)}
                  placeholder="e.g. C02XF8K5JGH5"
                  maxLength={100}
                  disabled={submitting}
                />
                {errors.serialNumber && <div className="rap-field-err">{errors.serialNumber}</div>}
                <div className="rap-field-hint">{form.serialNumber.length}/100</div>
              </div>

              <hr className="rap-divider" />

              {/* ── Section: Purchase & Warranty ── */}
              <div className="rap-section">
                <span className="rap-section-icon">🛡️</span>
                Purchase & Warranty
              </div>

              {/* Purchase Date + Warranty End Date (side by side) */}
              <div className="rap-row">
                <div className="rap-field">
                  <label className="rap-label" htmlFor="asset-purchase">Purchase Date</label>
                  <input
                    id="asset-purchase"
                    type="date"
                    className="rap-input"
                    value={form.purchaseDate}
                    onChange={e => set('purchaseDate', e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div className="rap-field">
                  <label className="rap-label" htmlFor="asset-warranty">Warranty End Date</label>
                  <input
                    id="asset-warranty"
                    type="date"
                    className="rap-input"
                    value={form.warrantyEndDate}
                    onChange={e => set('warrantyEndDate', e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Cost */}
              <div className="rap-field">
                <label className="rap-label" htmlFor="asset-cost">Cost ($)</label>
                <input
                  id="asset-cost"
                  type="number"
                  step="0.01"
                  min="0"
                  className={`rap-input${errors.cost ? ' err' : ''}`}
                  value={form.cost}
                  onChange={e => set('cost', e.target.value)}
                  placeholder="0.00"
                  disabled={submitting}
                />
                {errors.cost && <div className="rap-field-err">{errors.cost}</div>}
              </div>

              {/* Maintenance Schedule */}
              <div className="rap-field" style={{ gridColumn: '1 / -1' }}>
                <label className="rap-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--rap-white)' }}>
                  <input
                    type="checkbox"
                    checked={form.requiresRegularService}
                    onChange={(e) => set('requiresRegularService', e.target.checked)}
                    disabled={submitting}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--rap-accent)' }}
                  />
                  <span>Regular service on every 6 months</span>
                </label>
                <div style={{ fontSize: '12px', color: 'var(--rap-mist)', marginTop: '4px', marginLeft: '24px' }}>
                  If checked, the system will automatically raise a maintenance ticket for this asset every 6 months.
                </div>
              </div>

              {/* Actions */}
              <div className="rap-actions">
                <button
                  type="button"
                  className="rap-btn rap-btn-cancel"
                  onClick={() => navigate('/dashboard')}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rap-btn rap-btn-submit"
                  disabled={submitting}
                >
                  {submitting ? 'Registering…' : 'Register Asset'}
                </button>
              </div>

            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
}
