using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Support.UI;

namespace Fluxion.SeleniumTests;

public class RaiseTicketSeleniumTests
{
    [Fact]
    public void RaiseTicket_HappyPath_SubmitsSuccessfully()
    {
        var email = GetRequiredEnv("SELENIUM_USER_EMAIL");
        var password = GetRequiredEnv("SELENIUM_USER_PASSWORD");
        var baseUrl = GetEnvOrDefault("SELENIUM_BASE_URL", "http://localhost:5173").TrimEnd('/');
        var headless = GetEnvOrDefault("SELENIUM_HEADLESS", "false").Equals("true", StringComparison.OrdinalIgnoreCase);

        var repoRoot = FindRepoRoot();
        var screenshotDir = GetEnvOrDefault(
            "SELENIUM_SCREENSHOT_DIR",
            Path.Combine(repoRoot, "tests", "selenium_tests", "screenshots_csharp"));

        Directory.CreateDirectory(screenshotDir);

        var options = new ChromeOptions();
        if (headless)
        {
            options.AddArgument("--headless=new");
        }

        options.AddArgument("--window-size=1920,1080");
        options.AddArgument("--disable-gpu");

        using IWebDriver driver = new ChromeDriver(options);
        var wait = new WebDriverWait(driver, TimeSpan.FromSeconds(20));
        driver.Manage().Timeouts().ImplicitWait = TimeSpan.FromSeconds(10);

        try
        {
            Login(driver, wait, baseUrl, email, password, screenshotDir);
            NavigateToRaiseTicket(driver, wait, baseUrl, screenshotDir);
            FillAndSubmitTicket(driver, wait, screenshotDir);
            VerifySuccess(driver, wait, screenshotDir);
        }
        catch
        {
            TakeScreenshot(driver, screenshotDir, "99_failure.png");
            throw;
        }
    }

    private static void Login(IWebDriver driver, WebDriverWait wait, string baseUrl, string email, string password, string screenshotDir)
    {
        driver.Navigate().GoToUrl($"{baseUrl}/login");
        WaitForSplashToDisappear(driver, wait);
        TakeScreenshot(driver, screenshotDir, "01_login_page.png");

        var emailInput = wait.Until(d =>
        {
            var element = d.FindElement(By.Id("login-email"));
            return element.Displayed && element.Enabled ? element : null;
        })!;

        emailInput.Clear();
        emailInput.SendKeys(email);

        var passwordInput = driver.FindElement(By.Id("login-password"));
        passwordInput.Clear();
        passwordInput.SendKeys(password);

        driver.FindElement(By.CssSelector(".btn-submit")).Click();

        wait.Until(d => !d.Url.Contains("/login", StringComparison.OrdinalIgnoreCase));
        WaitForSplashToDisappear(driver, wait);
        TakeScreenshot(driver, screenshotDir, "02_after_login.png");
    }

    private static void NavigateToRaiseTicket(IWebDriver driver, WebDriverWait wait, string baseUrl, string screenshotDir)
    {
        driver.Navigate().GoToUrl($"{baseUrl}/raise-ticket");

        WaitForSplashToDisappear(driver, wait);
        wait.Until(d => d.FindElement(By.Id("rt-asset")).Displayed);
        TakeScreenshot(driver, screenshotDir, "03_raise_ticket_loaded.png");
    }

    private static void FillAndSubmitTicket(IWebDriver driver, WebDriverWait wait, string screenshotDir)
    {
        var assetSelectElement = wait.Until(d => d.FindElement(By.Id("rt-asset")));

        wait.Until(_ =>
        {
            var select = new SelectElement(assetSelectElement);
            return select.Options.Count > 1;
        });

        var assetSelect = new SelectElement(assetSelectElement);
        if (assetSelect.Options.Count <= 1)
        {
            throw new InvalidOperationException("No eligible assets found for the logged-in employee.");
        }

        assetSelect.SelectByIndex(1);

        driver.FindElement(By.Id("rt-title")).SendKeys("Test Issue from Selenium C#");
        driver.FindElement(By.Id("rt-desc")).SendKeys("This is an automated C# Selenium test verifying raise ticket submit flow.");

        TakeScreenshot(driver, screenshotDir, "04_form_filled.png");

        driver.FindElement(By.CssSelector("button[type='submit'].rt-btn-primary")).Click();
    }

    private static void VerifySuccess(IWebDriver driver, WebDriverWait wait, string screenshotDir)
    {
        wait.Until(d => d.FindElement(By.ClassName("rt-success-ring")).Displayed);
        TakeScreenshot(driver, screenshotDir, "05_ticket_submitted_success.png");

        var successTitle = driver.FindElement(By.CssSelector(".rt-empty-title")).Text;
        Assert.Contains("Ticket Submitted!", successTitle);
    }

    private static void WaitForSplashToDisappear(IWebDriver driver, WebDriverWait wait)
    {
        wait.Until(_ =>
        {
            try
            {
                var splash = driver.FindElement(By.Id("splash-screen"));
                return !splash.Displayed;
            }
            catch (NoSuchElementException)
            {
                return true;
            }
            catch (StaleElementReferenceException)
            {
                return true;
            }
        });
    }

    private static void TakeScreenshot(IWebDriver driver, string screenshotDir, string fileName)
    {
        if (driver is ITakesScreenshot takesScreenshot)
        {
            var screenshot = takesScreenshot.GetScreenshot();
            var fullPath = Path.Combine(screenshotDir, fileName);
            screenshot.SaveAsFile(fullPath);
        }
    }

    private static string GetRequiredEnv(string key)
    {
        var value = Environment.GetEnvironmentVariable(key);
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException($"Set environment variable '{key}' before running Selenium tests.");
        }

        return value;
    }

    private static string GetEnvOrDefault(string key, string fallback)
        => Environment.GetEnvironmentVariable(key) ?? fallback;

    private static string FindRepoRoot()
    {
        var current = new DirectoryInfo(AppContext.BaseDirectory);
        while (current is not null)
        {
            if (Directory.Exists(Path.Combine(current.FullName, "scripts")) &&
                Directory.Exists(Path.Combine(current.FullName, "tests")))
            {
                return current.FullName;
            }

            current = current.Parent;
        }

        return Directory.GetCurrentDirectory();
    }
}
