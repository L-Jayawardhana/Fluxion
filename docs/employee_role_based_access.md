# Role-Based Login and Access: User (Employee) Role

This document details how the **User** (also known as Employee) role is handled within the Fluxion application concerning Authentication, Routing, Frontend UI Visibility, and Backend API Permissions.

---

## 1. Authentication & Onboarding
Employees are strictly internal users who do **not** register via the standard public registration flow. 

* **Invitation Flow:** An Owner or Admin creates an employee profile via the `/api/User/employee` endpoint.
* **Email Verification:** The employee receives an email invitation containing a unique link (`/accept-invite?token=XYZ`).
* **Initial Setup:** The employee accesses the link to confirm their identity and sets their permanent password (if not using Single Sign-On).
* **Role Assignment:** In the database, the user's `Role` is permanently set to `"user"`. Their JWT token will contain this claim: `role: user`.

---

## 2. Login Flow & Application Routing
When an employee successfully authenticates via the `/login` page:

* **JWT Verification:** The application decodes the assigned JWT and stores the `role` locally (e.g., in state/context via `useAuth()`).
* **Redirection:**
  * By default, a `"user"` is redirected to the **Employee Dashboard** (`/dashboard`).
  * If they attempt to access an Owner/Admin setup page (like `/welcome` or registration), they are blocked and redirected to their dashboard.

## 3. Frontend UI Visibility (Sidebar & Pages)
The primary layout (`MainLayout.jsx`) restricts navigation elements based on the `user.role` claim. An employee will experience a strictly localized view of the application.

### Accessible Pages for Employee:
* **Dashboard (`/dashboard`):** A simplified, personalized dashboard showing *only* their metrics (e.g., "Your Active Devices", "Your Recent Support Tickets").
* **My Assets (`/assigned-assets`):** A read-only list of hardware and tools physically assigned to them by their organization.
* **Profile Settings:** A page to update their own password, name, and UI preferences.

### Restricted / Hidden Pages
Employees **cannot** see these pages in their sidebar, and attempting to navigate to them directly via URL will redirect them back to the Dashboard or show an "Access Denied" page:
* `❌ /users` (Manage Users)
* `❌ /invite-users` (Invite Users)
* `❌ /departments` (Manage Departments)
* `❌ /add-department`
* `❌ /register-asset`
* `❌ /assets` (Global Company Inventory)
* `❌ /assignments` (Company-wide Asset Allocation)

---

## 4. Backend API Enforcement
Even if an employee manipulates the frontend to make restricted API calls, the .NET Backend strictly enforces their boundaries using `[Authorize(Roles = "...")]`.

### Permitted Capabilities (`Authorize(Roles = "user,admin,owner")`)
* `GET /api/User/{id}`: View their *own* profile.
* `PUT /api/User/{id}`: Update their *own* profile.
* `GET /api/Asset/user/{userId}`: An employee can only fetch assets assigned strictly to their `userId`. The backend explicitly logic-checks this:
  ```csharp
  // Example Check built into the Asset Controller
  if (currentUserIdStr != userId.ToString() && role != "admin" && role != "owner")
  {
      return Forbid();
  }
  ```

### Restricted Capabilities (`Authorize(Roles = "admin,owner")`)
The system will automatically return `403 Forbidden` if an employee attempts:
* Creating, Modifying, or Deleting **Departments**.
* Registering, Transferring, Unassigning, or Retiring **Assets**.
* Creating, Modifying, or Deleting other **Users** or generating invitations.
* Editing **Organization** settings or billing/subscription plans.
