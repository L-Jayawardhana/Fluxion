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
