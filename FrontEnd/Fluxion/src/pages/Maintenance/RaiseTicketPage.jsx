import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { createMaintenanceTicket } from '../../services/maintenanceService';
import './RaiseTicketPage.css';

/* ── SVG Icons ───────────────────────────────────────────────── */
const WrenchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const CheckCircleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const AlertTriangleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const FileIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

const PRIORITIES = [
  { value: 0, label: 'Low',      emoji: '🟢', color: '#2D9456', bg: 'rgba(45,148,86,.1)',   border: 'rgba(45,148,86,.35)',  desc: 'Minor issue — can wait' },
  { value: 1, label: 'Medium',   emoji: '🟡', color: '#C48C08', bg: 'rgba(196,140,8,.09)',  border: 'rgba(196,140,8,.35)',   desc: 'Noticeable — fix soon' },
  { value: 2, label: 'High',     emoji: '🟠', color: '#C84B2F', bg: 'rgba(200,75,47,.09)',  border: 'rgba(200,75,47,.35)',   desc: 'Impacts productivity' },
  { value: 3, label: 'Critical', emoji: '🔴', color: '#8B0000', bg: 'rgba(139,0,0,.1)',     border: 'rgba(139,0,0,.3)',      desc: 'Asset unusable — urgent' },
];

export default function RaiseTicketPage() {
  const { user } = useAuth();
  
  // Form State
  const [assets, setAssets] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState(2); // default High
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  const isOwner = user?.role === 'owner' || user?.role === 'systemAdmin' || user?.role === 'manager';

  /* ── Fetch Assets ──────────────────────────────────────────── */
  useEffect(() => {
    if (!user?.orgId) return;
    let cancelled = false;
    setLoadingAssets(true);

    const fetchAssets = async () => {
      try {
        let data = [];
        if (isOwner) {
          // Owner sees all assets in org
          const res = await api.get(`/Asset?orgId=${user.orgId}`);
          data = res.data;
        } else {
          // Employee sees only their assigned assets
          const res = await api.get(`/Asset/user/${user.userId}?orgId=${user.orgId}`);
          data = res.data;
        }
        
        // Filter out retired or currently under maintenance assets
        if (!cancelled) {
          const eligible = data.filter(a => a.status !== 'retired' && a.status !== 'under_maintenance');
          setAssets(eligible);
        }
      } catch {
        if (!cancelled) setError("Failed to load assets. Please try again.");
      } finally {
        if (!cancelled) setLoadingAssets(false);
      }
    };

    fetchAssets();
    return () => { cancelled = true; };
  }, [user, isOwner]);

  /* ── Validation ──────────────────────────────────────────── */
  const liveValidate = (field, value) => {
    const errs = { ...fieldErrors };
    if (field === 'assetId') {
      if (!value) errs.assetId = 'Please select an asset.';
      else delete errs.assetId;
    }
    if (field === 'title') {
      if (!value.trim()) errs.title = 'Title is required.';
      else if (value.length > 200) errs.title = 'Max 200 characters.';
      else delete errs.title;
    }
    if (field === 'description') {
      if (!value.trim()) errs.description = 'Description is required.';
      else if (value.length > 1000) errs.description = 'Max 1000 characters.';
      else delete errs.description;
    }
    setFieldErrors(errs);
  };

  const validateAll = () => {
    const errs = {};
    if (!selectedAssetId) errs.assetId = 'Please select an asset.';
    if (!title.trim()) errs.title = 'Title is required.';
    else if (title.length > 200) errs.title = 'Max 200 characters.';
    if (!description.trim()) errs.description = 'Description is required.';
    else if (description.length > 1000) errs.description = 'Max 1000 characters.';
    return errs;
  };

  /* ── Submission ──────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ assetId: true, title: true, description: true });
    
    const errs = validateAll();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await createMaintenanceTicket({
        assetId: parseInt(selectedAssetId, 10),
        orgId: user.orgId,
        title: title.trim(),
        description: description.trim(),
        priority,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Failed to submit ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedPriority = PRIORITIES.find(p => p.value === priority);
  const selectedAsset = assets.find(a => a.assetId === parseInt(selectedAssetId, 10));

  /* ── Render ──────────────────────────────────────────────── */
  if (submitted) {
    return (
      <div className="page rt-page">
        <div className="rt-empty-state">
           <div className="rt-success-anim">
            <div className="rt-success-ring" />
            <div className="rt-success-check"><CheckCircleIcon /></div>
          </div>
          <h2 className="rt-empty-title">Ticket Submitted!</h2>
          <p className="rt-empty-desc" style={{ maxWidth: '400px', margin: '0 auto' }}>
            Your issue for <strong>{selectedAsset?.assetName}</strong> has been logged.
            The maintenance team will review it shortly.
          </p>
          <div className="rt-ticket-summary">
             Ticket Priority: <span style={{ color: selectedPriority.color, fontWeight: 700 }}>{selectedPriority.label}</span>
          </div>
          <button className="rt-btn rt-btn-primary" style={{ marginTop: '24px' }} onClick={() => {
             setSubmitted(false);
             setTitle('');
             setDescription('');
             setSelectedAssetId('');
             setTouched({});
             setFieldErrors({});
             // remove the submitted asset from list
             setAssets(assets.filter(a => a.assetId !== parseInt(selectedAssetId, 10)));
          }}>
             Report Another Issue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page rt-page">
      <div className="rt-header">
        <div className="rt-header-icon"><WrenchIcon /></div>
        <div className="rt-header-text">
          <h1>Raise a Ticket</h1>
          <p>Report issues for assets requiring maintenance or repairs.</p>
        </div>
      </div>

      <div className="rt-layout">
        <div className="rt-main-col">
          <form className="rt-form-card" onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="rt-alert">
                <AlertTriangleIcon />
                <span>{error}</span>
              </div>
            )}

            {/* Asset Selection */}
            <div className={`rt-field ${(touched.assetId && fieldErrors.assetId) || (assets.length === 0 && !loadingAssets) ? 'rt-field-error' : ''}`}>
              <label htmlFor="rt-asset" className="rt-label">
                Select Asset <span className="rt-req">*</span>
              </label>
              <div className="rt-select-wrapper">
                <select
                  id="rt-asset"
                  className="rt-select"
                  value={selectedAssetId}
                  disabled={loadingAssets || loading || assets.length === 0}
                  onChange={e => {
                    setSelectedAssetId(e.target.value);
                    if (touched.assetId) liveValidate('assetId', e.target.value);
                  }}
                  onBlur={() => {
                    setTouched(t => ({ ...t, assetId: true }));
                    liveValidate('assetId', selectedAssetId);
                  }}
                >
                  <option value="" disabled>-- Select an asset --</option>
                  {assets.map(a => (
                    <option key={a.assetId} value={a.assetId}>
                      {a.assetName} {a.assetTag ? `(${a.assetTag})` : ''} - {a.departmentName || 'No Dept'}
                    </option>
                  ))}
                </select>
              </div>
              {touched.assetId && fieldErrors.assetId && (
                <div className="rt-field-errmsg" style={{marginTop: '6px'}}>{fieldErrors.assetId}</div>
              )}
              {assets.length === 0 && !loadingAssets && (
                <div className="rt-field-hint" style={{ color: '#C84B2F', marginTop: '6px', fontSize: '11px', fontWeight: 600 }}>
                  No available assets found to report issues against.
                </div>
              )}
            </div>

            {/* Title */}
            <div className={`rt-field ${touched.title && fieldErrors.title ? 'rt-field-error' : ''}`}>
              <label htmlFor="rt-title" className="rt-label">
                Issue Title <span className="rt-req">*</span>
              </label>
              <input
                id="rt-title"
                type="text"
                className="rt-input"
                placeholder="e.g. Screen flickering, Battery draining fast…"
                value={title}
                maxLength={200}
                disabled={loading}
                onChange={e => {
                  setTitle(e.target.value);
                  if (touched.title) liveValidate('title', e.target.value);
                }}
                onBlur={() => {
                  setTouched(t => ({ ...t, title: true }));
                  liveValidate('title', title);
                }}
              />
              <div className="rt-footer-row">
                <span className="rt-field-errmsg">{touched.title && fieldErrors.title ? fieldErrors.title : ''}</span>
                <span className="rt-char-count">{title.length}/200</span>
              </div>
            </div>

            {/* Description */}
            <div className={`rt-field ${touched.description && fieldErrors.description ? 'rt-field-error' : ''}`}>
              <label htmlFor="rt-desc" className="rt-label">
                Detailed Description <span className="rt-req">*</span>
              </label>
              <textarea
                id="rt-desc"
                className="rt-textarea"
                placeholder="Describe what's happening, when it started, and steps to reproduce…"
                value={description}
                maxLength={1000}
                rows={5}
                disabled={loading}
                onChange={e => {
                  setDescription(e.target.value);
                  if (touched.description) liveValidate('description', e.target.value);
                }}
                onBlur={() => {
                  setTouched(t => ({ ...t, description: true }));
                  liveValidate('description', description);
                }}
              />
              <div className="rt-footer-row">
                <span className="rt-field-errmsg">{touched.description && fieldErrors.description ? fieldErrors.description : ''}</span>
                <span className="rt-char-count">{description.length}/1000</span>
              </div>
            </div>

            {/* Priority Slider/Grid */}
            <div className="rt-field">
              <div className="rt-priority-header">
                <span className="rt-label">Priority <span className="rt-req">*</span></span>
                <span className="rt-priority-hint" style={{ color: selectedPriority.color }}>
                  {selectedPriority.emoji} {selectedPriority.desc}
                </span>
              </div>
              <div className="rt-priority-grid">
                {PRIORITIES.map(p => {
                  const active = priority === p.value;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      className={`rt-priority-btn ${active ? 'rt-priority-btn--active' : ''}`}
                      style={active ? { borderColor: p.border, background: p.bg, color: p.color } : {}}
                      onClick={() => setPriority(p.value)}
                      disabled={loading}
                    >
                      <span className="rt-p-emoji">{p.emoji}</span>
                      <span className="rt-p-label">{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Action */}
            <div className="rt-form-actions">
              <button
                type="submit"
                className="rt-btn rt-btn-primary"
                disabled={loading || assets.length === 0}
              >
                {loading ? <span className="rt-spinner" /> : <WrenchIcon />}
                {loading ? 'Submitting…' : 'Submit Ticket'}
              </button>
            </div>
          </form>
        </div>

        {/* Side Info Panel */}
        <div className="rt-side-col">
          <div className="rt-info-card">
            <div className="rt-info-icon"><FileIcon /></div>
            <h3>Ticket Guidelines</h3>
            <p>Providing clear and detailed information helps our maintenance team resolve your issue faster.</p>
            <ul className="rt-guidelines">
              <li><strong>Select the specific asset</strong> you are experiencing trouble with.</li>
              <li><strong>Be descriptive:</strong> Include exactly what is broken and the context.</li>
              <li><strong>Assign correct priority:</strong> Please reserve Critical priority for genuinely unusable assets that halt operations.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
