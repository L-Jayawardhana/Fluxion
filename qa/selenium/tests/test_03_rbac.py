# qa/selenium/tests/test_03_rbac.py
"""
Role-Based Access Control (RBAC) E2E tests.
This is the MOST CRITICAL test suite for Fluxion — verifies that each
role can only access the routes they're authorized for.
"""
import time
import pytest
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from config import BASE_URL, USERS, PROTECTED_ROUTES
from pages.login_page import LoginPage


class TestRBAC:
    """Verifies role-based access control across all protected routes."""

    def _login_as(self, driver, role):
        """Helper: log in as a specific role and wait for redirect."""
        page = LoginPage(driver, BASE_URL)
        page.clear_auth()
        page.login(USERS[role]["email"], USERS[role]["password"])
        time.sleep(3)

    # ── Parametrized: blocked roles should NOT access restricted routes ──
    @pytest.mark.parametrize("route,allowed_roles", PROTECTED_ROUTES.items())
    def test_unauthorized_roles_redirected(self, user_driver, route, allowed_roles):
        """
        For each protected route, log in as each BLOCKED role and verify
        they are redirected away (to /login, /welcome, or another page).
        """
        all_roles = ["owner", "admin", "technician", "user"]
        blocked_roles = [r for r in all_roles if r not in allowed_roles]

        for role in blocked_roles:
            self._login_as(user_driver, role)
            user_driver.get(f"{BASE_URL}{route}")
            time.sleep(2)

            current = user_driver.current_url.replace(BASE_URL, "")
            # The blocked role should NOT remain on the restricted route
            assert current != route, \
                f"Role '{role}' should NOT access {route} but current URL is {current}"

    # ── Unauthenticated user should always redirect to /login ────────
    def test_unauthenticated_redirects_to_login(self, user_driver):
        """Without any auth, navigating to protected routes should redirect to /login."""
        page = LoginPage(user_driver, BASE_URL)
        page.clear_auth()

        protected_samples = ["/dashboard", "/assets", "/technician/dashboard", "/settings"]
        for route in protected_samples:
            user_driver.get(f"{BASE_URL}{route}")
            time.sleep(2)
            assert "/login" in user_driver.current_url, \
                f"Unauthenticated user should be redirected to /login from {route}"

    # ── Owner should access all admin routes ─────────────────────────
    def test_owner_can_access_admin_routes(self, user_driver):
        self._login_as(user_driver, "owner")

        admin_routes = ["/dashboard", "/assets", "/users", "/departments", "/tickets"]
        for route in admin_routes:
            user_driver.get(f"{BASE_URL}{route}")
            time.sleep(2)
            current = user_driver.current_url.replace(BASE_URL, "")
            assert "/login" not in current, \
                f"Owner should access {route} but was redirected to {current}"

    # ── Technician should access tech portal routes ──────────────────
    def test_technician_can_access_tech_portal(self, user_driver):
        self._login_as(user_driver, "technician")

        tech_routes = ["/technician/dashboard", "/technician/tickets", "/technician/performance"]
        for route in tech_routes:
            user_driver.get(f"{BASE_URL}{route}")
            time.sleep(2)
            current = user_driver.current_url.replace(BASE_URL, "")
            assert "/login" not in current, \
                f"Technician should access {route} but was redirected to {current}"
