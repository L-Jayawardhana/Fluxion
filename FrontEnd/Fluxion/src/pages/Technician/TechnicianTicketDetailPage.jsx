import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getTechnicianTicketDetail,
  updateTicketStatus,
  logRepair,
  addComment,
  updateAssetCondition,
} from '../../services/technicianService';
import './Technician.css';
import './TechnicianTickets.css';

/* ── Status flow ─────────────────────────────────────────── */
const NEXT_STATUSES = {
  open:           ['assigned', 'in_progress'],
  assigned:       ['in_progress', 'waiting_parts'],
  in_progress:    ['waiting_parts', 'resolved'],
  waiting_parts:  ['in_progress', 'resolved'],
  resolved:       ['closed'],
  closed:         [],
};
const CONDITION_OPTIONS = ['available', 'assigned', 'under_maintenance', 'retired'];

/* ── Helpers ─────────────────────────────────────────────── */
function fmtStatus(s) { return String(s || '').replace(/_/g, ' '); }
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/* ── Toast component ─────────────────────────────────────── */
function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div className={`tc-toast tc-toast-${type}`}>
      {type === 'success' ? '✅' : '⚠'} {msg}
    </div>
  );
}

/* ── TicketInfoPanel ─────────────────────────────────────── */
function TicketInfoPanel({ ticket }) {
  const a = ticket.asset;
  const r = ticket.reporter;
  return (
    <div className="tc-panel">
      <div className="tc-panel-head">
        <span className="tc-panel-title">Ticket Info</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <span className={`tc-badge tc-badge-${ticket.status}`}>{fmtStatus(ticket.status)}</span>
          <span className={`tc-pri ${ticket.priority}`}>{ticket.priority}</span>
        </div>
      </div>
      <div className="tc-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div className="tip-label">Title</div>
          <div className="tip-value">{ticket.title}</div>
        </div>
        <div>
          <div className="tip-label">Description</div>
          <div className="tip-value" style={{ whiteSpace: 'pre-wrap' }}>{ticket.issueDescription}</div>
        </div>
        <div className="tip-row-2">
          <div>
            <div className="tip-label">Created</div>
            <div className="tip-value">{fmtDate(ticket.createdAt)}</div>
          </div>
          <div>
            <div className="tip-label">Closed</div>
            <div className="tip-value">{fmtDate(ticket.closedAt)}</div>
          </div>
          {ticket.category && <div>
            <div className="tip-label">Category</div>
            <div className="tip-value">{ticket.category}</div>
          </div>}
        </div>

        {/* Asset Info */}
        <div className="tip-section">
          <div className="tip-section-title">🖥 Asset</div>
          <div className="tip-row-2">
            <div><div className="tip-label">Name</div><div className="tip-value">{a?.assetName ?? '—'}</div></div>
            <div><div className="tip-label">Serial</div><div className="tip-value">{a?.serialNumber ?? '—'}</div></div>
            <div><div className="tip-label">Type</div><div className="tip-value">{a?.assetType ?? '—'}</div></div>
            <div><div className="tip-label">Status</div>
              <div className="tip-value">
                <span className={`tc-badge tc-badge-${a?.status}`}>{fmtStatus(a?.status)}</span>
              </div>
            </div>
            {a?.department && <div><div className="tip-label">Department</div><div className="tip-value">{a.department}</div></div>}
          </div>
        </div>

        {/* Reporter Info */}
        {r && (
          <div className="tip-section">
            <div className="tip-section-title">👤 Reported By</div>
            <div className="tip-row-2">
              <div><div className="tip-label">Name</div><div className="tip-value">{r.name}</div></div>
              <div><div className="tip-label">Email</div><div className="tip-value">{r.email}</div></div>
              {r.department && <div><div className="tip-label">Department</div><div className="tip-value">{r.department}</div></div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── UpdateStatusWidget ──────────────────────────────────── */
function UpdateStatusWidget({ ticket, onUpdate }) {
  const nextStatuses = NEXT_STATUSES[ticket.status] ?? [];
  const [selected, setSelected] = useState(nextStatuses[0] ?? '');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: '' });

  const handleConfirm = async () => {
    if (!selected) return;
    setLoading(true);
    setToast({ msg: '', type: '' });
    try {
      await updateTicketStatus(ticket.ticketId, selected);
      setToast({ msg: `Status updated to "${fmtStatus(selected)}"`, type: 'success' });
      onUpdate();
    } catch {
      setToast({ msg: 'Failed to update status.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (nextStatuses.length === 0)
    return (
      <div className="tc-panel">
        <div className="tc-panel-head"><span className="tc-panel-title">Update Status</span></div>
        <div className="tc-panel-body">
          <div className="tc-empty" style={{ padding: '24px 0' }}>
            <div className="tc-empty-sub">This ticket is {fmtStatus(ticket.status)} — no further transitions allowed.</div>
          </div>
        </div>
      </div>
    );

  return (
    <div className="tc-panel">
      <div className="tc-panel-head"><span className="tc-panel-title">Update Status</span></div>
      <div className="tc-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Toast msg={toast.msg} type={toast.type} />
        <div className="tc-field">
          <label htmlFor="usw-status">Next Status</label>
          <select id="usw-status" value={selected} onChange={e => setSelected(e.target.value)}>
            {nextStatuses.map(s => <option key={s} value={s}>{fmtStatus(s)}</option>)}
          </select>
        </div>
        <button id="usw-confirm" className="tc-btn tc-btn-primary" onClick={handleConfirm} disabled={loading || !selected}>
          {loading ? <><span className="tc-spinner" /> Updating…</> : 'Confirm Status'}
        </button>
      </div>
    </div>
  );
}

/* ── LogRepairForm ───────────────────────────────────────── */
function LogRepairForm({ ticket, onUpdate }) {
  const [desc, setDesc] = useState('');
  const [cost, setCost] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: '' });

  if (ticket.status !== 'in_progress') return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!desc.trim()) return;
    setLoading(true);
    setToast({ msg: '', type: '' });
    try {
      await logRepair(ticket.ticketId, desc, cost ? parseFloat(cost) : null);
      setToast({ msg: 'Repair log saved successfully.', type: 'success' });
      setDesc('');
      setCost('');
      onUpdate();
    } catch {
      setToast({ msg: 'Failed to save repair log.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tc-panel">
      <div className="tc-panel-head"><span className="tc-panel-title">Log Repair</span></div>
      <div className="tc-panel-body">
        <Toast msg={toast.msg} type={toast.type} />
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="tc-field">
            <label htmlFor="lrf-desc">Repair Description *</label>
            <textarea id="lrf-desc" rows={4} required placeholder="Describe the repair carried out…"
              value={desc} onChange={e => setDesc(e.target.value)} />
          </div>
          <div className="tc-field">
            <label htmlFor="lrf-cost">Cost (optional)</label>
            <input id="lrf-cost" type="number" min="0" step="0.01" placeholder="e.g. 45.00"
              value={cost} onChange={e => setCost(e.target.value)} />
          </div>
          <button id="lrf-submit" type="submit" className="tc-btn tc-btn-primary" disabled={loading || !desc.trim()}>
            {loading ? <><span className="tc-spinner" /> Saving…</> : 'Submit Repair Log'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── CommentsSection ─────────────────────────────────────── */
function CommentsSection({ ticket, initialComments }) {
  const [comments, setComments] = useState(initialComments ?? []);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: '' });

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setToast({ msg: '', type: '' });
    try {
      const newComment = await addComment(ticket.ticketId, text.trim());
      setComments(prev => [...prev, newComment]);
      setText('');
      setToast({ msg: 'Comment added.', type: 'success' });
    } catch {
      setToast({ msg: 'Failed to add comment.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tc-panel">
      <div className="tc-panel-head"><span className="tc-panel-title">Comments ({comments.length})</span></div>
      <div className="tc-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Existing comments */}
        <div className="cs-scroll">
          {comments.length === 0 ? (
            <div className="tc-empty" style={{ padding: '20px 0' }}>
              <div className="tc-empty-sub">No comments yet. Be the first to add one.</div>
            </div>
          ) : (
            comments.map((c, i) => (
              <div className="cs-comment" key={i}>
                <div className="cs-avatar">{(c.authorName || 'T').charAt(0).toUpperCase()}</div>
                <div className="cs-body">
                  <div className="cs-header">
                    <span className="cs-author">{c.authorName || 'Technician'}</span>
                    <span className="cs-time">{new Date(c.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                  <div className="cs-text">{c.content}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add comment form */}
        <Toast msg={toast.msg} type={toast.type} />
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="tc-field">
            <label htmlFor="cs-input">Add Comment</label>
            <textarea id="cs-input" rows={3} placeholder="Type your comment…"
              value={text} onChange={e => setText(e.target.value)} />
          </div>
          <button id="cs-submit" type="submit" className="tc-btn tc-btn-primary"
            disabled={loading || !text.trim()} style={{ alignSelf: 'flex-end' }}>
            {loading ? <><span className="tc-spinner" /> Posting…</> : 'Post Comment'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── UpdateAssetConditionWidget ──────────────────────────── */
function UpdateAssetConditionWidget({ assetId }) {
  const [condition, setCondition] = useState(CONDITION_OPTIONS[0]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: '' });

  const handleSave = async () => {
    setLoading(true);
    setToast({ msg: '', type: '' });
    try {
      await updateAssetCondition(assetId, condition);
      setToast({ msg: `Asset condition updated to "${fmtStatus(condition)}"`, type: 'success' });
    } catch {
      setToast({ msg: 'Failed to update asset condition.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tc-panel">
      <div className="tc-panel-head"><span className="tc-panel-title">Update Asset Condition</span></div>
      <div className="tc-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Toast msg={toast.msg} type={toast.type} />
        <div className="tc-field">
          <label htmlFor="uac-cond">Condition</label>
          <select id="uac-cond" value={condition} onChange={e => setCondition(e.target.value)}>
            {CONDITION_OPTIONS.map(c => <option key={c} value={c}>{fmtStatus(c)}</option>)}
          </select>
        </div>
        <button id="uac-save" className="tc-btn tc-btn-primary" onClick={handleSave} disabled={loading}>
          {loading ? <><span className="tc-spinner" /> Saving…</> : 'Save Condition'}
        </button>
      </div>
    </div>
  );
}

/* ── MaintenanceHistoryPanel ─────────────────────────────── */
function MaintenanceHistoryPanel({ history }) {
  return (
    <div className="tc-panel">
      <div className="tc-panel-head"><span className="tc-panel-title">Asset Maintenance History</span></div>
      <div className="tc-panel-body">
        {history.length === 0 ? (
          <div className="tc-empty" style={{ padding: '20px 0' }}>
            <div className="tc-empty-sub">No previous maintenance records for this asset.</div>
          </div>
        ) : (
          <div className="mhp-list">
            {history.map((h, i) => (
              <div className="mhp-item" key={i}>
                <div className="mhp-title">#{h.ticketId} — {h.title}</div>
                <div className="mhp-meta">
                  <span className={`tc-badge tc-badge-${h.status}`}>{fmtStatus(h.status)}</span>
                  <span className="mhp-date">{fmtDate(h.closedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ████████████████████████████████████████████████████████████ */
export default function TechnicianTicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTicket = () => {
    setLoading(true);
    getTechnicianTicketDetail(id)
      .then(setTicket)
      .catch(() => setError('Ticket not found or not assigned to you.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadTicket(); }, [id]);

  if (loading) return (
    <div className="tc-page">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="tc-skeleton" style={{ height: 140, borderRadius: 14 }} />
        ))}
      </div>
    </div>
  );

  if (error || !ticket) return (
    <div className="tc-page">
      <div className="tc-toast tc-toast-error">⚠ {error || 'Ticket not found.'}</div>
      <button className="tc-btn tc-btn-secondary" onClick={() => navigate('/technician/tickets')}>
        ← Back to Tickets
      </button>
    </div>
  );

  return (
    <div className="tc-page">
      <div className="tc-header">
        <div>
          <div className="tc-eyebrow">Technician Portal</div>
          <h1 className="tc-title">Ticket #{ticket.ticketId}</h1>
        </div>
        <button className="tc-btn tc-btn-secondary" onClick={() => navigate('/technician/tickets')}>
          ← Back to Tickets
        </button>
      </div>

      <div className="td-layout">
        {/* Main column */}
        <div className="td-main">
          <TicketInfoPanel ticket={ticket} />
          <LogRepairForm ticket={ticket} onUpdate={loadTicket} />
          <CommentsSection ticket={ticket} initialComments={ticket.comments ?? []} />
        </div>

        {/* Side column */}
        <div className="td-side">
          <UpdateStatusWidget ticket={ticket} onUpdate={loadTicket} />
          <UpdateAssetConditionWidget assetId={ticket.asset?.assetId} />
          <MaintenanceHistoryPanel history={ticket.maintenanceHistory ?? []} />
        </div>
      </div>
    </div>
  );
}
