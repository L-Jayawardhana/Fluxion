import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTechnicianTickets } from '../../services/technicianService';
import './Technician.css';
import './TechnicianTickets.css';

/* ── Status / Priority helpers ─────────────────────────────── */
const STATUS_OPTIONS = ['', 'open', 'assigned', 'in_progress', 'waiting_parts', 'resolved', 'closed'];
const PRIORITY_OPTIONS = ['', 'low', 'medium', 'high', 'critical'];

function fmtStatus(s) { return String(s || '').replace(/_/g, ' '); }
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ── FilterBar ─────────────────────────────────────────────── */
function TechnicianFilterBar({ filters, onChange, onClear }) {
  const debounceRef = useRef(null);

  const handleKeyword = (e) => {
    const val = e.target.value;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onChange({ keyword: val }), 300);
  };

  return (
    <div className="tfl-bar">
      <div className="tfl-group">
        <input
          id="tfl-keyword" type="text" placeholder="🔍 Search tickets…"
          defaultValue={filters.keyword}
          onChange={handleKeyword}
          className="tfl-input"
        />
      </div>

      <div className="tfl-group">
        <select
          id="tfl-status" value={filters.status}
          onChange={e => onChange({ status: e.target.value })}
          className="tfl-select"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.filter(Boolean).map(s => (
            <option key={s} value={s}>{fmtStatus(s)}</option>
          ))}
        </select>
      </div>

      <div className="tfl-group">
        <select
          id="tfl-priority" value={filters.priority}
          onChange={e => onChange({ priority: e.target.value })}
          className="tfl-select"
        >
          <option value="">All Priorities</option>
          {PRIORITY_OPTIONS.filter(Boolean).map(p => (
            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="tfl-group">
        <input
          id="tfl-from" type="date" value={filters.dateFrom}
          onChange={e => onChange({ dateFrom: e.target.value })}
          className="tfl-input"
        />
      </div>
      <div className="tfl-group">
        <input
          id="tfl-to" type="date" value={filters.dateTo}
          onChange={e => onChange({ dateTo: e.target.value })}
          className="tfl-input"
        />
      </div>

      <button className="tfl-clear tc-btn tc-btn-secondary" onClick={onClear}>
        Clear
      </button>
    </div>
  );
}

/* ── Skeleton card ─────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="ttl-card">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[70, 45, 55].map((w, i) => (
          <div key={i} className="tc-skeleton" style={{ height: 13, width: `${w}%` }} />
        ))}
      </div>
    </div>
  );
}

/* ── Ticket card ───────────────────────────────────────────── */
function TicketCard({ ticket, onClick }) {
  return (
    <div className="ttl-card" onClick={onClick} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}>
      <div className="ttl-card-top">
        <div className="ttl-card-title">#{ticket.ticketId} — {ticket.title}</div>
        <div className="ttl-card-badges">
          <span className={`tc-badge tc-badge-${ticket.status}`}>{fmtStatus(ticket.status)}</span>
          <span className={`tc-pri ${ticket.priority}`}>{ticket.priority}</span>
        </div>
      </div>
      <div className="ttl-card-meta">
        <span>🖥 {ticket.assetName}</span>
        <span>👤 {ticket.reportedBy || '—'}</span>
        <span>📅 {fmtDate(ticket.createdAt)}</span>
        {ticket.cost != null && <span>💰 ${Number(ticket.cost).toFixed(2)}</span>}
      </div>
    </div>
  );
}

/* ████████████████████████████████████████████████████████████ */
export default function TechnicianTicketsPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ keyword: '', status: '', priority: '', dateFrom: '', dateTo: '' });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const load = useCallback((f, p) => {
    setLoading(true);
    setError('');
    getTechnicianTickets({ ...f, page: p, pageSize: PAGE_SIZE })
      .then(d => setData(d))
      .catch(() => setError('Failed to load tickets.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(filters, page); }, [filters, page, load]);

  const handleFilterChange = (changes) => {
    setPage(1);
    setFilters(prev => ({ ...prev, ...changes }));
  };

  const clearFilters = () => {
    setPage(1);
    setFilters({ keyword: '', status: '', priority: '', dateFrom: '', dateTo: '' });
  };

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;

  return (
    <div className="tc-page">
      <div className="tc-header">
        <div>
          <div className="tc-eyebrow">Technician Portal</div>
          <h1 className="tc-title">My Tickets</h1>
          <p className="tc-subtitle">Browse and manage your assigned maintenance tickets.</p>
        </div>
        {data && (
          <div style={{ fontSize: 13, color: 'var(--tc-muted)' }}>
            {data.total} ticket{data.total !== 1 ? 's' : ''} found
          </div>
        )}
      </div>

      <TechnicianFilterBar filters={filters} onChange={handleFilterChange} onClear={clearFilters} />

      {error && <div className="tc-toast tc-toast-error">⚠ {error}</div>}

      <div className="ttl-list">
        {loading ? (
          [...Array(5)].map((_, i) => <SkeletonCard key={i} />)
        ) : data?.items?.length === 0 ? (
          <div className="tc-empty">
            <div className="tc-empty-icon">🎫</div>
            <div className="tc-empty-title">No Tickets Found</div>
            <div className="tc-empty-sub">No tickets match your current filters. Try clearing them.</div>
          </div>
        ) : (
          data?.items?.map(t => (
            <TicketCard
              key={t.ticketId}
              ticket={t}
              onClick={() => navigate(`/technician/tickets/${t.ticketId}`)}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="ttl-pagination">
          <button className="tc-btn tc-btn-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            ← Prev
          </button>
          <span style={{ fontSize: 13, color: 'var(--tc-muted)' }}>
            Page {page} of {totalPages}
          </span>
          <button className="tc-btn tc-btn-secondary" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
