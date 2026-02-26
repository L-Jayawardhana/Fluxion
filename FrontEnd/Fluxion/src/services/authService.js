import api from './api';

export const authService = {
    login: (email, password) =>
        api.post('/auth/login', { email, password }),

    register: (fullName, email, password, orgId = null) =>
        api.post('/auth/register', { fullName, email, password, orgId }),
};
