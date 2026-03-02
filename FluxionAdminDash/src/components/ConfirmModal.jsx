import React from 'react';

export default function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="overlay open">
      <div className="modal" style={{ width: '400px' }}>
        <div className="modal-head">
          <div className="modal-title">{title}</div>
          <button className="modal-x" onClick={onCancel}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: '1.5' }}>
            {message}
          </p>
        </div>
        <div className="modal-foot">
          <button className="mc" onClick={onCancel}>Cancel</button>
          <button className="mok" style={{ background: 'var(--red)', boxShadow: 'none' }} onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}
