using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Support.UI;
using System.IO;
using WebDriverManager;
using WebDriverManager.DriverConfigs.Impl;
using Xunit;

namespace Fluxion.AdminDash.SeleniumTests;

public sealed class AdminSeleniumFixture : IAsyncLifetime, IDisposable
{
    public IWebDriver Driver { get; private set; } = null!;
    public WebDriverWait Wait { get; private set; } = null!;
    public string BaseUrl => AdminSeleniumSettings.BaseUrl;

    public Task InitializeAsync()
    {
        new DriverManager().SetUpDriver(new ChromeConfig());

        var options = new ChromeOptions();
        options.AddArgument("--window-size=1280,800");
        options.AddArgument("--disable-dev-shm-usage");
        options.AddArgument("--no-sandbox");
        if (AdminSeleniumSettings.Headless)
        {
            options.AddArgument("--headless=new");
        }

        Driver = new ChromeDriver(options);
        Driver.Manage().Timeouts().ImplicitWait = TimeSpan.Zero;

        Wait = new WebDriverWait(new SystemClock(), Driver, AdminSeleniumSettings.DefaultTimeout, TimeSpan.FromMilliseconds(200));
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
        WaitForDocumentReady();
    }

    public void EnsureLoggedIn()
    {
        GoTo("/");

        if (Driver.Url.Contains("/login", StringComparison.OrdinalIgnoreCase))
        {
            var emailInput = WaitUntilVisible(By.Id("login-email"));
            emailInput.Clear();
            emailInput.SendKeys(AdminSeleniumSettings.LoginEmail);

            var passwordInput = Driver.FindElement(By.Id("login-password"));
            passwordInput.Clear();
            passwordInput.SendKeys(AdminSeleniumSettings.LoginPassword);

            var submitButton = Driver.FindElement(By.CssSelector("button.btn-submit"));
            submitButton.Click();

            Wait.Until(driver => driver.FindElements(By.CssSelector(".sidebar")).Any(el => el.Displayed));
        }

        Wait.Until(driver => driver.FindElements(By.CssSelector(".sidebar")).Any(el => el.Displayed));
    }

    public void NavigateSidebar(string linkText, string expectedPath)
    {
        var link = WaitUntilVisible(By.XPath($"//a[contains(@class,'sb-item')][contains(normalize-space(),'{linkText}')]"));
        link.Click();
        WaitForUrlContains(expectedPath);
        WaitForDocumentReady();
    }

    public void WaitForUrlContains(string path)
    {
        Wait.Until(driver => driver.Url.Contains(path, StringComparison.OrdinalIgnoreCase));
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

    public IWebElement WaitUntilEnabled(By by)
    {
        return Wait.Until(driver =>
        {
            try
            {
                var element = driver.FindElement(by);
                return element.Displayed && element.Enabled ? element : null;
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

    private void WaitForDocumentReady()
    {
        Wait.Until(driver =>
        {
            var state = ((IJavaScriptExecutor)driver).ExecuteScript("return document.readyState");
            return string.Equals(state?.ToString(), "complete", StringComparison.OrdinalIgnoreCase);
        });
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
}
