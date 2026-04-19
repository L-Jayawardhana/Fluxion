# qa/selenium/tests/test_01_public_pages.py
"""
Smoke tests for public (unauthenticated) pages.
Covers: Landing page, 404 page.
"""
import pytest
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from config import BASE_URL


class TestLandingPage:
    """Tests for the public landing page (/)."""

    def test_landing_page_loads(self, user_driver):
        user_driver.get(BASE_URL)
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC
        from selenium.webdriver.common.by import By
        WebDriverWait(user_driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, "body")))
        assert "FLUXION" in user_driver.page_source or "fluxion" in user_driver.page_source.lower()

    def test_hero_section_visible(self, user_driver):
        user_driver.get(BASE_URL)
        import time; time.sleep(2) # Wait for React hydration
        assert "Every asset" in user_driver.page_source
        assert "Under control" in user_driver.page_source

    def test_pricing_section_exists(self, user_driver):
        user_driver.get(BASE_URL)
        import time; time.sleep(2)
        assert "Free" in user_driver.page_source
        assert "Pro" in user_driver.page_source
        assert "Enterprise" in user_driver.page_source

    def test_get_started_link_points_to_register(self, user_driver):
        user_driver.get(BASE_URL)
        links = user_driver.find_elements("css selector", "a[href='/register']")
        assert len(links) > 0, "Expected at least one link to /register"


class TestNotFoundPage:
    """Tests for the 404 fallback page."""

    def test_invalid_url_shows_404(self, user_driver):
        user_driver.get(f"{BASE_URL}/this-page-does-not-exist-12345")
        page_text = user_driver.page_source.lower()
        assert "404" in page_text or "not found" in page_text
