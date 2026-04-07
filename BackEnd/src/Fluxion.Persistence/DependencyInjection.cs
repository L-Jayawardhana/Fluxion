using Fluxion.Application.Interfaces;
using Fluxion.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Fluxion.Persistence;

public static class DependencyInjection
{
    public static IServiceCollection AddPersistence(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        services.AddDbContext<FluxionDbContext>(options =>
            options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

        services.AddScoped<IApplicationDbContext>(provider =>
            provider.GetRequiredService<FluxionDbContext>());

        services.AddScoped<IMaintenanceTicketRepository, Fluxion.Persistence.Repositories.MaintenanceTicketRepository>();

        return services;
    }
}
