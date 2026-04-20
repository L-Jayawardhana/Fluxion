# qa/selenium/pages/base_page.py
"""
Base Page Object — shared helpers for all page objects.
"""
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


class BasePage:
    """Common browser actions inherited by every page object."""

    def __init__(self, driver):
        self.driver = driver
        self.wait = WebDriverWait(driver, 10)

    def open(self, url):
        self.driver.get(url)

    def find(self, locator):
        return self.wait.until(EC.presence_of_element_located(locator))

    def find_all(self, locator):
        return self.wait.until(EC.presence_of_all_elements_located(locator))

    def click(self, locator):
        el = self.wait.until(EC.element_to_be_clickable(locator))
        try:
            # Scroll to center to avoid floating headers/footers intercepting
            self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", el)
            import time; time.sleep(0.5)  # Wait for any scrolling/animations
            el.click()
        except Exception:
            # Fallback to Javascript click if intercepted by overlay/toast
            self.driver.execute_script("arguments[0].click();", el)

    def type_text(self, locator, text):
        el = self.find(locator)
        el.clear()
        el.send_keys(text)

    def get_text(self, locator):
        return self.find(locator).text

    @property
    def current_url(self):
        return self.driver.current_url

    @property
    def page_source(self):
        return self.driver.page_source

    def clear_auth(self):
        """Clear all auth tokens from browser storage."""
        self.driver.execute_script("localStorage.clear(); sessionStorage.clear();")
        self.driver.delete_all_cookies()
