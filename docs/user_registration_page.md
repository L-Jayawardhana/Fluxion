# User Registration Page — Technical Documentation

> **Files**:
>
> - Frontend: `FrontEnd/Fluxion/src/pages/Users/UserRegistrationPage.jsx` (or similar component handling user invites)
> - Styles: `FrontEnd/Fluxion/src/pages/Users/UserRegistrationPage.css`
>   **Route**: `/users/invite` or within a Modal/Page
>   **Theme**: Light paper (`#F2EFE8` background) — matches Dashboard page

---

## Overview

The User (Employee) Registration page allows Organization Owners and Administrators to invite new employees to join their organization's workspace. It allows admins to define the user's details and generate a secure temporary password, which is then emailed directly to the new employee along with an invitation link.

---

## Component Structure

```text
UserRegistrationPage (default export)
├── State Management
│   ├── departments         — Array of active departments in the organization
│   ├── form                — Form state for new employee details
│   ├── errors              — Validation error messages
│   ├── submitting          — Boolean for loading/submission state
│   └── message             — Global success/error message
├── API Handlers
│   ├── getDepartments()    — Fetch available departments for assigned dropdown
│   └── createEmployee()    — POST new employee payload to API
└── UI Components
    ├── Registration Form   — Main inputs for user data
    ├── Action Buttons      — Send Invite, Cancel
    └── Alerts              — Success or failure notifications
```

---

## Data Structure

### Employee Payload

```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane.doe@example.com",
  "password": "SecurePassword123!",
  "orgId": 1,
  "departmentId": 2
}
```

### Form Data State

```json
{
  "firstName": "",
  "lastName": "",
  "email": "",
  "password": "",
  "departmentId": ""
}
```

---

## API Integration

### Fetch Requirements

- **Departments Endpoint**: `GET /api/Department` (optionally filtered by the current owner's `OrgId`).
- **On Mount**: Fetches required departments to populate the department dropdown.

### Create Employee

```javascript
const createEmployee = async (formData) => {
  const response = await api.post("/User/employee", formData);
  return response.data;
};
```

- **Endpoint**: `POST /api/User/employee`
- **Payload**: `{ firstName, lastName, email, password, orgId, departmentId }`
- **Response**: `RegisterResponse` object containing the `UserId`, `FullName`, `Email`, and assigned `Role` (`user`).
- **Action**: The backend creates the user in the database, hashes the password, marks `MustChangePassword = true`, generates an invitation token, and emails the user the invitation payload including the temporary password.

---

## Page Features

### 1. Header
- Page or Modal title explaining the action (e.g., "Invite New Employee").

### 2. Registration Form
**Form Fields:**
- `firstName` — Required text input
- `lastName` — Required text input
- `email` — Required email input (must be unique)
- `password` — Required text input (or auto-generated field) for their temporary password
- `departmentId` — Required dropdown mapping to `DepartmentId` in the database

**Validation**:
- Email must be valid format and not already exist in the system.
- Password must meet security criteria.
- All required fields enforce inline validation messages.

### 3. Success State
Upon successful registration:
- Displays a success message stating the invitation has been sent.
- Clears the form or returns to the user table view.
- The invited employee receives an email to accept the invitation containing their explicit login credentials.
