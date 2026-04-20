# Scheduling Conflict Assignment Dialog

## Feature Summary

When assigning a maintenance ticket to a technician, the system now checks whether that technician already has ongoing work.

If ongoing work exists, a **confirmation dialog box** appears before assigning.

This prevents accidental double-booking while still allowing admins/managers/owners to continue when needed.

---

## Behavior

### Conflict check trigger
- Triggered when user clicks **Assign** or **Change** in the tickets list.
- Runs only when a technician is selected.

### Ongoing ticket statuses treated as conflicts
- `assigned`
- `in_progress`
- `waiting_parts`

### Dialog behavior
- Dialog title: **Scheduling Conflict Detected**
- Shows one currently ongoing ticket title for the selected technician.
- User can:
  - **Yes** → proceed with assignment.
  - **No** → cancel assignment and keep previous technician selection.

### No conflict behavior
- Assignment is completed directly without dialog.

---

## Roles

Assignment action is available for:
- `owner`
- `admin`
- `manager`

---

## API dependency used by conflict check

Frontend conflict check queries tickets with:
- `technicianId`
- `pageSize=50`

It reads returned statuses and decides whether to show dialog.

---

## Performance Notes

Recent optimization applied:
1. Assignment email dispatch is moved to background (non-blocking API response).
2. Frontend no longer does a full ticket refetch after assign; it updates the changed ticket locally.
3. Loading state is now per ticket, so one assignment does not freeze all rows.

---

## Manual Verification (Dialog Box)

1. Login as `admin` (or `owner`/`manager`).
2. Open **All Tickets** page.
3. Ensure technician **T1** already has one ticket in status `assigned`, `in_progress`, or `waiting_parts`.
4. On a different ticket, select technician **T1** and click **Assign**.
5. Verify dialog appears with conflict warning and ongoing ticket title.
6. Click **No**:
   - Verify assignment is not changed.
   - Verify selected value resets back to previous assigned value.
7. Repeat and click **Yes**:
   - Verify assignment succeeds.
   - Verify ticket row updates to the selected technician.
   - Verify open tickets move to `assigned` status after assignment.

---

## Unit Test Coverage Added

Unit tests were added for query behavior used by this dialog flow:
- `Admin_FilterByTechnicianId_ReturnsOnlySelectedTechnicianTickets`
- `Admin_FilterByTechnicianId_IncludesOngoingStatusesForConflictDetection`

Location:
- `tests/Fluxion.UnitTests/MaintenanceTickets/GetMaintenanceTicketsQueryHandlerTests.cs`
