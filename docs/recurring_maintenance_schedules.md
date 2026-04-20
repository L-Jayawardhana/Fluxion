# Recurring Maintenance Schedules (SCRUM-46)

## Overview
This feature fulfills the requirement for **SCRUM-46: "As a manager I want to define recurring maintenance schedules so assets are serviced regularly"**. It introduces the ability to schedule and automatically generate maintenance tickets for assets requiring regular servicing (e.g., every 6 months), specifically targeting technical devices.

## Backend Architecture

### Domain Entity Changes
1. **`MaintenanceSchedule` Entity**: New entity designed to track schedules for applicable assets.
2. **`Asset` Update**: A new boolean flag `RequiresRegularService` was added to the `Asset` entity to identify items requiring automated ticketing.
3. **Database Configuration**: Added the `MaintenanceSchedule` DB set to `FluxionDbContext` and performed necessary EF Core migrations to update the database schema.

### CQRS Updates
- **`CreateAssetCommandHandler`**: Refactored to inspect the `RequiresRegularService` flag upon asset creation. If true, it automatically generates a corresponding `MaintenanceSchedule` set to trigger every 6 months.
- **`CreateMaintenanceTicketCommandHandler`**: Integrated into the notification pipeline explicitly to raise in-app signals on ticket creation.

### Background Hosted Service
- **`MaintenanceTicketGeneratorService`**: Implements `IHostedService` to run periodically in the background. It evaluates all existing `MaintenanceSchedule` entries and actively generates `MaintenanceTicket` records for those due for servicing.
- **Automated Notifications**: Leverages `INotificationService` to alert relevant stakeholders when a new automated ticket is created.

## Frontend Implementation

### UI Updates
- **`RegisterAssetPage.jsx`**: Introduced a new required checkbox input explicitly mapping to the backend `RequiresRegularService` flag with a clear label "Regular service on every 6 months."
- **Dashboard Consistency (`AllTicketsPage`):** 
  - Restyled to seamlessly fit the primary dashboard theme.
  - Implemented the `.aa-page` wrapper and utilized custom CSS properties (e.g., `var(--tk-bg)`).
  - Standardized the typography to exclusively use the `Syne` font across ticket grids, filter bars, and lists.

### Notification Integrations
- **In-App Alerts:** The background service exclusively pushes notifications to users with `owner`, `admin`, or `manager` roles when recurring maintenance tickets are raised.
- **Navigation Redirection:** Clicking on a `TICKET_CREATED` notification within the `NotificationsPage` correctly resolves the ticket ID and natively redirects the user to the corresponding focus view in the `AllTicketsPage.`

## Testing Considerations
- Validated via xUnit in `CreateAssetCommandHandlerTests` and `CreateMaintenanceTicketCommandHandlerTests`.
- Successfully mocks `INotificationService` and DbContext configurations, preserving 100% test passing accuracy.
