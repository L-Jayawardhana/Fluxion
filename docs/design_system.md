# Fluxion Design System

> This document defines the visual language, colour tokens, typography, spacing, animation, and component patterns used across the Fluxion FrontEnd application.

---

## 1. Colour Palette

### Global Root Tokens (`:root` in `index.css`)

| Token | Hex | Swatch | Usage |
|-------|-----|--------|-------|
| `--color-bg` | `#0D0D0D` | ⬛ Ink | Global body background |
| `--color-surface` | `#151515` | ⬛ Surface | Auth cards, elevated dark surfaces |
| `--color-surface-hover` | `#1C1C1C` | ⬛ Surface hover | Button/card hover on dark |
| `--color-border` | `rgba(242,239,232,.08)` | — | Subtle borders on dark backgrounds |
| `--color-text` | `#F2EFE8` | ⬜ Paper | Primary text on dark backgrounds |
| `--color-text-muted` | `#8A9BAD` | 🔘 Mist | Secondary/helper text |
| `--color-primary` | `#C84B2F` | 🟥 Rust | Primary accent, buttons, active states |
| `--color-primary-hover` | `#E05A3C` | 🟧 Rust Light | Hover states for primary actions |
| `--color-danger` | `#C84B2F` | 🟥 Rust | Destructive actions (shares rust) |
| `--color-success` | `#2A7A4B` | 🟩 Green | Success badges, confirmation states |
| `--color-accent` | `#F0A500` | 🟨 Amber | Warnings, highlights, secondary CTA |
| `--color-steel` | `#3A4A5C` | 🔵 Steel | Body text on light backgrounds |
| `--color-warm` | `#E8E2D6` | ⬜ Warm | Neutral borders on light backgrounds |

### Dashboard Page Tokens (`.db-page`)

| Token | Hex | Usage |
|-------|-----|-------|
| `--db-bg` | `#F2EFE8` | Paper background |
| `--db-surface` | `#EDE9E0` | Slightly darker paper |
| `--db-card` | `#FFFFFF` | White cards |
| `--db-border` | `rgba(13,13,13,.10)` | Card borders |
| `--db-border2` | `rgba(13,13,13,.06)` | Inner dividers |
| `--db-paper` | `#0D0D0D` | Headings (ink on paper) |
| `--db-rust` | `#C84B2F` | Accent — open tickets, critical |
| `--db-rust-d` | `#A03822` | Darker rust for hover |
| `--db-amber` | `#D48A08` | Warnings, in-progress |
| `--db-green` | `#2D9456` | Success, active |
| `--db-blue` | `#2A6FC8` | Info, default KPI |
| `--db-mist` | `#6B7A8D` | Secondary text |
| `--db-dim` | `#8A9BAD` | Labels, captions |
| `--db-text` | `#1A1A1A` | Body text |

### Welcome Page Tokens (`.wl-page`)

| Token | Hex | Usage |
|-------|-----|-------|
| `--wl-ink` | `#0D0D0D` | Headings, primary text |
| `--wl-paper` | `#F2EFE8` | Page background |
| `--wl-rust` | `#C84B2F` | Accent, eyebrow, CTAs |
| `--wl-steel` | `#3A4A5C` | Body text, subtitles |
| `--wl-mist` | `#8A9BAD` | Meta labels |
| `--wl-warm` | `#E8E2D6` | Borders, dividers |
| `--wl-accent` | `#F0A500` | Amber highlights |
| `--wl-green` | `#2A7A4B` | Success/active |

---

## 2. Theme Zones

The application uses **three distinct theme zones**:

| Zone | Background | Text | Where |
|------|-----------|------|-------|
| **Dark** | `#0D0D0D` Ink | `#F2EFE8` Paper | Sidebar, topbar, auth pages, landing |
| **Light** | `#F2EFE8` Paper | `#0D0D0D` Ink | Welcome page, dashboard page |
| **Card** | `#FFFFFF` White | `#1A1A1A` Near-ink | Dashboard panels, welcome cards |

### Light Theme Mapping (Welcome + Dashboard)
Both the Welcome and Dashboard pages share the **same light paper palette**:
- Page background: `#F2EFE8`
- Card background: `#FFFFFF`
- Heading text: `#0D0D0D`
- Body text: `#1A1A1A`
- Borders: `rgba(13,13,13,.10)`
- All accent colours (rust, amber, green, blue) are consistent across both pages.

---

## 3. Typography

### Font Stack

| Font | Weight | CSS | Usage |
|------|--------|-----|-------|
| **Poppins** | 400, 500, 600, 700 | `var(--font)` | Default body text, auth pages, buttons |
| **Syne** | 700, 800 | `'Syne', sans-serif` | Headings, panel titles, KPI values, sidebar labels |
| **DM Mono** | 400 | `'DM Mono', monospace` | Dashboard body, table data, monospace blocks |
| **Instrument Serif** | 400 italic | `'Instrument Serif', serif` | Greeting name, decorative italics |

### Type Scale

| Element | Font | Size | Weight | Tracking |
|---------|------|------|--------|----------|
| Page heading (h2) | Syne | 18–20px | 800 | -0.02em |
| Panel title | Syne | 14px | 700 | -0.01em |
| KPI value | Syne | 32px | 800 | -0.04em |
| Body text | DM Mono / Poppins | 12–13px | 400 | 0 |
| Labels (uppercase) | DM Mono / Poppins | 9–10px | 400 | 0.10–0.14em |
| Badge text | DM Mono | 9px | 400 | 0.08em |
| Meta/caption | Poppins | 10–11px | 400 | 0 |
| Eyebrow | Poppins | 0.65rem | 400 | 0.18em |
| Hero title (Welcome) | Poppins | 1.65rem | 800 | -0.03em |

---

## 4. Spacing System

| Token | Value | Usage |
|-------|-------|-------|
| Component gap | `14px` | Grid gap, row gap |
| Card padding | `16–20px` | Panel body/head |
| Section margin | `24–28px` | Vertical spacing between sections |
| Page bottom padding | `40px` | Dashboard, `3rem` Welcome |
| Border radius (small) | `6–8px` | Badges, buttons, inputs |
| Border radius (medium) | `10px` | Cards, panels, KPIs |
| Border radius (large) | `var(--radius-lg)` = `12px` | Hero sections |

---

## 5. Animation System

### Keyframe Animations

| Name | Effect | Duration | Easing |
|------|--------|----------|--------|
| `dbFadeUp` / `wlFadeUp` | Fade in + slide up 16px | 0.4–0.5s | ease (default) |
| `dbSpin` | 360° rotation | 0.7s | linear |
| `dbPulse` / `wlPulse` | Opacity 1 → 0.4 → 1 | — | ease |
| `dbDonutSpin` | Scale 0.8 → 1 + rotate entry | 0.8s | ease |

### Animated Elements

| Element | Type | Delay Pattern |
|---------|------|---------------|
| Greeting banner | fadeUp | 0.05s |
| KPI cards (1–4) | fadeUp | 0.05s + i × 0.05s (staggered) |
| Chart rows | fadeUp | 0.25s, 0.30s, 0.35s |
| Bar chart bars | height transition | 400ms + i × 80ms |
| Department bars | width transition | 600ms + i × 100ms |
| Counter (AnimVal) | rAF easeOutCubic | 300ms start delay, 1200ms duration |
| Donut chart | scale + rotate | 0.3s delay, 0.8s duration |

### Transition Defaults
```css
transition: all .2s;           /* Buttons, hover states */
transition: background .15s;   /* Table row hover */
transition: transform .2s, box-shadow .2s;  /* Card lift */
```

---

## 6. Component Patterns

### Cards / Panels
```
┌──────────────────────────────────┐
│ ▅▅ 2px accent top border        │
├──────────────────────────────────┤
│  Panel Title          Action →   │  ← .db-panel-head
├──────────────────────────────────┤
│                                  │
│  Content area                    │  ← .db-panel-body
│                                  │
└──────────────────────────────────┘
```
- Background: `var(--db-card)` = `#FFFFFF`
- Border: `1px solid rgba(13,13,13,.10)`
- Border radius: `10px`
- Accent top: 2px coloured gradient line

### KPI Card
```
┌──────────────────────┐
│ ▅▅▅ colour accent     │
│ 🔧  icon (34×34 bg)  │
│ LABEL (uppercase)     │
│ 248  (big number)     │
│ ↑ 12 this month      │
└──────────────────────┘
```
- 4-column grid (`repeat(4, 1fr)`)
- Colour variants: blue, rust, amber, green

### Status Badges
```css
.db-badge-open    /* Rust bg 12%, rust text */
.db-badge-prog    /* Amber bg 12%, amber text */
.db-badge-done    /* Green bg 12%, green text */
.db-badge-wait    /* Blue bg 12%, blue text */
```
Each badge includes a small 5px colour dot via `::before`.

### Priority Badges
```css
.db-priority-crit  /* Rust */
.db-priority-high  /* Amber */
.db-priority-med   /* Blue */
.db-priority-low   /* Green */
```

---

## 7. Icon System

All icons are **inline SVG** components — no external icon library.

### Specifications
- **Viewbox**: `0 0 16 16`
- **Style**: Stroke-based, `fill="none"`
- **Stroke**: `currentColor`, width `1.5px`
- **Size**: Controlled by parent CSS (`width`/`height`)

### Sidebar Icons (MainLayout)
22 unique icons defined in the `I` object: `welcome`, `dashboard`, `users`, `invite`, `roles`, `department`, `plus`, `asset`, `assignment`, `qr`, `category`, `ticket`, `raise`, `log`, `overdue`, `report`, `chart`, `warranty`, `exportData`, `globe`, `audit`, `settings`, `support`, `search`, `bell`, `gear`.

### Dashboard Icons
- `ArrowIcon`: Used for table row actions (→ arrow).
- Emoji icons: Used for KPI cards, assets, activities, and team avatars.

---

## 8. Responsive Breakpoints

| Breakpoint | Dashboard Changes |
|----------|-------------------|
| `≤ 1200px` | KPI grid → 2 columns; all `3fr 2fr` and `2fr 3fr` rows → single column; 3-column row → single column |
| `≤ 768px` | KPI grid → 1 column; greeting stacks vertically; team grid → 1 column; donut → stacked |

---

## 9. CSS Architecture

### Naming Convention
- **Prefix-based scoping**: Each page/layout owns a unique prefix:
  - `.db-` — Dashboard
  - `.wl-` — Welcome
  - `.ml-` — MainLayout
  - `.auth-` — Auth pages
- No CSS Modules or CSS-in-JS — plain CSS files co-located with components.

### Variable Scoping
- Global tokens in `:root` (index.css).
- Page-specific tokens scoped to the page root class (`.db-page`, `.wl-page`).
- This enables each page to define its own theme (light/dark) independently.

### File Organisation
```
index.css             → Global reset, :root vars, auth layout
MainLayout.css        → Sidebar, topbar, shell
DashboardPage.css     → Dashboard-specific styles (748 lines)
WelcomePage.css       → Welcome page styles (779 lines)
SplashScreen.css      → Splash screen animation
```
