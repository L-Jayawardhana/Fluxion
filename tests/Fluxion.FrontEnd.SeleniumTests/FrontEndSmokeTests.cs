using OpenQA.Selenium;
using System.Linq;
using Xunit;
using Xunit.Abstractions;

namespace Fluxion.FrontEnd.SeleniumTests;

[Collection("Selenium")]
public sealed class FrontEndSmokeTests
{
    private readonly SeleniumFixture _fixture;
    private readonly ITestOutputHelper _output;

    public FrontEndSmokeTests(SeleniumFixture fixture, ITestOutputHelper output)
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
    public void LandingPageHasTitle()
    {
        RunTest(nameof(LandingPageHasTitle), () =>
        {
            LogStep("Open landing page");
            _fixture.GoTo("/");
            LogStep($"Title: {_fixture.Driver.Title}");
            Assert.Contains("FLUXION", _fixture.Driver.Title, StringComparison.OrdinalIgnoreCase);
        });
    }

    [Fact]
    public void LandingPageGetStartedNavigatesToRegister()
    {
        RunTest(nameof(LandingPageGetStartedNavigatesToRegister), () =>
        {
            LogStep("Open landing page");
            _fixture.GoTo("/");

            LogStep("Click Get started");
            var getStarted = _fixture.Wait.Until(driver =>
                driver.FindElement(By.CssSelector("a.btn-large")));

            getStarted.Click();

            _fixture.Wait.Until(driver => driver.Url.Contains("/register", StringComparison.OrdinalIgnoreCase));
            LogStep($"Navigated to: {_fixture.Driver.Url}");
            Assert.Contains("/register", _fixture.Driver.Url, StringComparison.OrdinalIgnoreCase);
        });
    }

    [Fact]
    public void LoginPageHasEmailInput()
    {
        RunTest(nameof(LoginPageHasEmailInput), () =>
        {
            LogStep("Open login page");
            _fixture.EnsureLoggedOut();
            _fixture.GoTo("/login");

            var emailInput = _fixture.Wait.Until(driver =>
                driver.FindElement(By.Id("login-email")));

            LogStep("Login email input located");
            Assert.True(emailInput.Displayed);
        });
    }

    [Fact]
    public void NotFoundPageShows404()
    {
        RunTest(nameof(NotFoundPageShows404), () =>
        {
            LogStep("Open invalid route");
            _fixture.GoTo("/does-not-exist");

            var heading = _fixture.Wait.Until(driver =>
                driver.FindElement(By.CssSelector(".not-found-page h1")));

            LogStep($"404 heading text: {heading.Text.Trim()}");
            Assert.Equal("404", heading.Text.Trim());
        });
    }

    [Fact]
    public void LoginDashboardDepartmentsAddDepartmentFlow()
    {
        RunTest(nameof(LoginDashboardDepartmentsAddDepartmentFlow), () =>
        {
            LogStep("Ensure authenticated session");
            _fixture.EnsureLoggedIn();
            LogStep($"Authenticated at: {_fixture.Driver.Url}");

            LogStep("Navigate to Dashboard");
            _fixture.NavigateSidebar("Dashboard", "/dashboard");
            _fixture.WaitUntilVisible(By.CssSelector(".db-greeting"));
            LogStep("Dashboard loaded");

            LogStep("Navigate to Departments");
            _fixture.NavigateSidebar("All Departments", "/departments");
            var departmentsTitle = _fixture.WaitUntilVisible(By.CssSelector(".dp-title"));
            LogStep($"Departments title: {departmentsTitle.Text.Trim()}");
            Assert.Equal("Departments", departmentsTitle.Text.Trim());

            LogStep("Navigate to Add Department");
            _fixture.NavigateSidebar("Add Department", "/add-department");
            var nameInput = _fixture.WaitUntilVisible(By.Id("dept-name"));
            var descInput = _fixture.Driver.FindElement(By.Id("dept-desc"));

            var uniqueName = $"Selenium Dept {DateTime.UtcNow:yyyyMMddHHmmss}";
            LogStep($"Create department: {uniqueName}");
            nameInput.Clear();
            nameInput.SendKeys(uniqueName);
            descInput.Clear();
            descInput.SendKeys("Created by Selenium automation.");

            var submitButton = _fixture.Driver.FindElement(By.CssSelector("button.adp-btn-submit"));
            submitButton.Click();

            _fixture.Wait.Until(driver => driver.FindElements(By.CssSelector(".adp-msg-success")).Any(el => el.Displayed));
            _fixture.WaitForUrlContains("/departments");
            LogStep("Department created and redirected to Departments");
        });
    }

    [Fact]
    public void DepartmentsCanDeactivateAndActivate()
    {
        RunTest(nameof(DepartmentsCanDeactivateAndActivate), () =>
        {
            LogStep("Ensure authenticated session");
            _fixture.EnsureLoggedIn();

            LogStep("Navigate to Departments");
            _fixture.NavigateSidebar("All Departments", "/departments");
            _fixture.WaitUntilVisible(By.CssSelector(".dp-title"));

            _fixture.Wait.Until(driver => driver.FindElements(By.CssSelector(".dp-table tbody tr")).Any());

            var rows = _fixture.Driver.FindElements(By.CssSelector(".dp-table tbody tr"));
            IWebElement? targetRow = null;
            bool willDeactivate = false;

            foreach (var row in rows)
            {
                if (row.FindElements(By.CssSelector("button[title='Deactivate']")).Any())
                {
                    targetRow = row;
                    willDeactivate = true;
                    break;
                }

                if (row.FindElements(By.CssSelector("button[title='Activate']")).Any())
                {
                    targetRow = row;
                    willDeactivate = false;
                    break;
                }
            }

            Assert.NotNull(targetRow);

            var deptName = targetRow!.FindElement(By.CssSelector(".dp-dept-name")).Text.Trim();
            var originalStatus = targetRow.FindElement(By.CssSelector(".dp-badge")).Text.Trim();
            LogStep($"Toggle department: {deptName} (current: {originalStatus})");

            var actionSelector = willDeactivate ? "button[title='Deactivate']" : "button[title='Activate']";
            targetRow.FindElement(By.CssSelector(actionSelector)).Click();

            _fixture.WaitUntilVisible(By.CssSelector(".dp-confirm-modal"));
            var confirmSelector = willDeactivate ? "button.dp-btn-danger" : "button.dp-btn-safe";
            _fixture.Driver.FindElement(By.CssSelector(confirmSelector)).Click();

            var expectedStatus = willDeactivate ? "Inactive" : "Active";
            var updatedRow = _fixture.Wait.Until(driver =>
            {
                var rowsByName = driver.FindElements(By.XPath(
                    $"//table[contains(@class,'dp-table')]//tr[.//div[contains(@class,'dp-dept-name')][normalize-space()='{deptName}']]"));
                return rowsByName.FirstOrDefault();
            });

            _fixture.Wait.Until(_ => updatedRow.FindElement(By.CssSelector(".dp-badge")).Text.Trim() == expectedStatus);

            LogStep("Revert department status");
            var revertActionSelector = willDeactivate ? "button[title='Activate']" : "button[title='Deactivate']";
            updatedRow.FindElement(By.CssSelector(revertActionSelector)).Click();

            _fixture.WaitUntilVisible(By.CssSelector(".dp-confirm-modal"));
            var revertConfirmSelector = willDeactivate ? "button.dp-btn-safe" : "button.dp-btn-danger";
            _fixture.Driver.FindElement(By.CssSelector(revertConfirmSelector)).Click();

            _fixture.Wait.Until(_ => updatedRow.FindElement(By.CssSelector(".dp-badge")).Text.Trim() == originalStatus);
        });
    }
}
