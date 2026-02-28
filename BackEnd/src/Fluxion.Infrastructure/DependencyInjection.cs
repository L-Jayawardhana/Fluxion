using Fluxion.Application.Interfaces;
using Fluxion.Infrastructure.Email;
using Fluxion.Infrastructure.JWT;
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

        return services;
    }
}


