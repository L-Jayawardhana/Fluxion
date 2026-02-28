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
