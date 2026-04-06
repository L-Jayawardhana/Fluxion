import os
import unittest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select


class RaiseTicketSeleniumTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        email = os.getenv("SELENIUM_USER_EMAIL")
        password = os.getenv("SELENIUM_USER_PASSWORD")

        if not email or not password:
            raise RuntimeError("Set SELENIUM_USER_EMAIL and SELENIUM_USER_PASSWORD before running this test.")

        cls.email = email
        cls.password = password
        cls.base_url = os.getenv("SELENIUM_BASE_URL", "http://localhost:5173").rstrip("/")
        cls.screenshot_dir = "tests/selenium_tests/screenshots"
        
        # Explicitly configure Chrome to run cleanly
        options = webdriver.ChromeOptions()
        if os.getenv("SELENIUM_HEADLESS", "false").lower() == "true":
            options.add_argument("--headless=new")
        options.add_argument("--window-size=1920,1080")
        options.add_argument("--disable-gpu")
        
        # Rely natively on standard Selenium 4 behavior (no webdriver-manager needed)
        cls.driver = webdriver.Chrome(options=options)
        cls.driver.implicitly_wait(10)
        cls.wait = WebDriverWait(cls.driver, 20)
        
        os.makedirs(cls.screenshot_dir, exist_ok=True)

    def take_screenshot(self, file_name):
        self.driver.save_screenshot(f"{self.screenshot_dir}/{file_name}")

    def wait_for_splash_to_disappear(self):
        self.wait.until(EC.invisibility_of_element_located((By.ID, "splash-screen")))

    def test_raise_ticket_with_screenshots(self):
        try:
            self.login()
            self.navigate_to_raise_ticket()
            self.fill_and_submit_ticket()
            self.verify_success()
        except Exception as e:
            self.take_screenshot("99_failure.png")
            raise e

    def login(self):
        self.driver.get(f"{self.base_url}/login")
        self.wait_for_splash_to_disappear()
        self.take_screenshot("01_login_page.png")
        
        email_input = self.wait.until(EC.element_to_be_clickable((By.ID, "login-email")))
        email_input.clear()
        email_input.send_keys(self.email)

        password_input = self.driver.find_element(By.ID, "login-password")
        password_input.clear()
        password_input.send_keys(self.password)

        self.driver.find_element(By.CSS_SELECTOR, ".btn-submit").click()
        
        # Wait until we leave login route.
        self.wait.until(lambda d: "/login" not in d.current_url)
        self.wait_for_splash_to_disappear()
        self.take_screenshot("02_after_login.png")

    def navigate_to_raise_ticket(self):
        self.driver.get(f"{self.base_url}/raise-ticket")
        
        self.wait_for_splash_to_disappear()
        self.wait.until(EC.presence_of_element_located((By.ID, "rt-asset")))
        self.take_screenshot("03_raise_ticket_loaded.png")

    def fill_and_submit_ticket(self):
        asset_select_elem = self.wait.until(EC.presence_of_element_located((By.ID, "rt-asset")))

        # Wait until options populate from API (length > 1 because first is placeholder).
        self.wait.until(lambda _: len(Select(asset_select_elem).options) > 1)
        asset_select = Select(asset_select_elem)

        if len(asset_select.options) <= 1:
            raise AssertionError("No eligible assets found for the logged-in employee.")
        
        # Select the first available actual asset
        asset_select.select_by_index(1)
        
        self.driver.find_element(By.ID, "rt-title").send_keys("Test Issue from Selenium QA")
        self.driver.find_element(By.ID, "rt-desc").send_keys("This is an automated test verifying the Maintenance component successfully binds form payload data.")
        
        self.take_screenshot("04_form_filled.png")
        
        # Submit
        submit_btn = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit'].rt-btn-primary")
        submit_btn.click()

    def verify_success(self):
        # Look for the Success Ring or "Report Another Issue" button
        self.wait.until(EC.presence_of_element_located((By.CLASS_NAME, "rt-success-ring")))
        self.take_screenshot("05_ticket_submitted_success.png")
        
        success_title = self.driver.find_element(By.CSS_SELECTOR, ".rt-empty-title")
        self.assertIn("Ticket Submitted!", success_title.text)

    @classmethod
    def tearDownClass(cls):
        cls.driver.quit()

if __name__ == "__main__":
    unittest.main()
