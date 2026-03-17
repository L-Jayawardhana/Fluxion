namespace Fluxion.FrontEnd.SeleniumTests;

public static class SeleniumSettings
{
    public static string BaseUrl =>
        (Environment.GetEnvironmentVariable("FRONTEND_BASE_URL") ?? "http://localhost:5173").TrimEnd('/');

    public static string LoginEmail =>
        Environment.GetEnvironmentVariable("FRONTEND_LOGIN_EMAIL") ?? "jayarumanilka@gmail.com";

    public static string LoginPassword =>
        Environment.GetEnvironmentVariable("FRONTEND_LOGIN_PASSWORD") ?? "Jayaru#12345";

    public static bool Headless =>
        string.Equals(Environment.GetEnvironmentVariable("SELENIUM_HEADLESS") ?? "true", "true", StringComparison.OrdinalIgnoreCase);

    public static TimeSpan DefaultTimeout => TimeSpan.FromSeconds(15);
}
