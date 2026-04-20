# qa/selenium/config.py
"""
Central configuration for Selenium E2E tests.
"""

BASE_URL = "http://localhost:5173"  # Vite dev server for FrontEnd/Fluxion
ADMIN_URL = "http://localhost:5174"  # Vite dev server for FluxionAdminDash

# Test user credentials — should match seeded data in test DB
USERS = {
    "owner":      {"email": "owner@fluxion.test",      "password": "Test1234!"},
    "admin":      {"email": "admin@fluxion.test",      "password": "Test1234!"},
    "technician": {"email": "tech@fluxion.test",       "password": "Test1234!"},
    "user":       {"email": "employee@fluxion.test",   "password": "Test1234!"},
}

# Routes and which roles should be ALLOWED to access them
PROTECTED_ROUTES = {
    "/dashboard":            ["owner", "admin"],
    "/invite-users":         ["owner", "admin"],
    "/users":                ["owner", "admin"],
    "/roles":                ["owner", "admin"],
    "/departments":          ["owner", "admin"],
    "/add-department":       ["owner", "admin"],
    "/register-asset":       ["owner", "admin"],
    "/assets":               ["owner", "admin"],
    "/assignments":          ["owner", "admin"],
    "/tickets":              ["owner", "admin", "user"],
    "/raise-ticket":         ["owner", "admin", "user"],
    "/maintenance-logs":     ["owner", "admin"],
    "/report-warranty":      ["owner", "admin"],
    "/report-maintenance-cost": ["owner", "admin"],
    "/technician/dashboard": ["technician"],
    "/technician/tickets":   ["technician"],
    "/technician/performance": ["technician"],
    "/notifications":        ["owner", "admin", "technician", "user"],
    "/settings":             ["owner", "admin", "technician", "user"],
}
