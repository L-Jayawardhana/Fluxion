import api from './api';

export const GOOGLE_CLIENT_ID = '490325311461-mul6aqc9jd27i5241tmf0rhgn3abc3ni.apps.googleusercontent.com';

export const authService = {
    login: (email, password, rememberMe = false) =>
        api.post('/Auth/login', { email, password, rememberMe }),

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

    forgotPassword: (email) =>
        api.post('/Auth/forgot-password', { email }),

    resetPassword: (email, code, newPassword) =>
        api.post('/Auth/reset-password', { email, code, newPassword }),

    verifyResetCode: (email, code) =>
        api.post('/Auth/verify-reset-code', { email, code }),

    changePassword: (currentPassword, newPassword) =>
        api.post('/Auth/change-password', { currentPassword, newPassword }),

    createOrganization: (orgName, slug, timezone, ownerId, token = null) => {
        // During registration, the fresh JWT is passed explicitly to avoid
        // any sessionStorage read-timing issues in the Axios interceptor.
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        return api.post('/Organization', { orgName, slug, timezone, ownerId }, config);
    },

    uploadOrgLogo: (orgId, logoData, token = null) => {
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        return api.post(`/Organization/${orgId}/logo-base64`, logoData, config);
    },
};
