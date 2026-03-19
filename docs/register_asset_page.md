# RegisterAssetPage — Technical Documentation

> **Files**:
>
> - Frontend: `FrontEnd/Fluxion/src/pages/Assets/RegisterAssetPage.jsx`
> - Styles: `FrontEnd/Fluxion/src/pages/Assets/RegisterAssetPage.css`
>   **Route**: `/register-asset` (protected, requires Owner or Admin role)
>   **Theme**: Light paper (`#F2EFE8` background) — matches Dashboard page

---

## Overview

The Register Asset page provides owners and administrators with an intuitive interface to onboard new organizational assets into the system. Features include dynamic data entry for asset details, auto-generated sequential asset tags, custom asset type categorization, and an interactive success state that instantly visually renders a scannable and downloadable QR code.

---

## Component Structure

```text
RegisterAssetPage (default export)
├── State Management
│   ├── userOrg             — Organization object of the user
│   ├── departments         — Array of active departments
│   ├── form                — Form state for new asset details
│   ├── errors              — Validation error messages
│   ├── submitting          — Boolean for loading state
│   ├── message             — Global success/error message
│   └── createdAsset        — The finalized asset returned from the API
├── API Handlers
│   ├── getOrganizations()  — Fetch user organization details
│   ├── getDepartments()    — Fetch available departments for dropdown
│   └── createAsset()       — POST new asset payload
├── UI Components
│   ├── Registration Form   — Main inputs for asset data
│   ├── Success Modal/Card  — Displays success details and visual QR
│   ├── QRCodeCanvas        — Interactive generated QR code (qrcode.react)
│   └── Action Buttons      — Download QR, Register Another
└── Static data constants
    ├── ASSET_TYPES         — Default dropdown categories
    └── emptyForm           — Initial form state
```

---

## Data Structure

### Asset Payload

```json
{
  "orgId": 1,
  "departmentId": 2,
  "assetName": "MacBook Pro M3",
  "assetType": "Laptop",
  "serialNumber": "C02X12345XYZ",
  "purchaseDate": "2024-01-15T00:00:00Z",
  "warrantyEndDate": "2027-01-15T00:00:00Z",
  "cost": 2199.99
}
```

### Form Data State

```json
{
  "departmentId": "",
  "assetName": "",
  "assetType": "",
  "serialNumber": "",
  "purchaseDate": "",
  "warrantyEndDate": "",
  "cost": "",
  "customAssetType": ""
}
```

---

## API Integration

### Fetch Requirements

```javascript
Promise.all([
  getOrganizations(),
  getDepartments(user.orgId)
])
```
- **On Mount**: Fetches required organizational constraints and departments.

### Create Asset

```javascript
const createAsset = async (formData) => {
  const response = await api.post("/asset", formData);
  return response.data;
};
```

- **Endpoint**: `POST /api/Asset`
- **Payload**: `{ orgId, departmentId, assetName, assetType, ... }`
- **Response**: Created AssetDto including auto-generated `AssetTag`, `QrCode`, and dates.
- **Auto-Generation**: Backend automatically assigns a sequential `AssetTag` (e.g., `AA-001`).

---

## Page Features

### 1. Header
- Page title and descriptive subtitle mapping purpose.

### 2. Registration Form
**Form Fields:**
- `departmentId` — Required dropdown
- `assetName` — Required text input
- `assetType` — Required dropdown (including "Other" custom string support)
- `customAssetType` — Conditional text input (reveals if "Other" is selected)
- `serialNumber` — Optional
- `purchaseDate` — Optional date picker
- `warrantyEndDate` — Optional date picker
- `cost` — Optional number input
- `assetTag` — Read-only field indicating `Auto-generated`

**Validation**:
- Asset Name <= 100 characters.
- Custom Asset Type <= 50 characters.
- Cost must be non-negative.
- All required fields enforce inline red error text.

### 3. Success State & QR Generation
Upon successful registration, the form is replaced with a success card:
- Displays primary details (Name, Tag, Status).
- **QR Code**: Renders a `QRCodeCanvas` encoding full text details (Name, Dept, Serial, Warranty, Price).
- **Download Action**: Click "Download QR" to instantly export the canvas to a `.png` file.
