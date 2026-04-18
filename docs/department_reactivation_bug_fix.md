# Department Reactivation and UI Toggle Bug Fixes

This document outlines the fixes implemented for the department management module regarding reactivation restrictions and user interface toggle states.

## 1. Department Reactivation Safeguard (Backend)
### The Original Bug
Previously, the system prevented the creation of new departments if an active department already existed with the exact same name. However, a loophole existed:
1. Deactivate department "Sales".
2. Create a new active department named "Sales".
3. Reactivate the old "Sales" department.

Because the old Reactivation sequence did not check for duplicate active names upon status toggle, the system would incorrectly allow two identical "Sales" departments to exist in an active state simultaneously.

### The Resolution
We explicitly updated `ToggleDepartmentHandler.cs` inside the Application layer `Handle` method to safeguard against this violation.
When a toggle request attempts to pass an `IsActive = true` instruction to a currently deactivated department, a validation query scans the database for any other active department sharing the same name within the organization.

If found, it throws an `InvalidOperationException` preventing reactivation.

### Testing
A new unit test case `ToggleDepartment_ReactivatingDuplicateName_ThrowsInvalidOperationException` was added to `DepartmentHandlerTests.cs` to ensure that this boundary stands when attempting to reactivate a duplicate.

---

## 2. Department Toggle UI Improvements (Frontend)
### The Original Bug
On the `DepartmentsPage.jsx`, clicking the **Activate** or **Deactivate** buttons from the confirmation modal fired the `toggleDepartment` API request smoothly but provided absolutely no user feedback while waiting for the network response. This led to user confusion and the possibility of submitting duplicate network requests by double-clicking the button.

In addition, an earlier regression prevented the actual `newIsActive` status payload from being properly included in the target variable payload, leading to an aborted state toggle.

### The Resolution
1. **Payload Bug Fix**: The `onClick` events within the confirmation overlays have been updated to explicitly attach the correct boolean flag (`newIsActive: false` or `newIsActive: true`) alongside the target department structure when triggering the state overlay.
2. **UX Progress Blocking**: A new robust React state hook (`isToggling`) has been introduced to the confirmation modal. As soon as the modal action is submitted:
    - The Cancel button becomes disabled.
    - The active status button becomes disabled and its text morphs to `"Activating..."` or `"Deactivating..."`.
    - Once the background `finally()` block triggers from the Promise execution, the modal gracefully closes and resets states.
