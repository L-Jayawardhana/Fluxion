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

_Note: Returns `400 Bad Request` if the code is invalid, expired, or already used._

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

_Note: The `isNewUser` flag is critical for frontend routing. It allows the frontend to determine whether to drop the user into the Dashboard (`isNewUser=false`) or the Organisation Setup Flow (`isNewUser=true`)._

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

_Note: Returns `409 Conflict` if an organization with the same slug already exists._

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

_Validation:_

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

_Note: Returns `400 Bad Request` if the `id` in the URL does not match `orgId` in the body._

## 12. DELETE `/api/Organization/{id}`

Permanently deletes an organization from the database.

**Response:** `204 No Content`

_Note: This is a hard delete — the organization and its data are permanently removed._

---

# User API (`/api/User`)

## 13. POST `/api/User/employee`

Registers a new employee and automatically sends an email invitation. Requires **Owner** or **Admin** privileges.

**Request Body:**

```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@example.com",
  "password": "SecurePassword123!",
  "orgId": 1,
  "departmentId": 2
}
```

**Response (201 Created):**

```json
{
  "userId": 11,
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "role": "user",
  "token": ""
}
```

_Note: The user is created in an inactive/invited state until they accept the invitation. The temporary password is included in the invitation email._

## 14. POST `/api/User/accept-invite`

Accepts an invitation using a unique invitation token sent via email. Allows Anonymous requests.

**Request Body:**

```json
{
  "token": "49bade91-f925-46fd-ab8c-..."
}
```

**Response (200 OK):**

```json
{
  "message": "Invitation accepted successfully."
}
```

_Note: Returns `400 Bad Request` if the token is invalid or expired._

## 15. GET `/api/User`

Returns all users. Optionally filter by organization.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|-------|----------|-------------------------------------|
| `orgId` | `int` | No | Filter users by organization ID |

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

_Note: Returns `400 Bad Request` if the `id` in the URL does not match `userId` in the body._

**Accepted Roles:** `Owner`, `Admin`, `Technician`, `User`, `SystemAdmin`

## 15. DELETE `/api/User/{id}`

Permanently deletes a user from the database.

**Response:** `204 No Content`

_Note: This is a hard delete — the user account is permanently removed._

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

_Possible `database` values: `"Connected"`, `"Disconnected"`, or `"Error: <message>"`_

---

# Department API (`/api/Department`)

## 17. GET `/api/Department`

Returns all departments in the system.

**Response (200 OK):**

```json
[
  {
    "departmentId": 1,
    "departmentName": "Engineering",
    "description": "Software Development Team",
    "isActive": true,
    "createdAt": "2026-03-15T10:30:00Z",
    "updatedAt": "2026-03-17T14:22:00Z"
  },
  {
    "departmentId": 2,
    "departmentName": "Sales",
    "description": "Business Development Team",
    "isActive": true,
    "createdAt": "2026-03-16T09:15:00Z",
    "updatedAt": "2026-03-17T11:00:00Z"
  }
]
```

## 18. GET `/api/Department/{id}`

Returns a specific department by ID.

**Response (200 OK):**

```json
{
  "departmentId": 1,
  "departmentName": "Engineering",
  "description": "Software Development Team",
  "isActive": true,
  "createdAt": "2026-03-15T10:30:00Z",
  "updatedAt": "2026-03-17T14:22:00Z"
}
```

_Note: Returns `404 Not Found` if the department does not exist._

## 19. POST `/api/Department`

Creates a new department.

**Request Body:**

```json
{
  "departmentName": "Engineering",
  "description": "Software Development Team",
  "isActive": true
}
```

**Response (201 Created):**

```json
{
  "departmentId": 1,
  "departmentName": "Engineering",
  "description": "Software Development Team",
  "isActive": true,
  "createdAt": "2026-03-17T14:22:00Z",
  "updatedAt": "2026-03-17T14:22:00Z"
}
```

_Validation:_

- `departmentName` is required and must be unique
- `description` is optional

## 20. PUT `/api/Department/{id}`

Updates an existing department.

**Request Body:**

```json
{
  "departmentId": 1,
  "departmentName": "Engineering",
  "description": "Software Development & DevOps Team",
  "isActive": true
}
```

**Response:** `204 No Content`

_Note: Returns `400 Bad Request` if the `id` in the URL does not match `departmentId` in the body. Returns `404 Not Found` if the department does not exist._

## 21. DELETE `/api/Department/{id}`

Permanently deletes a department from the database.

**Response:** `204 No Content`

_Note: This is a hard delete — the department and its data are permanently removed. Returns `404 Not Found` if the department does not exist._

**Authorization:**

- All Department endpoints require **Admin** or **SystemAdmin** role
- Users cannot access department endpoints without proper authorization

---

# Asset API (`/api/Asset`)

## 22. POST `/api/Asset`

Registers a new asset into the organization inventory. Resolves sequential asset tagging automatically.

**Request Body:**

```json
{
  "orgId": 1,
  "departmentId": 2,
  "assetName": "MacBook Pro M3",
  "assetType": "Laptop",
  "serialNumber": "C02X12345XYZ",
  "purchaseDate": "2024-01-15T00:00:00Z",
  "warrantyEndDate": "2027-01-15T00:00:00Z",
  "cost": 2199.99
}
```

**Response (201 Created):**

```json
{
  "assetId": 14,
  "assetName": "MacBook Pro M3",
  "assetType": "Laptop",
  "serialNumber": "C02X12345XYZ",
  "departmentId": 2,
  "departmentName": "Engineering",
  "cost": 2199.99,
  "status": "Available",
  "qrCode": "ASSET-14",
  "assetTag": "AA-001",
  "purchaseDate": "2024-01-15T00:00:00Z",
  "warrantyEndDate": "2027-01-15T00:00:00Z"
}
```

_Validation:_
- `assetName` and `assetType` are required.
- The system automatically ignores any manually supplied `assetTag` and sequentially generates the next available organizational tag (e.g. `AA-001`, `AA-002`).

## 23. GET `/api/Asset`

Returns all assets associated with the user's organization.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|-------|----------|-------------------------------------|
| `orgId` | `int` | Yes | Organization ID to retrieve assets for |

**Response (200 OK):**

```json
[
  {
    "assetId": 14,
    "assetName": "MacBook Pro M3",
    "assetType": "Laptop",
    "serialNumber": "C02X12345XYZ",
    "departmentId": 2,
    "departmentName": "Engineering",
    "cost": 2199.99,
    "status": "Available",
    "qrCode": "ASSET-14",
    "assetTag": "AA-001",
    "purchaseDate": "2024-01-15T00:00:00Z",
    "warrantyEndDate": "2027-01-15T00:00:00Z"
  }
]
```

## 24. GET `/api/Asset/{id}`

Returns the full details of a specific asset.

**Response (200 OK):**

```json
{
  "assetId": 14,
  "assetName": "MacBook Pro M3",
  "assetType": "Laptop",
  "serialNumber": "C02X12345XYZ",
  "departmentId": 2,
  "departmentName": "Engineering",
  "cost": 2199.99,
  "status": "Available",
  "qrCode": "ASSET-14",
  "assetTag": "AA-001",
  "purchaseDate": "2024-01-15T00:00:00Z",
  "warrantyEndDate": "2027-01-15T00:00:00Z"
}
```

_Note: Returns `404 Not Found` if the asset does not exist._

## 25. GET `/api/Asset/user/{userId}`

Returns all assets currently assigned to a specific user.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|-------|----------|-------------------------------------|
| `orgId` | `int` | Yes | Organization ID to verify access |

**Response (200 OK):**

```json
[
  {
    "assignmentId": 5,
    "assetId": 14,
    "assetName": "MacBook Pro M3",
    "assetTag": "AA-001",
    "assignedDate": "2024-03-21T10:00:00Z"
  }
]
```

## 26. PUT `/api/Asset/{id}/assign`

Assigns an available asset to a specific user. Requires **Admin** or **Owner** privileges.

**Request Body:**

```json
{
  "userId": 11,
  "orgId": 1,
  "assignedBy": 5
}
```

**Response (200 OK):**

```json
{
  "message": "Asset assigned successfully."
}
```

_Note: Returns `400 Bad Request` if the asset is not `available` or if there's a permission mismatch._

## 27. PUT `/api/Asset/{id}/unassign`

Unassigns an asset from a user, making its status `available` again. Requires **Admin** or **Owner** privileges.

**Request Body:**

```json
{
  "userId": 11,
  "orgId": 1
}
```

**Response (200 OK):**

```json
{
  "message": "Asset unassigned successfully."
}
```

_Note: Returns `400 Bad Request` if the active assignment cannot be found._

## 28. PUT `/api/Asset/{id}/retire`

Retires an asset, making it permanently unavailable. Requires **Admin** or **Owner** privileges.

**Request Body:**

```json
{
  "orgId": 1,
  "retiredBy": 5
}
```

**Response (200 OK):**

```json
{
  "message": "Asset retired successfully."
}
```

_Note: Returns `400 Bad Request` if the asset is currently assigned. Returns `404 Not Found` if the asset doesn't exist._

## 29. PUT `/api/Asset/{id}/transfer`

Transfers an asset to a different department within the same organization. Requires **Admin** or **Owner** privileges.

**Request Body:**

```json
{
  "orgId": 1,
  "newDepartmentId": 3,
  "transferredBy": 5
}
```

**Response (200 OK):**

```json
{
  "message": "Asset transferred successfully."
}
```

_Note: Returns `400 Bad Request` if the asset is currently assigned, retired, or already in the target department. Returns `404 Not Found` if the asset or target department doesn't exist._
