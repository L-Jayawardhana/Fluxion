# Asset Management Enhancements

This document outlines the recent feature implementations for Asset Management within the Fluxion application, specifically tracking the **Asset Retirement** and **Inter-Department Asset Transfer** features, along with UI/UX improvements.

---

## 1. Asset Retirement (SCRUM-14)
Allows Owners and Admins to permanently retire physical assets from the system while preserving historical logs.

### Backend Implementation
* **CQRS Pattern:** Created `RetireAssetCommand` and `RetireAssetCommandHandler`.
* **Validation:** Assets must be in an `available` status (i.e., unassigned) before they can be retired. Attempting to retire an assigned asset throws an `InvalidOperationException`.
* **Endpoint:** Added `PUT /api/Asset/{id}/retire` to `AssetController.cs`.
* **Database Updates:** Modifies the asset `Status` to `retired`, and updates `RetiredAt`, `RetiredBy`, and `UpdatedAt`.

### Frontend Implementation
* **UI Trigger:** A red "Trash" icon button on the All Assets page (both desktop table and mobile cards), visible only to Owners/Admins when an asset is not already retired.
* **Smart Disablement:** If an asset is currently `assigned`, the retire button is grayed out and disabled.
* **Custom Modal:** Clicking retire opens a beautifully styled, screen-centered confirmation modal replacing the native browser `window.confirm`.
* **Success Feedback:** A fading green success banner appears upon successful retirement.

---

## 2. Inter-Department Asset Transfer
Allows moving unassigned assets from one department to another, directly updating the availability pool for specific departments.

### Backend Implementation
* **CQRS Pattern:** Created `TransferAssetCommand` and `TransferAssetCommandHandler`.
* **Validation:** 
  * Asset must exist and belong to the requester's organization.
  * Asset must **not** be `assigned` or `retired`.
  * Target department must exist, be active, and belong to the same organization.
  * Asset cannot be transferred to the department it already belongs to.
* **Endpoint:** Added `PUT /api/Asset/{id}/transfer` to `AssetController.cs`.
* **Database Updates:** Modifies `DepartmentId` and updates `UpdatedAt`.

### Frontend Implementation
* **API Hook:** Added `transferAsset` function to `src/services/api.js`.
* **UI Trigger:** A blue "Swap" icon button on the All Assets page (desktop and mobile), next to the Retire button.
* **Custom Modal:** Clicking transfer opens a styled modal displaying:
  * Asset Name and Current Department.
  * A dropdown select menu of all active departments (excluding the current department).
* **Automatic Filtering:** Since the **Asset Assignments** page already filters assignable assets by the selected employee's `DepartmentId`, transferred assets **automatically appear** in the correct assignment dropdown without needing any changes to the assignment page logic.

---

## 3. UI & UX Improvements

### "All Assets" Dashboard (`AllAssetsPage.jsx` & `.css`)
* **Status Filtering:** Added a new dropdown filter allowing users to sort assets by status: `Available`, `Assigned`, `Maintenance`, and `Retired`.
* **Custom Overlays:** Replaced all standard browser dialogs (`window.confirm` / `alert`) with custom, styled `.aa-confirm-modal` boxes using a darkened overlay backdrop (`.aa-overlay`).
* **Micro-interactions:** Updated button hover states and banner entry animations (`aaFadeUp`).

### "Asset Assignments" Dashboard (`AdminAssetAssignmentsPage.jsx`)
* **Unassign Button Refactor:** Replaced the generic and easily-missed `✕` icon block with a fully styled red **"Unassign"** button containing an icon + text label.
* **Unassign Dialog:** Built a new custom modal for unassigning assets. The confirmation message dynamically states both the `Asset Name` and the assigned `Employee Name` to prevent accidental revocations.
