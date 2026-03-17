namespace Fluxion.AdminDash.SeleniumTests;

public static class AdminSeleniumSettings
{
    public static string BaseUrl =>
        (Environment.GetEnvironmentVariable("ADMIN_DASH_BASE_URL") ?? "http://localhost:5174").TrimEnd('/');

    public static string LoginEmail =>
        Environment.GetEnvironmentVariable("ADMIN_DASH_LOGIN_EMAIL") ?? "admin@fluxion.com";

    public static string LoginPassword =>
        Environment.GetEnvironmentVariable("ADMIN_DASH_LOGIN_PASSWORD") ?? "Admin-123";

    public static bool Headless =>
        string.Equals(Environment.GetEnvironmentVariable("SELENIUM_HEADLESS") ?? "true", "true", StringComparison.OrdinalIgnoreCase);

    public static TimeSpan DefaultTimeout => TimeSpan.FromSeconds(25);
}
