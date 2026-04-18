# Technician Ticket Assignment & Notification Flow

This document details the mechanics surrounding ticket assignment to technicians and the subsequent frontend routing and backend notifications within Fluxion. 

## Overview
When a ticket is assigned to a technician, the system automatically switches its status, assigns the user, and orchestrates app notifications for both the reporter and the targeted technician.

## 1. Backend Processing

The assignment logic is managed by `AssignMaintenanceTicketCommandHandler`, which is reachable via the PATCH route:
`/api/maintenance-tickets/{id}/assign`

### Steps
1. **Ticket Validation:** Locates the existing ticket. If the ticket doesn't exist, it throws `KeyNotFoundException`.
2. **Technician Validation:** Finds the targeted `UserId` passed in the request body and enforces the `UserRole.technician` constraint.
3. **Status Mutator:** If the ticket state is `open`, it is automatically promoted to `assigned`. The `AssignedTo` is explicitly set to the `UserId`.
4. **Data Persistence:** Synchronous EF Core context save updates the state.
5. **In-App Notifications (Synchronous):** 
   - `ticket_status_updated`: Created for the reporter.
   - `ticket_assigned`: Created exclusively for the newly assigned technician.
6. **Task Threaded Email**: A background task triggers an email delivery to the **reporter**, ensuring immediate HTTP response returning `OK/200`.

## 2. Frontend Real-Time Rendering

The frontend heavily relies on the UI rendering notification context appropriately based on the user's role framework.

### State & Polling
Global notifications are updated using a background setInterval in `MainLayout.jsx` that runs a lightweight query against `api/notification/unread-count`.

### Role-Based Routing
Technicians do not possess global authorization over all maintenance tickets payload; therefore, their URLs rely heavily on the `/technician/...` prefix. 

When a technician clicks `ticket_assigned` from their dashboard dropdown:
- **Technician Role:** Handled natively by `<NotificationsPage>` which redirects out to `/technician/tickets/{TicketId}`.
- **Admin/Owner Roles:** The redirection logic points to `/tickets`.

### Typographic and Icon States
All incoming ticket creation and assignment notifications depend on `TYPE_ICONS` lookup within `NotificationsPage.jsx`.

- **Ticket Assigned (`ticket_assigned`):** Renders with a blue badge (`tc-pri high`) indicating an assignment update.
- **Ticket Created (`TICKET_CREATED`):** Accommodates manual owner tasks emitting a `🆕` badge when a ticket spawns, visible across management.
