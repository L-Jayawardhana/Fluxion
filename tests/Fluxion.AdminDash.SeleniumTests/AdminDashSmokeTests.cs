using OpenQA.Selenium;
using Xunit;
using Xunit.Abstractions;

namespace Fluxion.AdminDash.SeleniumTests;

[Collection("AdminSelenium")]
public sealed class AdminDashSmokeTests
{
    private readonly AdminSeleniumFixture _fixture;
    private readonly ITestOutputHelper _output;

    public AdminDashSmokeTests(AdminSeleniumFixture fixture, ITestOutputHelper output)
    {
        _fixture = fixture;
        _output = output;
    }

    private void LogStep(string message)
    {
        _output.WriteLine($"[{DateTime.UtcNow:HH:mm:ss}] {message}");
    }

    private void RunTest(string testName, Action action)
    {
        LogStep($"START: {testName}");
        var status = "PASSED";
        try
        {
            action();
        }
        catch (Exception ex)
        {
            status = "FAILED";
            LogStep($"ERROR: {ex.GetType().Name} - {ex.Message}");
            throw;
        }
        finally
        {
            var screenshotPath = _fixture.CaptureScreenshot(testName, status);
            if (!string.IsNullOrWhiteSpace(screenshotPath))
            {
                LogStep($"SCREENSHOT: {screenshotPath}");
            }
            LogStep($"RESULT: {testName} => {status}");
        }
    }

    [Fact]
    public void AdminLoginDashboardDepartmentsFlow()
    {
        RunTest(nameof(AdminLoginDashboardDepartmentsFlow), () =>
        {
            LogStep("Ensure authenticated session");
            _fixture.EnsureLoggedIn();
            LogStep($"Authenticated at: {_fixture.Driver.Url}");

            LogStep("Validate dashboard stats strip");
            _fixture.WaitUntilVisible(By.CssSelector(".stats-strip"));

            LogStep("Navigate to Departments");
            _fixture.NavigateSidebar("Departments", "/departments");
            _fixture.WaitUntilVisible(By.XPath("//h1[normalize-space()='Departments']"));
            _fixture.WaitUntilVisible(By.Id("dept-org-select"));

            LogStep("Open create department modal");
            _fixture.WaitUntilEnabled(By.Id("dept-create-btn")).Click();
            _fixture.WaitUntilVisible(By.Id("create-dept-name"));

            var uniqueName = $"Admin Selenium Dept {DateTime.UtcNow:yyyyMMddHHmmss}";
            LogStep($"Create department: {uniqueName}");
            _fixture.Driver.FindElement(By.Id("create-dept-name")).SendKeys(uniqueName);
            _fixture.Driver.FindElement(By.Id("create-dept-desc")).SendKeys("Created by admin Selenium automation.");

            _fixture.Driver.FindElement(By.CssSelector("button.mok")).Click();

            _fixture.Wait.Until(driver =>
                driver.FindElements(By.CssSelector(".overlay.open")).Count == 0);

            _fixture.Wait.Until(driver =>
                driver.FindElements(By.XPath($"//td[normalize-space()='{uniqueName}']")).Any());
        });
    }

    [Fact]
    public void AdminUsersPageLoads()
    {
        RunTest(nameof(AdminUsersPageLoads), () =>
        {
            _fixture.EnsureLoggedIn();

            LogStep("Navigate to Users");
            _fixture.NavigateSidebar("Users", "/users");

            _fixture.WaitUntilVisible(By.XPath("//input[contains(@placeholder,'Search name')]"));
        });
    }

    [Fact]
    public void AdminUsersContainsJayaruUser()
    {
        RunTest(nameof(AdminUsersContainsJayaruUser), () =>
        {
            _fixture.EnsureLoggedIn();

            LogStep("Navigate to Users");
            _fixture.NavigateSidebar("Users", "/users");

            var searchInput = _fixture.WaitUntilVisible(By.XPath("//input[contains(@placeholder,'Search name')]"));
            searchInput.Clear();
            searchInput.SendKeys("jayarumanilka@gmail.com");

            LogStep("Check for Jayaru manilka user in table");
            _fixture.Wait.Until(driver =>
                driver.FindElements(By.XPath("//table//tr[.//td[contains(translate(normalize-space(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'jayarumanilka@gmail.com')] or .//td[contains(translate(normalize-space(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'jayaru manilka')]]"))
                      .Any());
        });
    }

    [Fact]
    public void AdminDepartmentsContainsWso2()
    {
        RunTest(nameof(AdminDepartmentsContainsWso2), () =>
        {
            _fixture.EnsureLoggedIn();

            LogStep("Navigate to Departments");
            _fixture.NavigateSidebar("Departments", "/departments");
            _fixture.WaitUntilVisible(By.Id("dept-org-select"));

            LogStep("Check for Wso2 department");
            _fixture.Wait.Until(driver =>
                driver.FindElements(By.XPath("//td[contains(translate(normalize-space(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'wso2')]"))
                      .Any());
        });
    }
}
