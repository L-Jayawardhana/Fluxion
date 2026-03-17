using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Support.UI;
using System.IO;
using WebDriverManager;
using WebDriverManager.DriverConfigs.Impl;
using Xunit;

namespace Fluxion.FrontEnd.SeleniumTests;

public sealed class SeleniumFixture : IAsyncLifetime, IDisposable
{
    public IWebDriver Driver { get; private set; } = null!;
    public WebDriverWait Wait { get; private set; } = null!;
    public string BaseUrl => SeleniumSettings.BaseUrl;

    public Task InitializeAsync()
    {
        new DriverManager().SetUpDriver(new ChromeConfig());

        var options = new ChromeOptions();
        options.AddArgument("--window-size=1280,800");
        options.AddArgument("--disable-dev-shm-usage");
        options.AddArgument("--no-sandbox");
        if (SeleniumSettings.Headless)
        {
            options.AddArgument("--headless=new");
        }

        Driver = new ChromeDriver(options);
        Driver.Manage().Timeouts().ImplicitWait = TimeSpan.Zero;

        Wait = new WebDriverWait(new SystemClock(), Driver, SeleniumSettings.DefaultTimeout, TimeSpan.FromMilliseconds(200));
        return Task.CompletedTask;
    }

    public Task DisposeAsync()
    {
        Dispose();
        return Task.CompletedTask;
    }

    public void Dispose()
    {
        try
        {
            Driver?.Quit();
            Driver?.Dispose();
        }
        catch (WebDriverException)
        {
            // Ignore cleanup failures when the browser is already closed.
        }
    }

    public void GoTo(string path)
    {
        var url = new Uri(new Uri(BaseUrl + "/"), path.TrimStart('/'));
        Driver.Navigate().GoToUrl(url);
        WaitForAppReady();
    }

    public void WaitForAppReady()
    {
        WaitForDocumentReady();
        Wait.Until(driver =>
        {
            try
            {
                var splash = driver.FindElements(By.Id("splash-screen")).FirstOrDefault();
                if (splash is not null && splash.Displayed)
                {
                    return false;
                }

                var overlays = driver.FindElements(By.CssSelector(".speed-overlay"));
                return overlays.All(overlay => !overlay.Displayed);
            }
            catch (StaleElementReferenceException)
            {
                // DOM updated between query and visibility checks; retry.
                return false;
            }
        });
    }

    public void EnsureLoggedIn()
    {
        GoTo("/dashboard");

        if (Driver.Url.Contains("/login", StringComparison.OrdinalIgnoreCase))
        {
            var emailInput = Wait.Until(driver => driver.FindElement(By.Id("login-email")));
            emailInput.Clear();
            emailInput.SendKeys(SeleniumSettings.LoginEmail);

            var passwordInput = Driver.FindElement(By.Id("login-password"));
            passwordInput.Clear();
            passwordInput.SendKeys(SeleniumSettings.LoginPassword);

            var submitButton = Driver.FindElement(By.CssSelector("button.btn-submit"));
            submitButton.Click();

            Wait.Until(driver =>
                driver.Url.Contains("/welcome", StringComparison.OrdinalIgnoreCase) ||
                driver.Url.Contains("/dashboard", StringComparison.OrdinalIgnoreCase));
        }

        Wait.Until(driver => driver.FindElements(By.CssSelector(".ml-sidebar")).Any(el => el.Displayed));
    }

    public void NavigateSidebar(string linkText, string expectedPath)
    {
        var link = Wait.Until(driver =>
            driver.FindElement(By.XPath($"//a[contains(@class,'ml-sb-link')][normalize-space()='{linkText}']")));

        link.Click();
        WaitForUrlContains(expectedPath);
        WaitForAppReady();
    }

    public void WaitForUrlContains(string path)
    {
        Wait.Until(driver => driver.Url.Contains(path, StringComparison.OrdinalIgnoreCase));
    }

    public string CaptureScreenshot(string testName, string status)
    {
        var screenshotDriver = Driver as ITakesScreenshot;
        if (screenshotDriver is null)
        {
            return string.Empty;
        }

        var safeName = SanitizeFileName(testName);
        var safeStatus = SanitizeFileName(status);
        var stamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmss");
        var folder = Path.Combine(AppContext.BaseDirectory, "TestResults", "screenshots");
        Directory.CreateDirectory(folder);

        var fileName = $"{safeName}_{safeStatus}_{stamp}.png";
        var path = Path.Combine(folder, fileName);
        screenshotDriver.GetScreenshot().SaveAsFile(path);
        return path;
    }

    private static string SanitizeFileName(string name)
    {
        var invalid = Path.GetInvalidFileNameChars();
        var buffer = new char[name.Length];
        for (var i = 0; i < name.Length; i++)
        {
            var ch = name[i];
            buffer[i] = invalid.Contains(ch) ? '_' : ch;
        }
        return new string(buffer);
    }

    public IWebElement WaitUntilVisible(By by)
    {
        return Wait.Until(driver =>
        {
            try
            {
                var element = driver.FindElement(by);
                return element.Displayed ? element : null;
            }
            catch (StaleElementReferenceException)
            {
                return null;
            }
            catch (NoSuchElementException)
            {
                return null;
            }
        })!;
    }

    private void WaitForDocumentReady()
    {
        Wait.Until(driver =>
        {
            var state = ((IJavaScriptExecutor)driver).ExecuteScript("return document.readyState");
            return string.Equals(state?.ToString(), "complete", StringComparison.OrdinalIgnoreCase);
        });
    }
}
