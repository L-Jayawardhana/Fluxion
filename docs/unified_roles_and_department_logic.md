# Unified Roles and Department-Less Access

This document outlines the recent architectural changes to organizational roles and the implementation of department-independent registration for administrative and technical personnel.

---

## 1. Unified Administrative Identity
The application now treats the **Organization Owner** and **Administrator** as functionally identical roles. 

*   **Identical Permissions**: Both roles have equal access to organization settings, user management, and department definitions.
*   **Invitation Flow**: Because they are the same, the option to invite an "Administrator" has been removed from the invitation portal. New administrative personnel should be invited as **Managers** if limited authority is needed, or existing admins can be promoted manually.
*   **UI Representation**: Throughout the dashboard and user lists, both roles are represented with an "Admin" badge to maintain branding consistency.

---

## 2. Department-Less Roles
Certain roles within the organization operate at a global level and are no longer restricted to or associated with a specific department.

### Roles and Departmental Associations:
| Role | Department Required | Scope |
| :--- | :--- | :--- |
| **User (Employee)** | ✅ Yes | Tied to a specific team (e.g., Marketing, Engineering). |
| **Technician** | ❌ No | Operates across the workspace to maintain assets in any department. |
| **Manager** | ❌ No | Has oversight of the entire organization and its departments. |
| **Admin / Owner** | ❌ No | Full control over organization-wide settings. |

### Implementation Details:
*   **Frontend**: The "Department" selection is dynamically hidden in `InviteUserPage.jsx` when the Technician or Manager role is selected.
*   **Backend**: The `CreateEmployeeCommand` now accepts a nullable `DepartmentId`. The `CreateEmployeeCommandHandler` explicitly skips department validation and `UserDepartment` association for these roles.

---

## 3. Data Boundary Enforcement (Security)
To prevent cross-organization data leakage, all user-fetching and asset-assignment APIs have been hardened.

*   **Explicit Org Filtering**: APIs such as `/User` and `/Asset/assignments` now strictly require an `orgId` parameter.
*   **Backend Enforcement**: The `GetAllUsersHandler` and `GetMaintenanceTicketsQueryHandler` verify that the requested data belongs to the user's authorized organization.
*   **Dashboard Isolation**: The main dashboard metrics and user listings are isolated to the current organization context, ensuring that employees and managers from different companies cannot see each other's data.

---

## 4. Technical Validation
These features are covered by automated unit tests in `tests/Fluxion.UnitTests/Users/CreateEmployeeCommandHandlerTests.cs`:

*   `Handle_TechnicianRole_NoDepartmentRequired`: Verifies technicians are created with no department association.
*   `Handle_ManagerRole_NoDepartmentRequired`: Verifies managers are created without requiring a department.
*   `Handle_UserRole_RequiresDepartment`: Ensures standard employees still require a valid department for data scoping.
*   `Handle_NonOwnerOrAdmin_CannotInviteManager`: Verifies RBAC limits on who can create administrative accounts.
