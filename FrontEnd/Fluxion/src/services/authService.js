import api from './api';

export const GOOGLE_CLIENT_ID = '490325311461-mul6aqc9jd27i5241tmf0rhgn3abc3ni.apps.googleusercontent.com';

export const authService = {
    login: (email, password) =>
        api.post('/Auth/login', { email, password }),

    register: (fullName, email, password, orgId = null) =>
        api.post('/Auth/register', { fullName, email, password, orgId }),

    googleLogin: (idToken) =>
        api.post('/Auth/google', { idToken }),

    sendVerificationCode: (email) =>
        api.post('/Auth/send-verification-code', { email }),

    verifyCode: (email, code) =>
        api.post('/Auth/verify-code', { email, code }),

    sendWelcomeEmail: (email, firstName, orgName, workspaceSlug, planName) =>
        api.post('/Auth/send-welcome-email', { email, firstName, orgName, workspaceSlug, planName }),

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
