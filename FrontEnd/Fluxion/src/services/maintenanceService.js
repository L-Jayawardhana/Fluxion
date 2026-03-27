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
