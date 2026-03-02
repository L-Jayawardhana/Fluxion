package com.fluxion.smoke.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

/**
 * Page Object for the Register page at /register (multi-step wizard).
 * Smoke tests only validate that the page loads and Step 1 renders.
 */
public class RegisterPage {

    private final WebDriver driver;
    private final WebDriverWait wait;

    // ── Step 1 Selectors ─────────────────────────────────────────────
    private static final By FIRST_NAME_INPUT = By.cssSelector("input[name='firstName']");
    private static final By LAST_NAME_INPUT  = By.cssSelector("input[name='lastName']");
    private static final By EMAIL_INPUT      = By.cssSelector("input[name='email']");
    private static final By PASSWORD_INPUT   = By.cssSelector("input[name='password']");
    private static final By CONTINUE_BUTTON  = By.cssSelector("button.register-continue-btn");
    private static final By SPLASH_SCREEN    = By.cssSelector("#splash-screen");

    public RegisterPage(WebDriver driver, int waitSeconds) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(waitSeconds));
    }

    public RegisterPage navigateTo(String baseUrl) {
        driver.navigate().to(baseUrl.replaceAll("/$", "") + "/register");
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
        
        // Wait for the form elements to be visible
        wait.until(ExpectedConditions.visibilityOfElementLocated(FIRST_NAME_INPUT));
    }

    public boolean isOnRegisterPage() {
        try {
            wait.until(d -> d.getCurrentUrl().contains("/register"));
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isPageLoaded() {
        try {
            wait.until(ExpectedConditions.visibilityOfElementLocated(FIRST_NAME_INPUT));
            wait.until(ExpectedConditions.visibilityOfElementLocated(EMAIL_INPUT));
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public RegisterPage fillStep1(String firstName, String lastName, String email, String password) {
        driver.findElement(FIRST_NAME_INPUT).sendKeys(firstName);
        driver.findElement(LAST_NAME_INPUT).sendKeys(lastName);
        driver.findElement(EMAIL_INPUT).sendKeys(email);
        driver.findElement(PASSWORD_INPUT).sendKeys(password);
        return this;
    }

    public void clickContinue() {
        wait.until(ExpectedConditions.elementToBeClickable(CONTINUE_BUTTON)).click();
    }
}
