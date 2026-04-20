import React, { useState, useEffect } from 'react';
import { getMaintenanceTickets, assignTicket, getTechnicians } from '../../services/maintenanceService';
import { useAuth } from '../../hooks/useAuth';
import './TicketList.css';

const TicketList = ({ filters }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [technicians, setTechnicians] = useState([]);
  const [assigningTech, setAssigningTech] = useState({});
  const [assigningLoading, setAssigningLoading] = useState(false);
  const canAssign = user?.role === 'owner' || user?.role === 'admin';
  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  useEffect(() => {
    // Reset to page 1 when filters change (except page change itself)
    fetchTickets(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    if (canAssign && user?.orgId) {
      getTechnicians(user.orgId).then(setTechnicians).catch(console.error);
    }
  }, [canAssign, user]);

  const handleAssign = async (ticketId) => {
    const techId = assigningTech[ticketId];
    if (!techId) return;
    setAssigningLoading(true);
    try {
      await assignTicket(ticketId, techId);
      fetchTickets(pagination.pageNumber);
    } catch (error) {
      console.error("Failed to assign ticket", error);
    } finally {
      setAssigningLoading(false);
      setAssigningTech(prev => ({ ...prev, [ticketId]: '' }));
    }
  };

  const fetchTickets = async (pageToFetch = pagination.pageNumber) => {
    try {
      setLoading(true);
      const requestFilters = { ...filters, pageNumber: pageToFetch, pageSize: 10 };
      const response = await getMaintenanceTickets(requestFilters);
      
      if (response && response.isSuccess) {
        setTickets(response.data.items || []);
        setPagination({
          pageNumber: response.data.pageNumber,
          pageSize: response.data.pageSize,
          totalCount: response.data.totalCount,
          totalPages: response.data.totalPages,
          hasNextPage: response.data.hasNextPage,
          hasPreviousPage: response.data.hasPreviousPage,
        });

        // Pre-set assigningTech with current values for unassigned or assigned tickets
        const currentAssigns = {};
        response.data.items.forEach(t => {
          if (t.assignedTo) {
            currentAssigns[t.ticketId] = t.assignedTo;
          }
        });
        setAssigningTech(prev => ({ ...prev, ...currentAssigns }));
      }
    } catch (error) {
      console.error("Failed to fetch tickets", error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNextPage = () => {
    if (pagination.hasNextPage) {
      fetchTickets(pagination.pageNumber + 1);
    }
  };

  const handlePrevPage = () => {
    if (pagination.hasPreviousPage) {
      fetchTickets(pagination.pageNumber - 1);
    }
  };

  const getPriorityClass = (priority) => {
    const str = String(priority).toLowerCase();
    switch(str) {
      case '3':
      case 'critical': return 'badge critical';
      case '2':
      case 'high': return 'badge high';
      case '1':
      case 'medium': return 'badge medium';
      case '0':
      case 'low': return 'badge low';
      default: return 'badge';
    }
  };

  const getStatusClass = (status) => {
    const str = String(status).toLowerCase();
    switch(str) {
      case '0':
      case 'open': return 'badge status-open';
      case '1':
      case 'assigned': return 'badge status-assigned';
      case '2':
      case 'in_progress': return 'badge status-progress';
      case '3':
      case 'waiting_parts': return 'badge status-waiting';
      case '4':
      case 'resolved': return 'badge status-resolved';
      case '5':
      case 'closed': return 'badge status-closed';
      default: return 'badge';
    }
  };

  const STATUS_MAP = {
    0: 'OPEN', 1: 'ASSIGNED', 2: 'IN PROGRESS', 3: 'WAITING PARTS', 4: 'RESOLVED', 5: 'CLOSED',
    'open': 'OPEN', 'assigned': 'ASSIGNED', 'in_progress': 'IN PROGRESS', 'waiting_parts': 'WAITING PARTS', 'resolved': 'RESOLVED', 'closed': 'CLOSED'
  };

  const PRIORITY_MAP = {
    0: 'LOW', 1: 'MEDIUM', 2: 'HIGH', 3: 'CRITICAL',
    'low': 'LOW', 'medium': 'MEDIUM', 'high': 'HIGH', 'critical': 'CRITICAL'
  };

  if (loading) {
    return (
      <div className="ticket-list">
        {[1, 2, 3].map((n) => (
          <div key={n} className="ticket-card skeleton-card">
            <div className="skeleton title"></div>
            <div className="skeleton text"></div>
            <div className="skeleton text short"></div>
          </div>
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="ticket-list empty-state">
        <p>No maintenance tickets found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="ticket-list-wrapper">
      <div className="ticket-list">
        {tickets.map(ticket => (
          <div key={ticket.ticketId} className="ticket-card">
            <div className="card-header">
              <h3>{ticket.title}</h3>
              <div className="badges">
                <span className={getStatusClass(ticket.status)}>
                  {STATUS_MAP[ticket.status] || String(ticket.status)}
                </span>
                <span className={getPriorityClass(ticket.priority)}>
                  {PRIORITY_MAP[ticket.priority] || String(ticket.priority)}
                </span>
              </div>
            </div>
            <div className="card-body">
              <p><strong>Asset:</strong> {ticket.assetName}</p>
              <p><strong>Reported By:</strong> {ticket.reportedByUserName}</p>
              <div className="assignment-container">
                <p style={{ margin: 0 }}><strong>Assigned To:</strong> {ticket.assignedTechnicianName || 'Unassigned'}</p>
                {canAssign && (
                  <div className="assign-select-wrapper">
                    <select 
                      className="assign-select"
                      value={assigningTech[ticket.ticketId] || ''} 
                      onChange={(e) => setAssigningTech(prev => ({ ...prev, [ticket.ticketId]: e.target.value }))}
                    >
                      <option value="">{ticket.assignedTo ? 'Reassign...' : 'Select Tech...'}</option>
                      {technicians.map(t => (
                        <option key={t.userId} value={t.userId}>{t.fullName}</option>
                      ))}
                    </select>
                    <button 
                      className="btn-assign"
                      onClick={() => handleAssign(ticket.ticketId)}
                      disabled={(assigningTech[ticket.ticketId] == (ticket.assignedTo || '')) || assigningLoading}
                    >
                      {ticket.assignedTo ? 'Change' : 'Assign'}
                    </button>
                  </div>
                )}
              </div>
              <p><strong>Created:</strong> {new Date(ticket.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="pagination-controls">
        <button 
          onClick={handlePrevPage} 
          disabled={!pagination.hasPreviousPage}
          className="btn-page"
        >
          Previous
        </button>
        <span className="page-info">
          Page {pagination.pageNumber} of {Math.max(1, pagination.totalPages)}
        </span>
        <button 
          onClick={handleNextPage} 
          disabled={!pagination.hasNextPage}
          className="btn-page"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default TicketList;
