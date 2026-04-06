# MaintenanceLogAndCostPage — Technical Documentation

> **Files**:
>
> - Frontend: `FrontEnd/Fluxion/src/pages/Maintenance/MaintenanceLogAndCostPage.jsx`
> - Styles: `FrontEnd/Fluxion/src/pages/Maintenance/MaintenanceLogAndCostPage.css`
>   **Route**: `/maintenance-logs` (protected, requires Admin or Technician role)
>   **Theme**: Light paper (`#F2EFE8` background)

---

## Overview

The Maintenance Log and Cost page allows technicians and administrators to log maintenance activities performed on assets. It tracks the details of the service, the time spent, the technician involved, and the associated costs (parts and labor). This historical data is crucial for calculating the total cost of ownership (TCO) for organizational assets.

---

## Component Structure

```text
MaintenanceLogAndCostPage (default export)
├── State Management
│   ├── maintenanceLogs     — Array of past and current maintenance logs
│   ├── logForm             — Form state for adding a new log/cost entry
│   ├── loading             — Boolean for loading state
│   ├── errors              — Validation error messages
│   └── assetSummary        — Aggregate cost data for a selected asset
├── API Handlers
│   ├── getLogsByAsset()    — Fetch logs for a specific asset
│   ├── addMaintenanceLog() — POST new log with cost breakdown
│   └── updateLogStatus()   — PUT update for log completion
├── UI Components
│   ├── Log History Table   — Table displaying historical maintenance data
│   ├── Cost Summary Card   — Displays total parts/labor cost calculation
│   ├── Add Log Modal       — Form to input maintenance actions & costs
│   └── Invoice Viewer      — View attached receipts/invoices
└── Static data constants
    ├── MAINTENANCE_TYPES   — Preventative, Corrective, Emergency
    └── emptyLog            — Initial form state (parts cost, labor cost, etc.)
```

---

## Data Structure

### Maintenance Log Payload

```json
{
  "id": "uuid",
  "assetId": "asset-uuid",
  "technicianId": "tech-uuid",
  "maintenanceType": "Corrective",
  "description": "Replaced faulty RAM module.",
  "partsCost": 150.0,
  "laborCost": 75.0,
  "totalCost": 225.0,
  "datePerformed": "2026-04-06T10:00:00Z"
}
```
