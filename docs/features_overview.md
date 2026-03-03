# Fluxion Features Overview

This document provides a comprehensive summary of all implemented features across the Fluxion platform — FrontEnd, Admin Dashboard, and Backend API.

---

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

---

## 9. FrontEnd — Sidebar & Navigation Layout
The main application shell (`MainLayout.jsx`) provides a rich sidebar with full navigation and a topbar with contextual information.

### Sidebar
- **Dark theme**: The sidebar uses `#0D0D0D` (ink) background colour.
- **Logo**: Text-only "FLUXION" wordmark in Syne 800-weight white text.
- **Org Pill**: Displays the current organisation name and plan status with a green activity dot.
- **7 Navigation Groups** with 22 total links:
  1. **Home**: Welcome, Dashboard
  2. **People**: Users, Invite Users, Roles & Access
  3. **Departments**: All Departments, Add Department
  4. **Assets**: All Assets, Register Asset, Asset Assignments, QR Code Labels, Asset Categories
  5. **Maintenance**: All Tickets, Raise Ticket, Maintenance Logs, Overdue Tickets
  6. **Reports**: Asset Register, Maintenance Cost, Warranty Expiry, Export Data
  7. **Organisation**: Subscription, Audit Log, Settings, Support
- **Active State**: Active links display with a rust-coloured left border and tinted background.
- **SVG Icons**: Each link has a consistent 16×16 SVG icon (stroke-based, 1.5px stroke).
- **Subscription Block**: Shows plan name, usage bar, user/asset counts, and an "Upgrade" button.
- **Profile Footer**: Avatar (initials-based), user name, role, and a logout button.

### Topbar
- **Breadcrumb**: Shows `Fluxion › {Current Page Name}` dynamically based on route.
- **Live Clock**: Auto-updating clock showing weekday, date, and time.
- **Search Button**: Styled search action button.
- **Notification Bell**: With a dot indicator for unread notifications.

## 10. FrontEnd — Welcome Page (Onboarding Hub)
The Welcome page (`/welcome`) serves as the primary onboarding hub for new organisation owners.

- **Route**: `/welcome` (protected, requires authentication)
- **Theme**: Light paper theme (`#F2EFE8` background) — distinct from the dark sidebar.
- **Hero Section**: Personalised greeting with the user's name (extracted from email), eyebrow text, subtitle describing Fluxion.
- **Organisation Meta**: Displays org details (plan, member count, status) in small meta cards.
- **Setup Progress Ring**: SVG-based animated doughnut ring showing setup completion percentage.
- **4 Onboarding Workflows**: Each workflow card includes:
  1. **Set Up Departments** — Step-by-step instructions for creating departments.
  2. **Register Your Assets** — How to add assets and auto-generate QR codes.
  3. **Invite Your Team** — Adding admins, technicians, and users.
  4. **Assign Assets to Users** — Linking assets to people.
  - Each card has a numbered header, coloured accent, expandable steps, status badge, and action button.
- **Smart Suggestions Grid**: 6 contextual tips displayed in a 3×2 grid (quick wins, asset tips, team tips, org tips, security tips, reporting tips).
- **Did You Know Section**: 6 expandable knowledge cards covering advanced features (multi-department users, auto-status, ticket-to-log, retirement, exports, subscription).
- **Keyboard Shortcuts Table**: 12 keyboard shortcuts displayed in a clean grid layout.
- **Fonts**: Poppins (body), Syne (headings), Instrument Serif (italic emphasis).

## 11. FrontEnd — Owner Dashboard
The Dashboard page (`/dashboard`) provides a comprehensive operational overview for organisation owners.

- **Route**: `/dashboard` (protected, requires authentication)
- **Theme**: Light paper theme (`#F2EFE8` background) — matches Welcome page palette.
- **Fonts**: DM Mono (monospace body), Syne (headings), Instrument Serif (greeting italic), Poppins (fallback).
- **Dynamic Data**: Fetches user data from `GET /api/User` to calculate total and active user counts.
- **Animated Counters**: `AnimVal` component uses `requestAnimationFrame` with easeOutCubic easing for smooth 1200ms count-up animations.

### Dashboard Sections

#### Greeting Banner
- Time-aware greeting (morning/afternoon/evening) with the user's name in italic serif.
- Quick-view metric pills: Open Tickets (rust), Overdue (amber), Expiring Soon (muted).

#### KPI Cards (4-column grid)
| Card | Colour | Icon | Value |
|------|--------|------|-------|
| Total Assets | Blue | 💻 | 248 |
| Open Tickets | Rust | 🎫 | 12 |
| Under Maintenance | Amber | 🔧 | 7 |
| Active Users | Green | 👥 | Dynamic |

Each card features animated counters, delta badges (↑/↓ with colour coding), and accent top borders.

#### Monthly Maintenance Cost (Bar Chart)
- 7-month horizontal bar chart (Aug–Feb) with animated height transitions.
- YTD total ($14,820) and current month cost ($2,340).
- Current month highlighted in rust; others dimmed.

#### Asset Breakdown (Donut Chart)
- CSS `conic-gradient` donut with 4 segments: Laptops (46%), Printers (19%), Vehicles (15%), Other (20%).
- Centre label shows total asset count (248).
- Legend with colour dots, percentages, and counts.

#### Open Maintenance Tickets (Table)
- 5-row table with columns: Asset/Dept, Issue, Status, Priority, Age, Action.
- Status badges: Open (rust), In Progress (amber), Waiting Parts (blue).
- Priority badges: Critical (rust), High (amber), Medium (blue), Low (green).

#### Recently Added Assets (List)
- 5 recent assets with emoji thumbnails, name, department/serial meta, and status badge.

#### Team Grid (2-column)
- 6 team members with colour-coded avatars, name, role, and online status indicators (green dot with glow).
- Plan usage bar: Shows seat usage percentage with gradient fill.

#### Assets by Department (Bar Chart)
- 6 department rows with animated horizontal progress bars.
- Colour-coded by department; shows used/total counts.

#### Recent Activity Feed
- 4 recent activities with icon, text (with bold names/IDs), and relative timestamps.

#### Warranty Expiry Alerts
- 4 warranty items with urgency badges: Critical (7 days, rust), Warning (23/31 days, amber), OK (142 days, green).

### Responsiveness
- **1200px breakpoint**: KPIs collapse to 2-column; chart/table rows stack vertically.
- **768px breakpoint**: KPIs single-column; greeting stacks vertically; team grid single-column.

## 12. FrontEnd — Design System & Theme

### Colour Palette
The application uses a **Rust/Ink/Paper** colour palette throughout:

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg` | `#0D0D0D` | Global body background (ink) |
| `--color-surface` | `#151515` | Auth cards, elevated surfaces |
| `--color-text` | `#F2EFE8` | Primary text on dark backgrounds |
| `--color-primary` | `#C84B2F` | Rust — primary accent, CTAs, active states |
| `--color-accent` | `#F0A500` | Amber — warnings, highlights |
| `--color-success` | `#2A7A4B` | Green — success states |
| `--color-steel` | `#3A4A5C` | Secondary text on light backgrounds |
| `--color-warm` | `#E8E2D6` | Warm neutral for borders on light |

### Page-Scoped Themes
- **Welcome & Dashboard pages**: Light theme with `#F2EFE8` (paper) background, `#FFFFFF` cards, `#0D0D0D` headings, `#1A1A1A` body text.
- **Sidebar & Topbar**: Dark theme with `#0D0D0D` background.
- **Auth pages** (Login, Register, Forgot Password): Dark radial gradient background.
- **Landing Page**: Dark theme with gradient.

### Typography
| Font | Weight | Usage |
|------|--------|-------|
| Poppins | 400–700 | Default body text, auth pages |
| Syne | 700–800 | Headings, sidebar labels, KPI values |
| DM Mono | 400 | Dashboard monospace body, table data |
| Instrument Serif | 400 italic | Greeting name emphasis, decorative |

### Animation System
- **Fade-up entrance**: Elements animate `opacity: 0 → 1` and `translateY(16px → 0)` on mount.
- **Staggered delays**: Cards and rows use sequential `.05s` increments for cascading reveal.
- **Counter animation**: KPI values use easeOutCubic easing over 1200ms.
- **Bar chart animation**: Height transitions at `.7s` with `cubic-bezier(.34,1,.64,1)`.
- **Donut animation**: Scale + rotate entry.

## 13. FrontEnd — Splash Screen
A branded splash screen (`SplashScreen.jsx`) displays on first visit per session.

- **Behaviour**: Shows once per session (tracked via `sessionStorage.splashShown`).
- **Visual**: Animated Fluxion branding with fade-in/fade-out transitions.
- **Callback**: Fires `onComplete` to unmount and render the app.

## 14. FrontEnd — Authentication Architecture

### useAuth Hook (`hooks/useAuth.jsx`)
Provides authentication context to the entire app via React Context.
- **Exports**: `{ user, token, login, logout, isAuthenticated, loading }`
- **User object**: `{ userId, email, role, orgId }`
- **Token storage**: Supports both `localStorage` (persistent) and `sessionStorage` (session-only).
- **Auto-expiry**: Checks `expiresAt` timestamp on load and clears expired tokens.

### ProtectedRoute (`components/ProtectedRoute.jsx`)
A wrapper component for React Router that redirects unauthenticated users to `/login`.

### API Service (`services/api.js`)
An Axios instance configured with:
- **Base URL**: `VITE_API_URL` environment variable (currently `http://20.2.91.234/api`).
- **JWT interceptor**: Automatically attaches `Authorization: Bearer {token}` to every request.
- **401 interceptor**: Automatically clears auth state and redirects to `/login` on 401 responses.

## 15. FrontEnd — Routing Structure

| Route | Page | Auth Required | Layout |
|-------|------|--------------|--------|
| `/` | LandingPage | No | None |
| `/login` | LoginPage | No | Auth Layout |
| `/register` | RegisterPage | No | Auth Layout |
| `/forgot-password` | ForgotPasswordPage | No | Auth Layout |
| `/welcome` | WelcomePage | Yes | MainLayout (sidebar) |
| `/dashboard` | DashboardPage | Yes | MainLayout (sidebar) |
| `/test-welcome` | WelcomePage | No | None (dev only) |
| `*` | NotFoundPage | No | None |

## 16. Backend — Clean Architecture (.NET 8)
The backend follows Clean Architecture / CQRS with MediatR.

### Project Structure
```
Fluxion.API/            → Presentation layer (Controllers, Middleware, Filters)
Fluxion.Application/    → Business logic (Features, DTOs, Interfaces, Behaviors)
Fluxion.Domain/         → Domain entities, enums, value objects
Fluxion.Infrastructure/ → External concerns (JWT, Email, FileStorage, Logging)
Fluxion.Persistence/    → Data access (EF Core, Migrations, Repositories)
```

### Controllers
| Controller | Base Route | Responsibility |
|-----------|-----------|---------------|
| `AuthController` | `/api/Auth` | Registration, login, Google OAuth, password reset, email verification |
| `OrganizationController` | `/api/Organization` | CRUD operations, logo upload |
| `UserController` | `/api/User` | User listing, update, deletion |
| `HealthController` | `/api/Health` | Health check with database connectivity |

### Key Infrastructure Services
- **JWT**: Token generation and validation via `Fluxion.Infrastructure/JWT/`.
- **Email**: SMTP-based email service via `Fluxion.Infrastructure/Email/`.
- **File Storage**: Logo and asset file storage via `Fluxion.Infrastructure/FileStorage/`.
- **Logging**: Structured logging via `Fluxion.Infrastructure/Logging/`.

### Validation Pipeline
`ValidationBehavior<TRequest, TResponse>` is a MediatR pipeline behavior that runs FluentValidation validators before any handler executes. Validation errors are returned as `400 Bad Request` with structured error messages.

## 17. Deployment & Infrastructure

### Docker
- **FrontEnd**: Dockerfile in `FrontEnd/Fluxion/Dockerfile` — multi-stage build (Node → Nginx).
- **Backend**: Dockerfile in `BackEnd/src/Dockerfile` — multi-stage build (.NET publish → ASP.NET runtime).
- **docker-compose.yml**: Orchestrates all services.

### Nginx
- Reverse proxy configuration in `nginx/nginx.conf`.
- FrontEnd uses its own `nginx.conf` for SPA routing (all routes → `index.html`).

### Vercel (FrontEnd)
- FrontEnd is deployed to Vercel for preview/production.
- **Environment Variable**: `VITE_API_URL` set to `http://20.2.91.234/api`.
- **Build Fix**: `.gitignore` rules were corrected to ensure `src/pages/Logs/` directory is not excluded by glob patterns targeting `/logs`.

### Backend Server
- Hosted at `http://20.2.91.234/api` (Azure VM).
- .NET 8 runtime with SQL Server database.
