using Fluxion.Application.Interfaces;
using Fluxion.Infrastructure.Email;
using Fluxion.Infrastructure.JWT;
using Fluxion.Infrastructure.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Fluxion.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // JWT Settings
        services.Configure<JwtSettings>(configuration.GetSection("JwtSettings"));

        // SMTP Settings
        services.Configure<SmtpSettings>(configuration.GetSection("SmtpSettings"));

        // Auth services
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();

        // Email service
        services.AddScoped<IEmailService, SmtpEmailService>();

        // Verification code service (singleton — codes must persist across requests)
        services.AddSingleton<IVerificationCodeService, InMemoryVerificationCodeService>();

        // Invitation service
        services.AddScoped<IInvitationService, InvitationService>();

        return services;
    }
}


