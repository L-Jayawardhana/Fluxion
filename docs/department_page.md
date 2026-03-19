# DepartmentPage — Technical Documentation

> **Files**:
>
> - Frontend: `FrontEnd/Fluxion/src/pages/Departments/DepartmentPage.jsx`
> - Admin Dashboard: `FluxionAdminDash/src/pages/Departments/`
> - Styles: `src/pages/Departments/DepartmentPage.css`
>   **Route**: `/departments` (protected, requires Admin or SystemAdmin role)
>   **Theme**: Light paper (`#F2EFE8` background) — matches Dashboard page

---

## Overview

The Department Management page provides administrators with a comprehensive interface to manage organizational departments. Features include viewing all departments, creating new departments, editing existing ones, and deleting departments with confirmation dialogs. The page includes a data table with sorting, search, and action buttons.

---

## Component Structure

```
DepartmentPage (default export)
├── State Management
│   ├── departments         — Array of department objects
│   ├── loading             — Boolean for loading state
│   ├── error               — Error message string
│   ├── editingId           — ID of department being edited
│   ├── formData            — Form state for create/edit
│   └── searchTerm          — Search filter term
├── API Handlers
│   ├── fetchDepartments()  — GET all departments
│   ├── createDepartment()  — POST new department
│   ├── updateDepartment()  — PUT existing department
│   └── deleteDepartment()  — DELETE department
├── UI Components
│   ├── DepartmentForm      — Create/edit form modal
│   ├── DepartmentTable     — Data table with actions
│   ├── DeleteConfirmation  — Delete confirmation dialog
│   └── SearchBar           — Filter departments
└── Static data constants
    └── TABLE_HEADERS       — Column definitions
```

---

## Data Structure

### Department Object

```json
{
  "departmentId": 1,
  "departmentName": "Engineering",
  "description": "Software Development Team",
  "isActive": true,
  "createdAt": "2026-03-15T10:30:00Z",
  "updatedAt": "2026-03-17T14:22:00Z"
}
```

### Form Data State

```json
{
  "departmentName": "",
  "description": "",
  "isActive": true
}
```

---

## API Integration

### Fetch Departments

```javascript
const fetchDepartments = useCallback(async () => {
  try {
    setLoading(true);
    const response = await api.get("/api/Department");
    setDepartments(response.data);
    setError(null);
  } catch (err) {
    setError("Failed to load departments");
  } finally {
    setLoading(false);
  }
}, []);
```

- **Endpoint**: `GET /api/Department`
- **On Mount**: Automatically fetches all departments
- **Error Handling**: Displays user-friendly error message
- **Loading State**: Shows spinner during fetch

### Create Department

```javascript
const createDepartment = async (formData) => {
  const response = await api.post("/api/Department", formData);
  return response.data;
};
```

- **Endpoint**: `POST /api/Department`
- **Payload**: `{ departmentName, description, isActive }`
- **Response**: Created department object with ID
- **Validation**: Server-side validation for unique department names

### Update Department

```javascript
const updateDepartment = async (id, formData) => {
  const response = await api.put(`/api/Department/${id}`, {
    departmentId: id,
    ...formData,
  });
  return response.data;
};
```

- **Endpoint**: `PUT /api/Department/{id}`
- **Payload**: `{ departmentId, departmentName, description, isActive }`
- **Response Code**: `204 No Content`
- **Validation**: ID in URL must match departmentId in body

### Delete Department

```javascript
const deleteDepartment = async (id) => {
  await api.delete(`/api/Department/${id}`);
};
```

- **Endpoint**: `DELETE /api/Department/{id}`
- **Response Code**: `204 No Content`
- **Confirmation**: Requires user confirmation before deletion
- **Note**: Hard delete — department data is permanently removed

---

## Page State Management

### State Variables

| State               | Type             | Description                          |
| ------------------- | ---------------- | ------------------------------------ |
| `departments`       | `array`          | List of all departments              |
| `loading`           | `boolean`        | API call in progress                 |
| `error`             | `string \| null` | Error message if any                 |
| `editingId`         | `number \| null` | ID of department being edited        |
| `formData`          | `object`         | Current form values                  |
| `searchTerm`        | `string`         | Search/filter input                  |
| `showDeleteConfirm` | `boolean`        | Delete confirmation modal visibility |
| `deleteTargetId`    | `number \| null` | ID of department to delete           |

### Effects

```javascript
useEffect(() => {
  fetchDepartments();
}, []); // Fetch on mount
```

---

## Page Sections

### 1. Header

```
┌──────────────────────────────────────────────────┐
│  Departments                                      │
│  Manage organizational departments                │
└──────────────────────────────────────────────────┘
```

- Page title and description
- Breadcrumb navigation (optional)

### 2. Action Bar

```
┌──────────────────────────────────────────────────┐
│ [🔍 Search departments......]  [+ New Department] │
└──────────────────────────────────────────────────┘
```

- Search input with debounce (filters by name/description)
- "Create New Department" button (opens form modal)

### 3. Departments Table

| Department  | Description               | Status | Created    | Actions |
| ----------- | ------------------------- | ------ | ---------- | ------- |
| Engineering | Software Development Team | Active | 2026-03-15 | ✏️ 🗑️   |
| Sales       | Business Development      | Active | 2026-03-16 | ✏️ 🗑️   |

**Features:**

- Sortable columns (click header to sort)
- Dynamic row count
- Action buttons: Edit (pencil icon), Delete (trash icon)
- Status badge: Green for active, gray for inactive
- Empty state: "No departments found" message

### 4. Create/Edit Form Modal

```
┌────────────────────────────────┐
│ New Department         [×]     │
├────────────────────────────────┤
│ Department Name *               │
│ [Engineering............]       │
│                                 │
│ Description                     │
│ [Software Development Team...] │
│                                 │
│ Status                          │
│ [✓] Active                      │
├────────────────────────────────┤
│              [Cancel] [Save]    │
└────────────────────────────────┘
```

**Form Fields:**

- `departmentName` — Required text input
- `description` — Optional textarea
- `isActive` — Toggle checkbox
- **Validation**:
  - Department name is required
  - Cannot create duplicate department names
  - Max length: 100 characters for name

**Modes:**

- **Create**: Empty form, title "New Department"
- **Edit**: Pre-filled form, title "Edit Department"

### 5. Delete Confirmation Dialog

```
┌────────────────────────────────┐
│ ⚠️ Delete Department           │
├────────────────────────────────┤
│ Are you sure you want to       │
│ delete "Engineering"?          │
│                                 │
│ This action cannot be undone.  │
├────────────────────────────────┤
│        [Cancel]  [Delete]      │
└────────────────────────────────┘
```

**Behavior:**

- Shows department name in confirmation message
- Disabled delete button during API call
- Shows error if delete fails
- Closes modal and refreshes list on success

---

## Keyboard Shortcuts (Optional)

| Action             | Keys         |
| ------------------ | ------------ |
| New department     | `N` + `D`    |
| Search departments | `Ctrl` + `F` |
| Close modal        | `Esc`        |
| Focus search       | `/`          |

---

## Styling & Theme

| Element         | Color                   | Font        |
| --------------- | ----------------------- | ----------- |
| Background      | `#F2EFE8` (light paper) |             |
| Table header    | `#E5E0DA`               | Inter, bold |
| Active status   | `#22C55E` (green)       |             |
| Inactive status | `#9CA3AF` (gray)        |             |
| Action buttons  | `#3B82F6` (blue)        |             |
| Delete button   | `#DC2626` (red)         |             |
| Hover state     | `#F5F3F0` (light)       |             |

---

## Access Control

| Role        | Access    |
| ----------- | --------- |
| SystemAdmin | Full CRUD |
| Admin       | Full CRUD |
| Technician  | Read-only |
| User        | No access |

**Protected Routes:**

- Page is only accessible to authenticated users with Admin or SystemAdmin role
- Unauthorized users are redirected to `/dashboard`

---

## Error Handling

### Common Errors

| Error                | Status | Message                          |
| -------------------- | ------ | -------------------------------- |
| Department not found | 404    | "Department no longer exists"    |
| Duplicate name       | 409    | "Department name already exists" |
| Unauthorized         | 403    | "You don't have permission"      |
| Server error         | 500    | "Failed to process request"      |

### User Feedback

- Toast notifications for success/error messages
- Inline error messages in form
- Loading spinners during async operations
- Disabled buttons during submission

---

## Performance Optimizations

- **Memoization**: `useCallback` for event handlers
- **Debouncing**: Search input debounced by 300ms
- **Lazy Loading**: Departments loaded on demand (pagination if list grows large)
- **API Calls**: Cancel previous requests if new one initiated
- **Re-renders**: Prevent unnecessary component updates with `React.memo`

---

## Future Enhancements

- [ ] Bulk edit/delete departments
- [ ] Department permissions configuration
- [ ] Department-specific asset assignment
- [ ] Export departments as CSV
- [ ] Import departments from CSV
- [ ] Batch operations with checkboxes
- [ ] Advanced filtering by status/date
- [ ] Pagination for large lists
