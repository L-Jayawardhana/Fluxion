using Fluxion.Application.Interfaces;
using Fluxion.Infrastructure.Services;
using Fluxion.Persistence.Context;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Fluxion.IntegrationTests;

/// <summary>
/// Replaces MySQL with an in-memory DB and configures a deterministic JWT secret
/// so that integration tests can run without Docker or external services.
/// </summary>
public class FluxionWebApplicationFactory : WebApplicationFactory<Program>
{
    internal const string TestSecretKey = "IntegrationTestSecretKeyThatIs256BitsLong!!!!";
    internal const string TestIssuer = "FluxionTest";
    internal const string TestAudience = "FluxionTestUsers";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // ── Inject JWT settings via environment variables ────────────
        // In the minimal hosting model, WebApplicationFactory's
        // ConfigureAppConfiguration and PostConfigure run too late:
        // Program.cs reads JwtSettings directly from builder.Configuration
        // and the AddJwtBearer Configure lambda throws before PostConfigure.
        // Environment variables with __ separator are the only source
        // available BEFORE Program.cs executes.
        Environment.SetEnvironmentVariable("JwtSettings__SecretKey", TestSecretKey);
        Environment.SetEnvironmentVariable("JwtSettings__Issuer", TestIssuer);
        Environment.SetEnvironmentVariable("JwtSettings__Audience", TestAudience);
        Environment.SetEnvironmentVariable("JwtSettings__ExpiryMinutes", "5");

        // ── Fix 1: CORS ──────────────────────────────────────────────
        // The "Testing" environment is NOT IsDevelopment(), so Program.cs
        // falls into the production CORS branch and throws when no origins
        // are configured. Inject dummy test origins to satisfy the check.
        Environment.SetEnvironmentVariable("AllowedOrigins__0", "http://localhost:3000");
        Environment.SetEnvironmentVariable("AllowedOrigins__1", "http://localhost:5173");

        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            // ── Remove ALL real MySQL DbContext registrations ────────────
            // AddDbContext uses TryAddScoped for the context itself, so we
            // must remove the FluxionDbContext registration too, otherwise
            // the InMemory override won't take effect.
            var descriptorsToRemove = services.Where(d =>
                d.ServiceType == typeof(DbContextOptions<FluxionDbContext>) ||
                d.ServiceType == typeof(FluxionDbContext) ||
                d.ServiceType == typeof(IApplicationDbContext)).ToList();
            foreach (var d in descriptorsToRemove) services.Remove(d);

            // ── Register in-memory DB ───────────────────────────────────
            services.AddDbContext<FluxionDbContext>(options =>
                options.UseInMemoryDatabase("FluxionIntegrationTests"));

            services.AddScoped<IApplicationDbContext>(sp =>
                sp.GetRequiredService<FluxionDbContext>());

            // ── Override email service with no-op ────────────────────────
            var emailDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(IEmailService));
            if (emailDescriptor != null) services.Remove(emailDescriptor);
            services.AddScoped<IEmailService, NoOpEmailService>();

            // ── Fix 2: Remove background hosted services ─────────────────
            // Background services (MaintenanceTicketGeneratorService,
            // WarrantyExpiryNotificationService) call Task.Delay with the
            // stoppingToken. When the test host shuts down, the token is
            // cancelled, throwing TaskCanceledException which — under the
            // default StopHost behaviour — crashes the entire host and
            // fails every test. Remove them from the test DI container so
            // they never run during integration tests.
            var hostedServicesToRemove = services
                .Where(d =>
                    d.ServiceType == typeof(IHostedService) &&
                    d.ImplementationType != null &&
                    (d.ImplementationType.Name == "MaintenanceTicketGeneratorService" ||
                     d.ImplementationType.Name == "WarrantyExpiryNotificationService"))
                .ToList();
            foreach (var d in hostedServicesToRemove) services.Remove(d);

            // ── Ensure DB is created ────────────────────────────────────
            var sp = services.BuildServiceProvider();
            using var scope = sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<FluxionDbContext>();
            db.Database.EnsureCreated();
        });
    }

    protected override void Dispose(bool disposing)
    {
        // Clean up environment variables to avoid polluting other tests
        Environment.SetEnvironmentVariable("JwtSettings__SecretKey", null);
        Environment.SetEnvironmentVariable("JwtSettings__Issuer", null);
        Environment.SetEnvironmentVariable("JwtSettings__Audience", null);
        Environment.SetEnvironmentVariable("JwtSettings__ExpiryMinutes", null);
        Environment.SetEnvironmentVariable("AllowedOrigins__0", null);
        Environment.SetEnvironmentVariable("AllowedOrigins__1", null);
        base.Dispose(disposing);
    }
}

/// <summary>
/// A no-op email service so integration tests don't send real emails.
/// </summary>
public class NoOpEmailService : IEmailService
{
    public Task SendEmailAsync(string toEmail, string subject, string htmlBody)
        => Task.CompletedTask;
}
