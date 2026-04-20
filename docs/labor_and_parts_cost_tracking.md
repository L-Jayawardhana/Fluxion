# Labor and Parts Cost Tracking

## Overview
This document outlines the recent updates to the Fluxion maintenance tracking system, which introduces precise tracking for **Labor Costs** and **External Parts Costs**. 

## Backend Changes (.NET)
- **Domain Entities**: Maintenance logging mechanisms now separately account for labor/repair costs and external parts costs.
- **Technician API**: The `LogRepairRequest` payload has been updated. It now requires an `ExternalPartsCost` parameter natively.
- **Financial Reporting**: The queries powering the Financial Insights (e.g., `GetFinancialInsightsQueryHandler`) have been overhauled. They now independently calculate `LaborSpend` and `PartsSpend`, aggregating them to compute `TotalSpend` or `MaintenanceSpend`.

## Frontend Changes (React)
- **Navigation Changes**: The Financial Insights view has been removed from the main left pane (`MainLayout.jsx`).
- **Dashboard Streamlining**: The "Recent Activity" panel was removed to declutter the dashboard.
- **Routing**: Dashboard analytical cards now use direct `useNavigate` bindings (e.g., "View Report" redirects contextually instead of relying on the sidebar).

## Quality Assurance & Testing
- **Technician Endpoints**: New test cases (`LogRepair_WhenTicketAssigned_SavesRepairDetailsIncludingPartsCost_ReturnsOk`) validate the `ExternalPartsCost` persistence.
- **Financial Insights**: `FluentAssertions` validations now rigidly test the splits between component parts and labor mathematics using Entity Framework Core's InMemory DB.
