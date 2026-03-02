package com.fluxion.smoke.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;
import java.util.List;

/**
 * Page Object for the Login page at /login.
 */
public class LoginPage {

    private final WebDriver driver;
    private final WebDriverWait wait;

    // ── Selectors ────────────────────────────────────────────────────
    private static final By EMAIL_INPUT    = By.cssSelector("input[type='email']");
    private static final By PASSWORD_INPUT = By.cssSelector("input[type='password']");
    private static final By SUBMIT_BUTTON  = By.cssSelector("button[type='submit']");
    private static final By ERROR_BANNER   = By.cssSelector(".login-error, [class*='error']");
    private static final By SPLASH_SCREEN  = By.cssSelector("#splash-screen");

    public LoginPage(WebDriver driver, int waitSeconds) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(waitSeconds));
    }

    public LoginPage navigateTo(String baseUrl) {
        driver.navigate().to(baseUrl.replaceAll("/$", "") + "/login");
        waitForPageToLoad();
        return this;
    }

    private void waitForPageToLoad() {
        // Wait for splash screen to disappear if present
        try {
            wait.until(ExpectedConditions.invisibilityOfElementLocated(SPLASH_SCREEN));
        } catch (Exception e) {
            // Splash screen might not be present, continue
        }
        
        // Wait for the email input to be visible and clickable
        wait.until(ExpectedConditions.visibilityOfElementLocated(EMAIL_INPUT));
        wait.until(ExpectedConditions.elementToBeClickable(SUBMIT_BUTTON));
    }

    public LoginPage enterEmail(String email) {
        WebElement el = driver.findElement(EMAIL_INPUT);
        el.clear();
        el.sendKeys(email);
        return this;
    }

    public LoginPage enterPassword(String password) {
        WebElement el = driver.findElement(PASSWORD_INPUT);
        el.clear();
        el.sendKeys(password);
        return this;
    }

    public LoginPage clickSignIn() {
        // Ensure the button is clickable before attempting to click
        wait.until(ExpectedConditions.elementToBeClickable(SUBMIT_BUTTON));
        driver.findElement(SUBMIT_BUTTON).click();
        return this;
    }

    public LoginPage login(String email, String password) {
        enterEmail(email);
        enterPassword(password);
        clickSignIn();
        return this;
    }

    public boolean isOnLoginPage() {
        try {
            wait.until(d -> d.getCurrentUrl().contains("/login"));
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isPageLoaded() {
        try {
            wait.until(ExpectedConditions.visibilityOfElementLocated(EMAIL_INPUT));
            wait.until(ExpectedConditions.visibilityOfElementLocated(SUBMIT_BUTTON));
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isErrorDisplayed() {
        try {
            wait.until(d -> {
                List<WebElement> els = d.findElements(ERROR_BANNER);
                return els.stream().anyMatch(e -> e.isDisplayed() && !e.getText().isBlank());
            });
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public String getPageTitle() {
        return driver.getTitle();
    }
}
