# TechnicianPage — Technical Documentation

> **Files**:
>
> - Frontend: `FrontEnd/Fluxion/src/pages/Technician/TechnicianPage.jsx`
> - Styles: `FrontEnd/Fluxion/src/pages/Technician/TechnicianPage.css`
>   **Route**: `/technicians` (protected, requires Admin or Manager role)
>   **Theme**: Light paper (`#F2EFE8` background)

---

## Overview

The Technician page provides a centralized view for administrators and managers to view, add, update, and remove maintenance technicians. It displays a list of available technicians, their specialties, contact information, and current availability status. From this page, managers can assign technicians to specific maintenance tasks and track their workload.

---

## Component Structure

```text
TechnicianPage (default export)
├── State Management
│   ├── technicians         — Array of available technicians
│   ├── form                — Form state for adding/editing a technician
│   ├── isEditing           — Boolean to toggle edit mode
│   ├── loading             — Boolean for loading state
│   ├── errors              — Validation error messages
│   └── message             — Global success/error message
├── API Handlers
│   ├── getTechnicians()    — Fetch all technicians
│   ├── createTechnician()  — POST new technician payload
│   ├── updateTechnician()  — PUT updated technician payload
│   └── deleteTechnician()  — DELETE a technician
├── UI Components
│   ├── Technician List     — Data table or grid of technicians
│   ├── Technician Form     — Modal or form for adding/editing
│   ├── Status Badge        — Visual indicator of availability
│   └── Action Buttons      — Edit, Delete, Assign
└── Static data constants
    ├── SPECIALTIES         — List of predefined maintenance specialties
    └── emptyForm           — Initial form state
```

---

## Data Structure

### Technician Payload

```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "johndoe@example.com",
  "phone": "+1234567890",
  "specialty": "Hardware Repair",
  "isAvailable": true
}
```
