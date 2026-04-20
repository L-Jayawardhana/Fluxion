# Ticket & Asset Notification System (SCRUM-41)

## Overview
This documentation covers the implementation of the comprehensive user alert system for the Fluxion application. The objective was to satisfy the user story: *"As a user, I want alerts about my tickets so I don't miss updates."*

To provide a robust alert ecosystem, we implemented a dual-delivery notification strategy:
1. **Email Notifications:** Rich HTML, branded emails sent to users' inboxes.
2. **In-App Notifications:** Persistent database-backed alerts integrated directly into the application's dashboard.

## Notification Triggers
The notification engine monitors three specific business events in the application workflow:

1. **Asset Assignment (`asset_assigned`)**
   - **Trigger:** When an administrator or owner assigns an asset to an employee.
   - **Recipient:** The employee receiving the asset.

2. **Ticket Status Update (`ticket_status_updated`)**
   - **Trigger:** When a technician updates the status of an ongoing maintenance ticket (e.g., from *Open* to *In Progress*).
   - **Recipient:** The employee who originally raised the maintenance ticket.

3. **Asset Condition Update (`asset_condition_updated`)**
   - **Trigger:** When a technician alters the physical condition of an asset.
   - **Recipient:** The employee to whom the asset is currently assigned.

---

## Backend Infrastructure (Clean Architecture)

### 1. Database & Domain Layer
- **Entity:** `Notification` entity inside the domain.
- **Persistence:** Registered the `DbSet<Notification>` within `FluxionDbContext` and created the `AddNotificationEntity` Entity Framework Core migration to generate the SQL table.

### 2. Application Layer & Abstractions
To strictly adhere to Clean Architecture and avoid tight coupling between business logic and infrastructure dependencies (like HTML email templates), interface abstractions were created:
- `INotificationService`: Contract for persisting in-app notifications.
- `ITicketAlertEmailService`: Contract for transmitting specific formatted alert emails.

Handlers (`AssignAssetCommandHandler`, `AssignMaintenanceTicketCommandHandler`) and Controllers (`TechnicianController`) were refactored to depend on these application interfaces rather than direct implementations.

### 3. Infrastructure Layer
- **Services:** `NotificationService` handles EF database insertions. Both are wrapped in `try/catch` blocks so that a failure to send an email or record an event will log silently but *not* break the parent business logic flow. 
- **Email Generation:** Created `FluxionEmailTemplates.cs` which centralizes the semantic HTML structure, in-lining the CSS variables, custom typography options (Poppins font), and styling blocks to guarantee that every system alert identically mimics the premium project branding.

---

## Frontend Integration

### 1. The Bell Notification
- Integrated a live-polling mechanism in `MainLayout.jsx` that queries `/api/notification/unread-count`.
- Added a pulsing visual "unread dot" alert to the navigation bell icon. 

### 2. Notifications Page (`/notifications`)
- Created `NotificationsPage.jsx` and `NotificationsPage.css` inside the `src/pages/Notifications` module.
- Styled using the dashboard's Light Theme component system (`#F2EFE8` paper backgrounds, `DM Mono`, and `Syne` fonts) to guarantee visual cohesion across the system. 
- Supports filtering (All vs. Unread), paginated backend fetching, and features one-click bulk clears ("Mark all as read").
- Direct deep links: Clicking on a notification payload automatically routes the employee either to the My Tickets view or the My Assigned Assets view contextually.
