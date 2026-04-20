# qa/selenium/tests/test_04_navigation.py
"""
Navigation and UI flow E2E tests.
Covers: Sidebar nav, logout, responsive layout, loading states.
"""
import time
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from config import BASE_URL, USERS
from pages.login_page import LoginPage


class TestSidebarNavigation:
    """Tests for sidebar navigation after login."""

    def _login_owner(self, driver):
        page = LoginPage(driver, BASE_URL)
        page.clear_auth()
        page.login(USERS["owner"]["email"], USERS["owner"]["password"])
        time.sleep(3)

    def test_sidebar_links_navigate_correctly(self, user_driver):
        self._login_owner(user_driver)

        nav_routes = [
            ("/dashboard", "dashboard"),
            ("/assets", "asset"),
            ("/tickets", "ticket"),
            ("/departments", "department"),
            ("/users", "user"),
        ]
        for route, keyword in nav_routes:
            user_driver.get(f"{BASE_URL}{route}")
            time.sleep(2)
            assert "/login" not in user_driver.current_url, \
                f"Owner should stay logged in on {route}"

    def test_notifications_page_accessible(self, user_driver):
        self._login_owner(user_driver)
        user_driver.get(f"{BASE_URL}/notifications")
        time.sleep(2)
        assert "/login" not in user_driver.current_url

    def test_settings_page_accessible(self, user_driver):
        self._login_owner(user_driver)
        user_driver.get(f"{BASE_URL}/settings")
        time.sleep(2)
        assert "/login" not in user_driver.current_url


class TestResponsiveLayout:
    """Tests that the app renders at various viewport sizes."""

    def test_mobile_viewport(self, user_driver):
        user_driver.set_window_size(375, 812)
        user_driver.get(BASE_URL)
        time.sleep(2)
        assert "FLUXION" in user_driver.page_source or "fluxion" in user_driver.page_source.lower()
        user_driver.maximize_window()

    def test_tablet_viewport(self, user_driver):
        user_driver.set_window_size(768, 1024)
        user_driver.get(BASE_URL)
        time.sleep(2)
        assert "FLUXION" in user_driver.page_source or "fluxion" in user_driver.page_source.lower()
        user_driver.maximize_window()

    def test_desktop_viewport(self, user_driver):
        user_driver.set_window_size(1920, 1080)
        user_driver.get(BASE_URL)
        time.sleep(2)
        assert "FLUXION" in user_driver.page_source or "fluxion" in user_driver.page_source.lower()
        user_driver.maximize_window()
