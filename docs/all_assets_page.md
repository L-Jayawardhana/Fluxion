# AllAssetsPage — Technical Documentation

> **Files**:
>
> - Frontend: `FrontEnd/Fluxion/src/pages/Assets/AllAssetsPage.jsx`
> - Styles: `FrontEnd/Fluxion/src/pages/Assets/AllAssetsPage.css`
>   **Route**: `/all-assets` (or similar protected route, requires appropriate roles)
>   **Theme**: Light paper (`#F2EFE8` background) — matches Dashboard page

---

## Overview

The All Assets page serves as the central inventory management hub for the organization. It provides a comprehensive, filterable, and responsive view of all registered assets. Key features include dynamic filtering by department and asset type, real-time inventory statistics, responsive desktop tables and mobile cards, and the ability to instantly generate and download physical QR code labels for any asset.

---

## Component Structure

```text
AllAssetsPage (default export)
├── State Management
│   ├── userOrg             — Organization object of the user
│   ├── departments         — Array of active departments
│   ├── assets              — Array of all retrieved assets
│   ├── loading             — Boolean for loading state
│   ├── error               — Error message string
│   ├── filterDept          — Current department filter
│   └── filterType          — Current asset type filter
├── API Handlers
│   ├── loadData()          — Fetches orgs, depts, and assets on mount or refresh
│   └── downloadQR()        — Generates and downloads a PNG QR code for an asset
├── Derived State (useMemo)
│   ├── filtered            — Array of assets matching current filters
│   ├── allAssetTypes       — Dynamic Set of available asset types (combining defaults and custom)
│   └── stats               — Calculated inventory metrics (total, available, assigned, maintenance)
├── UI Components
│   ├── Page Header         — Title and Refresh/Register buttons
│   ├── Impact Stats Row    — Four top-level metric cards
│   ├── Filter Bar          — Department and Type dropdowns
│   ├── Data Table          — Desktop-optimized asset grid
│   ├── Mobile Cards        — Mobile-optimized asset cards
│   └── Hidden QR Container — In-DOM rendering of `QRCodeCanvas` elements for downloading
└── Static data constants
    ├── ASSET_TYPES         — Default dropdown categories
    ├── STATUS_LABELS       — User-friendly status mapping
    └── fmtCost()           — Currency formatting helper
```

---

## API Integration

### Fetch Data

```javascript
Promise.all([
  getOrganizations(),
  getDepartments(user.orgId),
  getAssets(user.orgId)
])
```
- **On Mount**: Fetches all organizational context, departments, and assets simultaneously.

---

## Page Features

### 1. Stats Row
Calculates top-level metrics from the fetched `assets` array:
- Total registered assets.
- Available assets.
- Assigned assets.
- Maintenance assets.

### 2. Dynamic Filtering
Users can filter the inventory by:
- **Department**: Populated by the active `departments` list.
- **Asset Type**: Dynamically constructed from `ASSET_TYPES` combined with any custom asset types returned by the backend (ensuring "Other" custom types are fully filterable).

### 3. Responsive Inventory Display
- **Desktop Table (`aa-table`)**: Shows columns for Name, Type, Department, Status, Serial Number, Cost, and Actions.
- **Mobile Cards (`aa-cards`)**: Adjusts layout to stacked, easy-to-read cards for smaller screens.

### 4. QR Code Download System
- The page renders visually hidden `<QRCodeCanvas />` elements for every filtered asset.
- When a user clicks the "Download QR" action button, the `downloadQR(asset)` function queries the DOM for the specific canvas ID, converts it to a PNG Blob via `.toDataURL()`, and triggers a secure browser download.
