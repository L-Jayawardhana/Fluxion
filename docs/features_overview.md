# Fluxion Features Overview

This document provides a summary of the recently implemented authentication and registration features in the Fluxion application.

## 1. Registration Flow with Email Verification
To ensure valid accounts, the registration flow (`/register`) now requires users to verify their email address before proceeding.

- **Process**:
  1. The user enters their First Name, Last Name, Email, and Password.
  2. The user clicks **Verify** next to the email field.
  3. The backend generates a secure 6-digit code (valid for 10 minutes) and sends a branded HTML email via SMTP.
  4. The user enters the code into the verification input that appears.
  5. Upon successful verification, a "Verified" badge appears, and the user is allowed to proceed to Step 2 (Organisation Setup).
- **Backend Service**: `IVerificationCodeService` manages in-memory, short-lived storage of verification codes.

## 2. Organisation Welcome Email
Upon successfully completing the registration process and creating an organisation, the system automatically sends a "Welcome to Your Workspace" email.

- **Branding**: The email uses a modern, responsive HTML/CSS template featuring the Poppins font and the Fluxion logo (rendered natively in HTML/CSS).
- **Content**: 
  - Welcomes the user by their First Name.
  - Confirms their Organisation Name, Workspace URL, and Plan.
  - Outlines the 4 main steps to get started (Departments, Assets, Team, Assignments).
  - Provides a direct call-to-action button linking back to the platform.
- **Execution**: The email is fired-and-forgotten via `SendWelcomeEmailCommand` to ensure it does not block the UI while the user transitions into the dashboard.

## 3. Google Sign-In & Existing User Redirects
Google OAuth has been heavily integrated into both the Login and Registration pages to reduce friction.

- **Custom UI Integration**: The official Google GSI buttons are rendered invisibly and overlaid on top of heavily styled, custom Fluxion buttons. This allows for native visual styling while retaining the secure, one-tap iframe interaction provided by Google.
- **Smart Routing (Registration)**: 
  - If a **new user** attempts to sign up with Google on the `/register` page, the backend creates their account with `isNewUser = true`. The frontend then automatically pre-fills their name and email, stores their token, and skips Step 1, dropping them directly into Step 2 (Organisation Setup).
- **Smart Routing (Login)**:
  - Conversely, if an **unregistered user** mistakenly clicks "Continue with Google" on the `/login` page instead of `/register`, the system detects `isNewUser = true`.
  - Instead of throwing an error, the Login page seamlessly passes the Google data to the Register page via React Router state.
  - The `/register` page detects this incoming state, accepts the token without forcing a re-login, and immediately jumps the user to Step 2.
- **Existing Users on Registration**: 
  - If a user who **already has an account** clicks "Sign up with Google" on the `/register` page, the system detects `isNewUser = false`.
  - Instead of forcing them to create a new Organisation, the register page immediately switches them to a "Login" state and redirects them straight to `/dashboard`.

---

## 4. Admin Dashboard — User Management
The Admin Dashboard (`FluxionAdminDash`) provides a dedicated Users page for system administrators to manage all platform users.

- **View All Users**: Displays a table of all users with name, email, role, organisation, status, last login, and join date.
- **Role Filtering**: Filter by role using pill buttons: `All`, `Owner`, `Admin`, `Technician`, `User`, `SystemAdmin`. Each pill displays a live count of matching users.
- **Inline Edit Modal**: Clicking the edit (pencil) icon opens a styled modal with:
  - Editable fields: Name, Email, Role (dropdown), Active Status (checkbox).
  - Save/Cancel buttons.
  - All fields are pre-populated with the user's current data.
- **Delete with Confirmation**: Clicking the delete (trash) icon opens a `ConfirmModal` component that requires explicit confirmation. On confirm, the user is **permanently deleted** (hard delete) from the database.
- **Toast Notifications**: All operations (success and failure) surface as non-blocking toast notifications via the `ToastContext` system, replacing native `alert()` calls.

## 5. Admin Dashboard — Organisation Management
The Admin Dashboard provides an Organisations page for managing all platform organisations.

- **View All Organisations**: Displays a rich table with logo, name, slug, plan, owner, user count, asset count, seat usage bar, and status.
- **Status Filtering**: Filter by `All`, `Active`, or `Inactive`.
- **Logo Support**: Organisations with uploaded logos display them inline; others show a coloured initial avatar.
- **Seat Usage Visualisation**: A colour-coded progress bar shows user-to-seat-limit ratio (green < 70%, amber 70–90%, red > 90%).
- **Inline Edit Modal**: Clicking the edit icon opens a styled modal with:
  - Editable fields: Name, Slug, Active Status (checkbox).
  - Save/Cancel buttons.
- **Delete with Confirmation**: Clicking the delete icon opens a `ConfirmModal`. On confirm, the organisation is **permanently deleted** (hard delete).
- **Toast Notifications**: Same toast system as the Users page.

## 6. Admin Dashboard — Shared UI Components

### ConfirmModal
A reusable confirmation dialog component (`components/ConfirmModal.jsx`) used for all destructive actions.
- **Props**: `open`, `title`, `message`, `onConfirm`, `onCancel`.
- **Styling**: Uses the application's shared `.overlay`, `.modal`, `.modal-head`, `.modal-foot` CSS classes with a red "Delete" button.
- **Backdrop**: Clicking outside the modal cancels the action.

### ToastContext
A global notification system (`context/ToastContext.jsx`) providing non-blocking feedback.
- **Usage**: Wrap the app in `<ToastProvider>` and call `addToast(message, type)` from any component via `useToast()`.
- **Types**: `success` (green), `error` (red), `info` (default blue).
- **Behaviour**: Toasts auto-dismiss after 3 seconds and can be clicked to dismiss early.
- **Position**: Fixed to the bottom-right corner of the viewport.

## 7. Organisation Logo Upload
Organisations can have a custom logo uploaded via the Admin Dashboard or during setup.

- **Endpoint**: `POST /api/Organization/{id}/logo`
- **Constraints**: PNG, JPG, SVG, or WebP only; max 2 MB.
- **Storage**: Saved to `wwwroot/uploads/logos/` with a unique filename (`org-{id}-{guid}.{ext}`).
- **Display**: The `OrganizationsPage` renders logos inline in the table. If no logo exists, a coloured initial avatar is shown.

## 8. Password Reset Flow
Users can reset their password if they forget it.

- **Process**:
  1. User clicks "Forgot Password?" on the login page.
  2. The frontend calls `POST /api/Auth/forgot-password` with the user's email.
  3. The backend generates a 6-digit verification code and sends it via email.
  4. The user enters the code and their new password.
  5. The frontend calls `POST /api/Auth/reset-password` with the email, code, and new password.
  6. On success, the user is redirected to login with a confirmation message.
