# RaiseTicketPage — Technical Documentation

> **Files**:
>
> - Frontend: `FrontEnd/Fluxion/src/pages/Tickets/RaiseTicketPage.jsx`
> - Styles: `FrontEnd/Fluxion/src/pages/Tickets/RaiseTicketPage.css`
>   **Route**: `/raise-ticket` (protected, accessible by all employees)
>   **Theme**: Light paper (`#F2EFE8` background)

---

## Overview

The Raise Ticket page provides an interface for employees and standard users to report issues with their assigned assets or request maintenance. Once a ticket is raised, it enters the queue for administrators or IT managers to assign to a technician. The form supports describing the issue, selecting the asset, and categorizing the urgency.

---

## Component Structure

```text
RaiseTicketPage (default export)
├── State Management
│   ├── userAssets          — Array of assets assigned to the current user
│   ├── ticketForm          — Form state for the new ticket
│   ├── submitting          — Boolean for loading/submission state
│   ├── errors              — Validation error messages
│   └── successMessage      — Confirmation after successful ticket creation
├── API Handlers
│   ├── getUserAssets()     — Fetch assets available for the user to report
│   └── createTicket()      — POST the new support/maintenance ticket
├── UI Components
│   ├── Ticket Form         — Main inputs (Asset dropdown, title, description, urgency)
│   ├── File Uploader       — Optional image upload showing the asset damage
│   ├── Urgency Selector    — Radio buttons or dropdown for issue severity
│   └── Success Modal       — Confirmation showing the generated Ticket ID
└── Static data constants
    ├── URGENCY_LEVELS      — Low, Medium, High, Critical
    └── emptyTicket         — Initial ticket form state
```

---

## Data Structure

### Support Ticket Payload

```json
{
  "title": "Laptop screen flickering",
  "description": "The screen occasionally flickers when moving the lid.",
  "assetId": "asset-uuid",
  "reportedByUserId": "user-uuid",
  "urgency": "Medium",
  "attachments": ["url-to-image.png"]
}
```
