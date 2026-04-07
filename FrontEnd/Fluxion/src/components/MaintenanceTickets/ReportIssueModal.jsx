import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { createMaintenanceTicket } from '../../services/maintenanceService';
import './ReportIssueModal.css';

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

const PRIORITIES = [
  { value: 0, label: 'Low', emoji: '🟢', color: '#2D9456', bg: 'rgba(45,148,86,.1)', border: 'rgba(45,148,86,.35)', desc: 'Minor issue — can wait' },
  { value: 1, label: 'Medium', emoji: '🟡', color: '#C48C08', bg: 'rgba(196,140,8,.09)', border: 'rgba(196,140,8,.35)', desc: 'Noticeable — fix soon' },
  { value: 2, label: 'High', emoji: '🟠', color: '#C84B2F', bg: 'rgba(200,75,47,.09)', border: 'rgba(200,75,47,.35)', desc: 'Impacts productivity' },
  { value: 3, label: 'Critical', emoji: '🔴', color: '#8B0000', bg: 'rgba(139,0,0,.1)', border: 'rgba(139,0,0,.3)', desc: 'Asset unusable — urgent' },
];

export default function ReportIssueModal({ asset, onClose, onSuccess }) {
  const { user } = useAuth();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState(2); // High default
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Trap focus and disable background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, []);

  const liveValidate = (field, value) => {
    const errs = { ...fieldErrors };
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
    if (!title.trim()) errs.title = 'Title is required.';
    else if (title.length > 200) errs.title = 'Max 200 characters.';
    
    if (!description.trim()) errs.description = 'Description is required.';
    else if (description.length > 1000) errs.description = 'Max 1000 characters.';
    
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ title: true, description: true });
    
    const errs = validateAll();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    
    setError(null);
    setLoading(true);

    try {
      await createMaintenanceTicket({
        assetId: asset.assetId,
        orgId: user.orgId,
        title: title.trim(),
        description: description.trim(),
        priority
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Prevent clicking outside from closing if loading
  const handleBackdropClick = (e) => {
    if (e.target.className === 'rim-backdrop' && !loading) onClose();
  };

  return (
    <div className="rim-backdrop" onClick={handleBackdropClick}>
      <div className={`rim-modal ${submitted ? 'rim-modal-success' : ''}`}>
        
        {submitted ? (
          <div className="rim-success-state">
            <div className="rim-success-anim">
              <div className="rim-success-ring" />
              <div className="rim-success-check"><CheckCircleIcon /></div>
            </div>
            <h2>Ticket Submitted!</h2>
            <p>Your issue has been logged. The maintenance team will review it shortly.</p>
            <button className="rim-btn-primary" onClick={onSuccess}>Done</button>
          </div>
        ) : (
          <>
            <div className="rim-header">
              <div className="rim-icon-blob">
                <WrenchIcon />
              </div>
              <div className="rim-titles">
                <h2>Report an Issue</h2>
                <p>Log a maintenance request for <strong>{asset.assetName}</strong> ({asset.assetTag || 'No Tag'})</p>
              </div>
              <button className="rim-close" onClick={onClose} disabled={loading} title="Close">×</button>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              
              {error && <div className="rim-global-error">{error}</div>}

              {/* Title Field */}
              <div className={`rim-field ${touched.title && fieldErrors.title ? 'rim-field-error' : ''}`}>
                <label htmlFor="title">Issue Title <span className="rim-req">*</span></label>
                <input
                  id="title"
                  type="text"
                  placeholder="e.g. Broken screen, overheating..."
                  value={title}
                  maxLength={200}
                  disabled={loading}
                  onChange={e => {
                    setTitle(e.target.value);
                    if (touched.title) liveValidate('title', e.target.value);
                  }}
                  onBlur={() => {
                    setTouched(t => ({...t, title: true}));
                    liveValidate('title', title);
                  }}
                />
                <div className="rim-field-footer">
                  <span className="rim-err-text">{touched.title && fieldErrors.title ? fieldErrors.title : ''}</span>
                  <span className="rim-char-count">{title.length}/200</span>
                </div>
              </div>

              {/* Description Field */}
              <div className={`rim-field ${touched.description && fieldErrors.description ? 'rim-field-error' : ''}`}>
                <label htmlFor="description">Detailed Description <span className="rim-req">*</span></label>
                <textarea
                  id="description"
                  placeholder="Describe what's wrong, steps to reproduce, or any error sounds/codes..."
                  value={description}
                  rows={4}
                  maxLength={1000}
                  disabled={loading}
                  onChange={e => {
                    setDescription(e.target.value);
                    if (touched.description) liveValidate('description', e.target.value);
                  }}
                  onBlur={() => {
                    setTouched(t => ({...t, description: true}));
                    liveValidate('description', description);
                  }}
                />
                <div className="rim-field-footer">
                  <span className="rim-err-text">{touched.description && fieldErrors.description ? fieldErrors.description : ''}</span>
                  <span className="rim-char-count">{description.length}/1000</span>
                </div>
              </div>

              {/* Priority Selector */}
              <div className="rim-field">
                <label>Priority <span className="rim-req">*</span></label>
                <div className="rim-priority-grid">
                  {PRIORITIES.map(p => {
                    const active = priority === p.value;
                    return (
                      <button
                        key={p.value}
                        type="button"
                        className={`rim-priority-card ${active ? 'active' : ''}`}
                        style={active ? { borderColor: p.border, background: p.bg, color: p.color } : {}}
                        onClick={() => setPriority(p.value)}
                        disabled={loading}
                      >
                        <span className="rim-p-emoji">{p.emoji}</span>
                        <span className="rim-p-label">{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rim-actions">
                <button type="button" className="rim-btn-cancel" onClick={onClose} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="rim-btn-primary" disabled={loading}>
                  {loading ? <div className="rim-spinner" /> : <WrenchIcon />}
                  {loading ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
