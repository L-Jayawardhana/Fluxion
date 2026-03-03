# WelcomePage — Technical Documentation

> **File**: `FrontEnd/Fluxion/src/pages/Welcome/WelcomePage.jsx` (~289 lines)
> **Styles**: `FrontEnd/Fluxion/src/pages/Welcome/WelcomePage.css` (~779 lines)
> **Route**: `/welcome` (protected, requires authentication)
> **Theme**: Light paper (`#F2EFE8` background)

---

## Overview

The Welcome page serves as the primary onboarding hub for new organisation owners. It provides step-by-step setup workflows, contextual tips, smart suggestions, and keyboard shortcuts to help users configure their workspace.

---

## Component Structure

```
WelcomePage (default export)
├── Static data constants
│   ├── WORKFLOWS (4)       — Onboarding workflow cards
│   ├── SUGGESTIONS (6)     — Smart suggestion cards
│   ├── TIPS (6)            — "Did You Know?" expandable tips
│   └── SHORTCUTS (12)      — Keyboard shortcut definitions
└── Rendered sections
    ├── Header (logo)
    ├── Hero (greeting + meta + progress ring)
    ├── Workflows grid
    ├── Suggestions grid
    ├── Tips panel
    └── Keyboard shortcuts panel
```

---

## Data Constants

### WORKFLOWS (4 items)
Each workflow represents a setup step the user should complete:

| # | Title | Accent | Status |
|---|-------|--------|--------|
| 01 | Set Up Departments | `#3B82F6` (blue) | `next` — Start here → |
| 02 | Register Your Assets | `#22C55E` (green) | `todo` — Pending |
| 03 | Invite Your Team | `#F59E0B` (amber) | `todo` — Pending |
| 04 | Assign Assets to Users | `#7C3AED` (purple) | `todo` — Pending |

Each workflow includes:
- `num`: Display number ("01", "02", etc.)
- `emoji`: Section icon
- `title`: Workflow name
- `desc`: Description paragraph
- `steps`: Array of 4 HTML strings (rendered with `dangerouslySetInnerHTML`)
- `status` / `statusLabel`: Progress indicator
- `btn`: CTA button text

### SUGGESTIONS (6 items)
Contextual recommendations displayed in a 3×2 grid:

| Label | Title | Emoji |
|-------|-------|-------|
| Quick win | Add your IT department first | 💡 |
| Asset tip | Print QR labels immediately | 🏷️ |
| Team tip | Add a Technician early | 🔧 |
| Organisation tip | Record purchase dates & costs | 📋 |
| Security tip | Add an Admin before you travel | 🛡️ |
| Reporting tip | Run your first report after 30 days | 📊 |

### TIPS (6 items)
Advanced feature knowledge cards:

| Tag | Title |
|-----|-------|
| Users | You can add a user to multiple departments |
| Assets | Asset status updates automatically |
| Maintenance | Closing a ticket auto-creates a maintenance log |
| Assets | Retired assets stay in your history |
| Reports | Export any report as PDF or CSV |
| Subscription | The subscription page shows your live limits |

### SHORTCUTS (12 items)
Keyboard shortcuts displayed in a two-column grid:

| Action | Keys |
|--------|------|
| Global search | `Ctrl` + `K` |
| New asset | `N` + `A` |
| New ticket | `N` + `T` |
| Invite user | `N` + `U` |
| Go to dashboard | `G` + `D` |
| Go to assets | `G` + `A` |
| Go to tickets | `G` + `T` |
| Go to reports | `G` + `R` |
| Go to users | `G` + `U` |
| Export current view | `Ctrl` + `E` |
| Toggle sidebar | `Ctrl` + `\` |
| Help & docs | `?` |

---

## Page Sections

### 1. Header Logo
- Renders `LOGOblack.png` + "FLUXION" text (Syne 800-weight, ink colour).
- Links to `/` (landing page) via React Router `<Link>`.

### 2. Hero Section
```
┌─ rust → amber gradient accent line ──────────────────────────┐
│                                                   WELCOME    │ ← watermark bg
│  ◈ ── First time here                                        │
│  Welcome to Fluxion, User.           ● Status: Active        │
│  Your organisation workspace is      ● Role: Owner           │
│  ready. This guide will walk you     ● Account: user@...     │
│  through the key workflows...                                │
│                                                              │
│  ○ 1/4 Setup progress — 1 of 4 steps complete               │
│  ■ □ □ □ (step dots)                                         │
└──────────────────────────────────────────────────────────────┘
```

**Key features**:
- **Watermark**: `<div className="wl-hero-bg">WELCOME</div>` — 88px, 4% opacity.
- **Meta cards**: 3 inline meta items (Status, Role, Account) with coloured dots.
- **Progress ring**: SVG circle with animated `strokeDashoffset` transition.
  - Track: 25-radius circle, dashed stroke.
  - Fill: Animated from `157` (full circumference) to `118` (25% completion).
  - Label: "1/4" centred inside the ring.
- **Step dots**: 4 small rounded squares — first one has `.done` class.

### 3. Workflows Grid (2×2)
```
┌──────────────┐  ┌──────────────┐
│ Step 01      │  │ Step 02      │
│ 🏬           │  │ 💻           │
│ Set Up Depts │  │ Register     │
│ [steps...]   │  │ [steps...]   │
│ Start here → │  │ Pending      │
│ [Add dept]   │  │ [Register]   │
├──────────────┤  ├──────────────┤
│ Step 03      │  │ Step 04      │
│ 👥           │  │ 🔄           │
│ Invite Team  │  │ Assign       │
│ [steps...]   │  │ [steps...]   │
│ Pending      │  │ Pending      │
│ [Invite]     │  │ [Assign]     │
└──────────────┘  └──────────────┘
```

- Cards use `--wf-accent` CSS custom property for per-card accent colours.
- Steps rendered as `<ul>` with HTML content (`dangerouslySetInnerHTML`).
- Status badges: `.wl-wf-st-next` (rust/active) vs `.wl-wf-st-todo` (muted).
- CTA buttons with arrow icon.

### 4. Suggestions Grid (3×2)
6 cards in a 3-column grid, each with:
- Emoji icon in tinted circular background
- Label (small uppercase text)
- Title (bold)
- Description paragraph
- Arrow icon (→)

### 5. Tips Panel
Left-side panel with:
- Header: 💬 "Tips for You" + count badge
- 6 numbered tip items, each with:
  - Numbered circle (tinted background using tag colour)
  - Title + description
  - Tag badge (e.g. "Users", "Assets")

### 6. Keyboard Shortcuts Panel
Right-side panel with:
- Header: ⌨️ "Keyboard Shortcuts"
- 12 shortcut rows with action label and key badges (styled `<span>` elements)

---

## CSS Variables (`.wl-page`)

```css
.wl-page {
  --wl-ink: #0D0D0D;       /* Headings, primary text */
  --wl-paper: #F2EFE8;     /* Page background */
  --wl-rust: #C84B2F;       /* Accent, eyebrow, CTAs */
  --wl-steel: #3A4A5C;     /* Body text, subtitles */
  --wl-mist: #8A9BAD;      /* Meta labels */
  --wl-warm: #E8E2D6;      /* Borders, dividers */
  --wl-accent: #F0A500;    /* Amber highlights */
  --wl-green: #2A7A4B;     /* Success/active */
}
```

---

## Animations

| Element | Animation | Delay |
|---------|-----------|-------|
| Logo | `wlFadeUp 0.5s` | 0.1s |
| Hero section | `wlFadeUp 0.45s` | 0.05s |
| Workflow cards | `wlFadeUp` | 0.08s + i × 0.06s |
| Suggestion cards | `wlFadeUp` | 0.1s + i × 0.05s |
| Progress ring | JS transition | 500ms delay |

---

## Dependencies

| Import | Source | Usage |
|--------|--------|-------|
| `useEffect`, `useRef` | React | Progress ring animation, lifecycle |
| `Link` | react-router-dom | Logo link to `/` |
| `useAuth` | `../../hooks/useAuth` | User context (name, email, role) |
| `WelcomePage.css` | Co-located CSS | All styles |

---

## User Data Integration

| Field | Source | Fallback |
|-------|--------|----------|
| User name | `user.email.split('@')[0]` (capitalised) | `'there'` |
| User role | `user.role` | `'User'` |
| User email | `user.email` | `'—'` |

---

## Future Enhancements

- **Dynamic workflow status**: Connect to backend to track which setup steps are complete.
- **Progress ring**: Calculate actual completion percentage from API data.
- **Functional keyboard shortcuts**: Currently display-only — wire up to navigation actions.
- **Workflow CTA buttons**: Currently non-functional — link to respective pages.
- **Suggestion cards**: Make clickable to navigate to relevant features.
