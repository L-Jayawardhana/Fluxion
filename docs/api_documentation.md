# Fluxion API Documentation - Auth & Verification Updates

This document outlines the recent additions to the `AuthController` (`/api/Auth/*`) handling email verification, welcome emails, and Google authentication states.

## 1. POST `/api/Auth/send-verification-code`
Generates and emails a 6-digit verification code to the user during registration.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Verification code sent successfully."
}
```

## 2. POST `/api/Auth/verify-code`
Validates a provided 6-digit code against the email address.

**Request Body:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response (200 OK):**
```json
{
  "isValid": true,
  "message": "Code verified."
}
```
*Note: Returns `400 Bad Request` if the code is invalid, expired, or already used.*

## 3. POST `/api/Auth/send-welcome-email`
Sends the fully branded HTML welcome email upon successful Organisation creation.

**Request Body:**
```json
{
  "email": "user@example.com",
  "firstName": "John",
  "orgName": "Acme Corp",
  "workspaceSlug": "acme-corp",
  "planName": "Free"
}
```

**Response (200 OK):**
```json
{
  "message": "Welcome email sent."
}
```

## 4. POST `/api/Auth/google`
Authenticates a user using a Google OAuth JWT Token (`credential`).

**Request Body:**
```json
{
  "idToken": "eyJhbGciOiJSUz..."
}
```

**Response (200 OK):**
```json
{
  "userId": 105,
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "role": "user",
  "token": "eyJhbGciOi...",
  "isNewUser": true // OR false
}
```
*Note: The `isNewUser` flag is critical for frontend routing. It allows the frontend to determine whether to drop the user into the Dashboard (`isNewUser=false`) or the Organisation Setup Flow (`isNewUser=true`).*

## 5. POST `/api/Auth/register-system-admin`
Registers a new System Administrator (super-admin) user with full access across the platform.

**Request Body:**
```json
{
  "fullName": "System Administrator",
  "email": "sysadmin@fluxion.com",
  "password": "SecurePassword123!"
}
```

**Response (201 Created):**
```json
{
  "userId": 1,
  "fullName": "System Administrator",
  "email": "sysadmin@fluxion.com",
  "role": "systemadmin",
  "token": "eyJhbGciOi..."
}
```

## 6. POST `/api/Auth/forgot-password`
Initiates the password reset process by sending a verification code to the user's email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset code sent."
}
```

## 7. POST `/api/Auth/reset-password`
Resets the user's password using the verification code received via email.

**Request Body:**
```json
{
  "email": "user@example.com",
  "code": "123456",
  "newPassword": "NewSecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password has been reset successfully."
}
```

---

# Organization API (`/api/Organization`)

## 8. GET `/api/Organization`
Returns all organizations with owner info, user counts, and asset counts.

**Response (200 OK):**
```json
[
  {
    "orgId": 1,
    "orgName": "Acme Corp",
    "slug": "acme-corp",
    "ownerId": 5,
    "ownerName": "John Doe",
    "logoUrl": "/uploads/logos/org-1-abc123.png",
    "timezone": "Australia/Sydney",
    "isActive": true,
    "createdAt": "2026-01-15T10:30:00Z",
    "usersCount": 12,
    "assetsCount": 47
  }
]
```

## 9. POST `/api/Organization`
Creates a new organization.

**Request Body:**
```json
{
  "orgName": "Acme Corp",
  "slug": "acme-corp",
  "timezone": "Australia/Sydney",
  "ownerId": 5
}
```

**Response (201 Created):**
Returns the created organization object.

*Note: Returns `409 Conflict` if an organization with the same slug already exists.*

## 10. POST `/api/Organization/{id}/logo`
Uploads or replaces the logo for an organization. Accepts `multipart/form-data`.

**Request:**
- Content-Type: `multipart/form-data`
- Field: `file` — the image file (PNG, JPG, SVG, or WebP; max 2 MB)

**Response (200 OK):**
```json
{
  "logoUrl": "/uploads/logos/org-1-abc123def456.png"
}
```

*Validation:*
- Allowed extensions: `.png`, `.jpg`, `.jpeg`, `.svg`, `.webp`
- Max file size: 2 MB

## 11. PUT `/api/Organization/{id}`
Updates an existing organization's details.

**Request Body:**
```json
{
  "orgId": 1,
  "orgName": "Acme Corp Updated",
  "slug": "acme-corp-updated",
  "timezone": "America/New_York",
  "isActive": true
}
```

**Response:** `204 No Content`

*Note: Returns `400 Bad Request` if the `id` in the URL does not match `orgId` in the body.*

## 12. DELETE `/api/Organization/{id}`
Permanently deletes an organization from the database.

**Response:** `204 No Content`

*Note: This is a hard delete — the organization and its data are permanently removed.*

---

# User API (`/api/User`)

## 13. GET `/api/User`
Returns all users. Optionally filter by organization.

**Query Parameters:**
| Parameter | Type  | Required | Description                         |
|-----------|-------|----------|-------------------------------------|
| `orgId`   | `int` | No       | Filter users by organization ID     |

**Response (200 OK):**
```json
[
  {
    "userId": 10,
    "orgId": 1,
    "fullName": "Jane Doe",
    "email": "jane@example.com",
    "role": "Admin",
    "isActive": true,
    "lastLoginAt": "2026-03-01T14:22:00Z",
    "createdAt": "2026-01-20T09:00:00Z",
    "organizationName": "Acme Corp"
  }
]
```

## 14. PUT `/api/User/{id}`
Updates an existing user's profile and role.

**Request Body:**
```json
{
  "userId": 10,
  "orgId": 1,
  "fullName": "Jane Doe Updated",
  "email": "jane.updated@example.com",
  "role": "Technician",
  "isActive": true
}
```

**Response:** `204 No Content`

*Note: Returns `400 Bad Request` if the `id` in the URL does not match `userId` in the body.*

**Accepted Roles:** `Owner`, `Admin`, `Technician`, `User`, `SystemAdmin`

## 15. DELETE `/api/User/{id}`
Permanently deletes a user from the database.

**Response:** `204 No Content`

*Note: This is a hard delete — the user account is permanently removed.*

---

# Health API (`/api/Health`)

## 16. GET `/api/Health`
Returns the API health status and database connectivity.

**Response (200 OK):**
```json
{
  "status": "Healthy",
  "timestamp": "2026-03-02T12:00:00Z",
  "database": "Connected"
}
```

*Possible `database` values: `"Connected"`, `"Disconnected"`, or `"Error: <message>"`*
