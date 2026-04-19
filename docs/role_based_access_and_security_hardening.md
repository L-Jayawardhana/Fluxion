# Role-Based Access Control (RBAC) & Security Hardening

This document outlines the implementation of strict role-based access control, security hardening, and role-aware features implemented for the Fluxion application. These changes ensure that users only see content, perform actions, and access data appropriate for their assigned roles (Owner, Admin, Manager, Technician, or User).

## 🏢 Core RBAC Architecture

The security model is implemented as a dual-layer defense:

### 1. Frontend Layer (React)
- **`RoleRoute` Component**: A new guarding component in `ProtectedRoute.jsx` that wraps restricted route groups. It validates the user's role from the JWT token and redirects unauthorized attempts to a new `/unauthorized` (403) page.
- **`App.jsx` Routing**:
    - **Admin Roles**: Access to Dashboard, Departments, Assets, Users, Reports, and Settings.
    - **Technician Role**: Access to the Technician Portal (`/technician/*`).
    - **User Role**: Access to Assigned Assets.
    - **Universal**: Welcome, Notifications, Support, and Ticket raising are accessible to all authenticated users.

### 2. Backend Layer (.NET Core API)
- **Controller Hardening**: Added class-level `[Authorize]` and method-specific `[Authorize(Roles = "...")]` attributes to controllers that were previously exposed or under-restricted.
    - **`UserController`**: Restricted listing and management to Admin/Owner roles.
    - **`OrganizationController`**: Restricted organizational settings and plan management to Owner/SystemAdmin.
    - **`MaintenanceTicketsController`**: Refined access so Technicians use the specialized `TechnicianController` for their queue.

---

## 🔍 Role-Aware Features

### 1. Global Search
The search palette (`GlobalSearch.jsx`) is now context-aware. It filters the searchable index based on the logged-in user's role:
- **Admins** can find administrative and organizational pages.
- **Technicians** see results for their portal and performance stats.
- **Users** can find their assigned assets and ticket tools.
- **Fuzzy Filtering**: Universal items like "Support" and "Welcome" appear for everyone.

### 2. Personalized Welcome Page
`WelcomePage.jsx` has been refactored to provide unique onboarding experiences:
- **Admins**: Focused on "Getting Started" workflows (Setting up departments, registering assets, inviting the team).
- **Technicians**: Focused on "Technician Onboarding" (Checking assignments, updating status, logging repairs).
- **Users**: Focused on "Employee Onboarding" (Viewing own assets, raising maintenance tickets).
- **Custom Tips**: Each role receives tailored "Tips for You" relevant to their specific tasks.

### 3. Integrated Support Page
A comprehensive Help & Support system (`SupportPage.jsx`) was implemented from scratch:
- **Role-Aware Content**: Dynamically swaps FAQs and Quick-Action cards based on the user's role.
- **System Status**: Real-time operational status widget for core services.
- **Quick Links**: Integrated routes for billing (Admins), ticket queue (Techs), and assigned assets (Users).

### 4. Smart Keyboard Shortcuts
Global shortcuts in `MainLayout.jsx` are now filtered by role. If a user tries to trigger a shortcut they don't have permission for (e.g., a Technician trying `N+A` for New Asset), the action is ignored.
- **Admin**: Full suite including navigation to Users, Assets, and Departments.
- **Technician**: Focused on Dashboard and My Tickets.
- **User**: Focused on Assigned Assets and Tickets.

---

## 🧪 Quality Assurance & Tests

Comprehensive unit tests were added to ensure the security boundaries remain intact:

### Frontend (Vitest & React Testing Library)
- **`ProtectedRoute.test.jsx`**: Tests redirection for unauthenticated and unauthorized users.
- **`GlobalSearch.test.jsx`**: Verifies role-based data isolation in search results.
- **`WelcomePage.test.jsx`**: Validates the three distinct onboarding branches.
- **`SupportPage.test.jsx`**: Ensures FAQ and Action Card content matches the user role.

### Backend (xUnit & Moq)
- **`UserControllerTests.cs`**: Uses reflection to verify that `[Authorize]` and `[Roles]` attributes are correctly applied to the controller and its endpoints.
- **`OrganizationControllerTests.cs`**: Verifies authorization requirements for organizational data and plan management.

---

## 📂 Related Files
- **Frontend**: `App.jsx`, `MainLayout.jsx`, `GlobalSearch.jsx`, `WelcomePage.jsx`, `SupportPage.jsx`, `ProtectedRoute.jsx`
- **Backend**: `UserController.cs`, `OrganizationController.cs`, `MaintenanceTicketsController.cs`
- **Tests**: `ProtectedRoute.test.jsx`, `GlobalSearch.test.jsx`, `WelcomePage.test.jsx`, `SupportPage.test.jsx`, `UserControllerTests.cs`, `OrganizationControllerTests.cs`
