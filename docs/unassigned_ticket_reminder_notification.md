# Unassigned Ticket Reminder Notification

## Overview
This feature ensures that open maintenance tickets do not stay unassigned for an extended period. If an active maintenance ticket remains open and unassigned for more than two days, the system automatically triggers a notification to alert the relevant organization administrators, owners, and managers.

## Business Process
1. A maintenance ticket is raised (either manually by a user or auto-generated from a preventative maintenance schedule).
2. It enters the `open` state with no assigned technician initially.
3. Every 12 hours, the background service (`MaintenanceTicketGeneratorService`) runs and scans the database for open tickets.
4. Any ticket sitting unassigned (`AssignedTo == null`) and created more than 48 hours ago triggers a reminder.
5. The reminder is generated as a notification of type `UNASSIGNED_TICKET_REMINDER`.
6. To prevent notification spam, the system checks whether the `UNASSIGNED_TICKET_REMINDER` has already been dispatched for the specific ticket and will not send it a second time.

## Target Audience
Notifications are dispatched to users in the same organization holding any of the following elevated roles:
- Owner 
- Admin 
- Manager

## Components Affected
- **Backend (Background Service)**: `Fluxion.Infrastructure/BackgroundJobs/MaintenanceTicketGeneratorService.cs`
  - A new method `ProcessUnassignedTicketsReminderAsync` was introduced.
- **Frontend (UI Notification)**: `FrontEnd/Fluxion/src/pages/Notifications/NotificationsPage.jsx`
  - Extended notification schema handling to include custom icon (⚠️) and badge label ("Ticket Reminder").
  - Routing added: clicking the notification redirects correctly to the `/tickets` page to facilitate immediate action.

## Testing Information
Unit test implementations can be found under `tests/Fluxion.UnitTests/Services/MaintenanceTicketGeneratorServiceTests.cs`.
