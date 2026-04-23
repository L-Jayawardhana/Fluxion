# Fluxion FrontEnd — Architecture & Project Structure

> **Stack**: React 18 · Vite · React Router v6 · Axios · CSS Modules (plain CSS)
> **Deployment**: Vercel (production) · Docker + Nginx (containerised)

---

## Directory Layout

```
FrontEnd/Fluxion/
├── public/
│   ├── LOGOblack.png        # Logo for light backgrounds
│   ├── LOGOwhite.png        # Logo for dark backgrounds
│   └── ...
├── src/
│   ├── App.jsx              # Root component — routes, providers
│   ├── main.jsx             # Vite entry point — renders <App />
│   ├── index.css            # Global reset, root CSS variables, auth layout
│   ├── assets/              # Static images (illustrations, icons)
│   ├── components/          # Shared reusable components
│   │   ├── AssignAssetsGraphic.jsx
│   │   ├── Footer.jsx
│   │   ├── GrowingGraph.jsx
│   │   ├── Header.jsx
│   │   ├── InviteTeamGraphic.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── RegisterAssetsGraphic.jsx
│   │   ├── SplashScreen.jsx
│   │   └── SplashScreen.css
│   ├── hooks/
│   │   └── useAuth.jsx      # AuthContext provider + useAuth hook
│   ├── layouts/
│   │   ├── MainLayout.jsx   # Sidebar + topbar shell (7 nav groups)
│   │   └── MainLayout.css
│   ├── pages/
│   │   ├── Dashboard/
│   │   │   ├── DashboardPage.jsx   # Owner dashboard (KPIs, charts, tables)
│   │   │   └── DashboardPage.css
│   │   ├── Welcome/
│   │   │   ├── WelcomePage.jsx     # Onboarding hub (workflows, tips)
│   │   │   └── WelcomePage.css
│   │   ├── Login/
│   │   │   ├── LoginPage.jsx
│   │   │   └── LoginPage.css
│   │   ├── Register/
│   │   │   ├── RegisterPage.jsx
│   │   │   └── RegisterPage.css
│   │   ├── ForgotPassword/
│   │   │   ├── ForgotPasswordPage.jsx
│   │   │   └── ForgotPasswordPage.css
│   │   ├── Landing/
│   │   │   ├── LandingPage.jsx
│   │   │   └── LandingPage.css
│   │   └── NotFound/
│   │       └── NotFoundPage.jsx
│   └── services/
│       ├── api.js           # Axios instance + JWT interceptors
│       └── authService.js   # Auth API helper functions
├── .env                     # VITE_API_URL=http://20.2.91.234/api
├── index.html               # Vite HTML entry (font links, meta)
├── package.json
├── vite.config.js
├── eslint.config.js
├── Dockerfile               # Multi-stage: Node build → Nginx
└── nginx.conf               # SPA-compatible Nginx config
```

---

## Data Flow

```
User Action
    ↓
React Component (page)
    ↓
api.js (Axios)  ←── JWT auto-attached via request interceptor
    ↓
Backend API (http://20.2.91.234/api)
    ↓
Response
    ↓
Component state (useState / useCallback)
    ↓
Re-render
```

### Authentication Flow
```
LoginPage / RegisterPage
    ↓
authService.login() / authService.register()
    ↓
Backend returns { userId, token, role, ... }
    ↓
useAuth().login(data) → stores in localStorage/sessionStorage
    ↓
ProtectedRoute checks isAuthenticated
    ↓
MainLayout renders with user context
```

---

## Routing Architecture

### Route Hierarchy
```jsx
<BrowserRouter>
  <Routes>
    {/* Public */}
    <Route path="/"                element={<LandingPage />} />

    {/* Auth — wrapped in AuthLayout for transitions */}
    <Route element={<AuthLayout />}>
      <Route path="/login"           element={<LoginPage />} />
      <Route path="/register"        element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    </Route>

    {/* Protected — wrapped in sidebar layout */}
    <Route element={<ProtectedRoute />}>
      <Route element={<MainLayout />}>
        <Route path="/welcome"   element={<WelcomePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Route>
    </Route>

    {/* 404 */}
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
</BrowserRouter>
```

### Route Table

| Route | Component | Auth | Layout | Description |
|-------|-----------|------|--------|-------------|
| `/` | LandingPage | No | None | Public marketing page |
| `/login` | LoginPage | No | Auth | Email + Google login |
| `/register` | RegisterPage | No | Auth | Multi-step registration |
| `/forgot-password` | ForgotPasswordPage | No | Auth | Password reset flow |
| `/welcome` | WelcomePage | Yes | MainLayout | Onboarding hub |
| `/dashboard` | DashboardPage | Yes | MainLayout | Owner dashboard |
| `*` | NotFoundPage | No | None | 404 fallback |

---

## Key Components

### `useAuth` Hook
- **Provider**: `AuthProvider` wraps the entire app in `App.jsx`.
- **Context Values**: `{ user, token, login, logout, isAuthenticated, loading }`
- **User Shape**: `{ userId: number, email: string, role: string, orgId: number }`
- **Storage**: Dual-write to `localStorage` + `sessionStorage`; reads from whichever has a token.
- **Auto-expiry**: On mount, checks `expiresAt` and clears if expired.

### `ProtectedRoute`
- Renders `<Outlet />` if `isAuthenticated === true`.
- Redirects to `/login` with `state.from` if unauthenticated.
- Shows a loading spinner while `loading` is true.

### `api.js` (Axios Instance)
- **Base URL**: `import.meta.env.VITE_API_URL`
- **Request Interceptor**: Reads token from storage, attaches `Authorization: Bearer {token}`.
- **Response Interceptor**: On `401`, clears auth state and redirects to `/login`.

### `MainLayout`
- **Shell**: CSS Grid with fixed sidebar (240px) + flexible main area.
- **Sidebar**: Dark `#0D0D0D` background, 7 grouped nav sections, SVG icons, profile footer.
- **Topbar**: Breadcrumb trail, live clock, search button, notification bell.
- **Content Area**: `<Outlet />` renders the active page within a lightweight `Suspense` boundary to ensure non-blocking internal navigation.

### `SplashScreen`
- Shows once per browser session (`sessionStorage.splashShown`).
- Animated Fluxion branding → fade out → calls `onComplete` callback.

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://20.2.91.234/api` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID | `xxxx.apps.googleusercontent.com` |

---

## Build & Deploy

### Local Development
```bash
cd FrontEnd/Fluxion
npm install
npm run dev          # Starts Vite dev server on http://localhost:5173
```

### Production Build
```bash
npm run build        # Outputs to dist/
npm run preview      # Preview production build locally
```

### Docker
```bash
docker build -t fluxion-frontend .
docker run -p 80:80 fluxion-frontend
```

### Vercel
- Auto-deploys from Git pushes.
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables configured in Vercel dashboard.

---

## Conventions

1. **Page structure**: Each page has its own directory (`pages/{Name}/{Name}Page.jsx` + `{Name}Page.css`).
2. **CSS scoping**: Each page uses a unique prefix (`.db-` for Dashboard, `.wl-` for Welcome, `.ml-` for MainLayout) to avoid conflicts.
3. **CSS Variables**: Page-scoped variables are defined on the page's root class (`.db-page`, `.wl-page`), not `:root`.
4. **Icons**: SVG inline components (16×16, stroke-based, 1.5px) — no icon library dependency.
5. **State management**: Local `useState` + `useCallback` — no Redux or Zustand.
6. **API calls**: Always through `services/api.js` — never raw `fetch` or direct `axios`.
7. **Error handling**: API errors caught silently in `try/catch`; user-facing errors via toast or inline messages.
