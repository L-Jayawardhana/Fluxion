import api from './api';

export const authService = {
    login: (email, password) =>
        api.post('/Auth/login', { email, password }),

    register: (fullName, email, password, orgId = null) =>
        api.post('/Auth/register', { fullName, email, password, orgId }),
};
