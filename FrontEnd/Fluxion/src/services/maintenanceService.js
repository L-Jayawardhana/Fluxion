import api from './api';

export const createMaintenanceTicket = async (ticketData) => {
  const response = await api.post('/maintenance-tickets', ticketData);
  return response.data;
};

export const getMaintenanceTickets = async (filters) => {
  const cleanFilters = {};
  if (filters) {
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
        cleanFilters[key] = filters[key];
      }
    });
  }
  const response = await api.get('/maintenance-tickets', { params: cleanFilters });
  return response.data;
};

export const assignTicket = async (ticketId, technicianId) => {
  const response = await api.patch(`/maintenance-tickets/${ticketId}/assign`, { technicianId });
  return response.data;
};

export const getTechnicians = async (orgId) => {
  const response = await api.get('/user', { params: { orgId } });
  // Filter for 'technician' role
  return response.data.filter(u => u.role === 'technician');
};
