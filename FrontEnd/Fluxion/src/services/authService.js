import api from './api';

export const authService = {
    login: (email, password) =>
        api.post('/Auth/login', { email, password }),

    register: (fullName, email, password, orgId = null) =>
        api.post('/Auth/register', { fullName, email, password, orgId }),

    createOrganization: (orgName, slug, timezone, ownerId) =>
        api.post('/Organization', { orgName, slug, timezone, ownerId }),

    uploadOrgLogo: (orgId, file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/Organization/${orgId}/logo`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
};
