# DashboardPage — Technical Documentation

> **File**: `FrontEnd/Fluxion/src/pages/Dashboard/DashboardPage.jsx` (~467 lines)
> **Styles**: `FrontEnd/Fluxion/src/pages/Dashboard/DashboardPage.css` (~748 lines)
> **Route**: `/dashboard` (protected, requires authentication)
> **Theme**: Light paper (`#F2EFE8` background) — matches Welcome page

---

## Overview

The Owner Dashboard provides a comprehensive operational overview for organisation owners. It displays KPIs, charts, tables, team status, department usage, activity feed, and warranty alerts — all with animated entrance transitions.

---

## Component Structure

```
DashboardPage (default export)
├── AnimVal (internal)         — Animated counter component
├── greetingText()             — Returns time-based greeting string
├── ArrowIcon                  — SVG component for table actions
└── Static data constants
    ├── MONTHS_COST            — 7-month bar chart data
    ├── DONUT_DATA             — 4-segment donut chart data
    ├── TICKETS                — 5 maintenance tickets
    ├── RECENT_ASSETS          — 5 recently added assets
    ├── TEAM_MEMBERS           — 6 team members
    ├── DEPARTMENTS            — 6 department usage entries
    ├── ACTIVITY               — 4 activity feed items
    └── WARRANTIES             — 4 warranty alert items
```

---

## Key Components

### `AnimVal({ val, suffix })`
Animated number counter using `requestAnimationFrame`.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `val` | `number` | — | Target value to count up to |
| `suffix` | `string` | `''` | Text appended after the number (e.g. `%`) |

- **Easing**: `easeOutCubic` — `1 - (1 - t)^3`
- **Duration**: 1200ms
- **Start delay**: 300ms (allows page to settle before counting)
- **Cleanup**: Properly cancels `requestAnimationFrame` and `setTimeout` on unmount.

### `greetingText()`
Returns a time-aware greeting:
- `00:00–11:59` → `"Good morning"`
- `12:00–16:59` → `"Good afternoon"`
- `17:00–23:59` → `"Good evening"`

### `ArrowIcon`
Inline SVG: `→` arrow icon (16×16 viewBox, stroke-based). Used in the tickets table action column.

---

## Data Flow

### API Integration
```javascript
const fetchAll = useCallback(async () => {
  const [usersRes] = await Promise.allSettled([api.get('/User')]);
  // Calculates: totalUsers, activeUsers
}, []);
```
- Fetches user data from `GET /api/User` on mount.
- Uses `Promise.allSettled` for graceful error handling (future-proofed for multiple API calls).
- Sets `orgData` state with `{ totalUsers, activeUsers }`.

### State
| State | Type | Description |
|-------|------|-------------|
| `loading` | `boolean` | Controls loading spinner display |
| `orgData` | `object \| null` | `{ totalUsers, activeUsers }` from API |

### Refs
| Ref | Type | Description |
|-----|------|-------------|
| `barRefs` | `useRef([])` | Array of DOM refs to bar chart `<div>` elements |
| `deptRefs` | `useRef([])` | Array of DOM refs to department bar `<div>` elements |

---

## Page Sections

### 1. Greeting Banner
```
┌─ gradient accent line ────────────────────────────────────┐
│  Good morning, User.                    Open: 12  │ 3  │ 5│
│  Here's what's happening across your organisation today.  │
└───────────────────────────────────────────────────────────┘
```
- User name extracted from email (`email.split('@')[0]`, capitalised).
- Name rendered in italic Instrument Serif via `<em>`.
- Right-side metrics: Open Tickets (rust), Overdue (amber), Expiring Soon (mist).

### 2. KPI Cards (4-column grid)

| Card | CSS Class | Icon | Colour | Value | Source |
|------|-----------|------|--------|-------|--------|
| Total Assets | `.db-kpi-blue` | 💻 | `--db-blue` | 248 | Static placeholder |
| Open Tickets | `.db-kpi-rust` | 🎫 | `--db-rust` | 12 | Static placeholder |
| Under Maintenance | `.db-kpi-amber` | 🔧 | `--db-amber` | 7 | Static placeholder |
| Active Users | `.db-kpi-green` | 👥 | `--db-green` | Dynamic | `orgData.activeUsers` |

Each card features:
- 2px coloured top accent bar
- 34×34 icon container with 15% opacity tinted background
- Animated `AnimVal` counter
- Delta badge (`↑`/`↓`) with contextual colour
- Subtitle text

### 3. Monthly Maintenance Cost (Bar Chart)

**Layout**: 7 vertical bars side-by-side (Aug → Feb).

```
  ██                         ██    ← current month (rust)
  ██  ██        ██  ██  ██   ██    ← dim bars (rust 35%)
  Aug Sep Oct Nov Dec Jan Feb
```

- **Animation**: Each bar starts at height `0%` and transitions to its target height (400ms + i × 80ms stagger).
- **Styling**: Current month = solid rust; others = 35% opacity rust.
- **Header**: YTD total ($14,820) left, current month ($2,340) right.
- **Gradient overlay**: Each bar has a subtle white→transparent top-to-bottom gradient.

### 4. Asset Breakdown (Donut Chart)

**Implementation**: CSS `conic-gradient` (not SVG or canvas).

```css
conic-gradient(
  var(--db-blue) 0% 46%,     /* Laptops */
  var(--db-green) 46% 65%,   /* Printers */
  var(--db-rust) 65% 80%,    /* Vehicles */
  var(--db-amber) 80% 100%   /* Other */
)
```

- **Centre**: White circle overlay with total count (248) and "Total" label.
- **Legend**: 4-row legend with colour dot, name, percentage, and count.
- **Animation**: Scale + rotate entry (`dbDonutSpin`) with 0.3s delay.

### 5. Open Maintenance Tickets (Table)

| Column | Class | Content |
|--------|-------|---------|
| Asset / Dept | `.db-t-asset`, `.db-t-dept` | Asset name + department |
| Issue | `.db-t-issue` | Issue description (truncated) |
| Status | `.db-badge-{open\|prog\|wait}` | Coloured badge |
| Priority | `.db-priority-{crit\|high\|med\|low}` | Coloured badge |
| Age | `.db-t-age` | Time since opening |
| Action | `.db-t-action` | Arrow icon button |

### 6. Recently Added Assets (List)
5 items with emoji thumbnail, name, department/serial meta, and status badge.

### 7. Team Grid (2-column)
6 team members with:
- Coloured avatar circle (initials)
- Name and role
- Online status indicator (green dot with glow)
- Plan usage bar at bottom (68% of 25 seats)

### 8. Assets by Department (Horizontal Bars)
6 departments with animated horizontal bars:
- Each bar starts at width `0%` and transitions to target (600ms + i × 100ms).
- Colour-coded per department.
- Shows used/total count.

### 9. Recent Activity Feed
4 items with:
- Coloured icon container (emoji + tinted background)
- Text with `<strong>` highlights
- Relative timestamp

### 10. Warranty Expiry Alerts
4 items with:
- Urgency emoji icon
- Asset name
- Days-remaining badge:
  - `db-w-crit`: ≤ 14 days (rust background)
  - `db-w-warn`: 15–60 days (amber background)
  - `db-w-ok`: > 60 days (green background)

---

## CSS Variables (Light Theme)

```css
.db-page {
  --db-bg:      #F2EFE8;      /* Paper background */
  --db-surface: #EDE9E0;      /* Slightly darker paper */
  --db-card:    #FFFFFF;       /* White cards */
  --db-border:  rgba(13,13,13,.10);
  --db-border2: rgba(13,13,13,.06);
  --db-paper:   #0D0D0D;      /* Headings (ink on paper) */
  --db-rust:    #C84B2F;       /* Primary accent */
  --db-amber:   #D48A08;       /* Warning accent */
  --db-green:   #2D9456;       /* Success accent */
  --db-blue:    #2A6FC8;       /* Info accent */
  --db-mist:    #6B7A8D;       /* Secondary text */
  --db-dim:     #8A9BAD;       /* Labels, captions */
  --db-text:    #1A1A1A;       /* Body text */
}
```

---

## Grid Layout

```
┌───────────────────────────────────────────────────────┐
│  Greeting Banner (full width)                         │
├───────────────────────────────────────────────────────┤
│  KPI 1  │  KPI 2  │  KPI 3  │  KPI 4                │
├─────────────────────────┬─────────────────────────────┤
│  Bar Chart (3fr)        │  Donut Chart (2fr)          │
├─────────────────────────┬─────────────────────────────┤
│  Tickets Table (3fr)    │  Recent Assets (2fr)        │
├────────────┬────────────┬─────────────────────────────┤
│  Team      │ Depts      │  Activity + Warranty        │
│  (1fr)     │ (1fr)      │  (1fr stacked)              │
└────────────┴────────────┴─────────────────────────────┘
```

---

## Future Integration Points

The following sections currently use **static placeholder data** and are designed to be connected to API endpoints:

| Section | Current | Future Endpoint |
|---------|---------|----------------|
| Total Assets KPI | `248` | `GET /api/Asset/count` |
| Open Tickets KPI | `12` | `GET /api/Ticket?status=open` + count |
| Under Maintenance | `7` | `GET /api/Asset?status=maintenance` + count |
| Bar chart costs | Static array | `GET /api/Report/maintenance-cost?months=7` |
| Donut breakdown | Static array | `GET /api/Asset/breakdown-by-type` |
| Tickets table | 5 static items | `GET /api/Ticket?status=open&limit=5` |
| Recent assets | 5 static items | `GET /api/Asset?sort=createdAt&limit=5` |
| Team members | 6 static items | `GET /api/User?orgId={id}` |
| Department bars | 6 static items | `GET /api/Department/usage` |
| Activity feed | 4 static items | `GET /api/AuditLog?limit=4` |
| Warranty alerts | 4 static items | `GET /api/Asset/warranty-expiring?limit=4` |
