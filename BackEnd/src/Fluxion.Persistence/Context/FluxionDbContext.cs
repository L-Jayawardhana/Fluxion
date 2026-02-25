using Fluxion.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Fluxion.Persistence.Context;

public class FluxionDbContext : DbContext, IApplicationDbContext
{
    public FluxionDbContext(DbContextOptions<FluxionDbContext> options) : base(options)
    {
    }

    // Add DbSet<TEntity> properties here as you create entities
    // Example: public DbSet<Equipment> Equipments => Set<Equipment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply all entity configurations from this assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(FluxionDbContext).Assembly);
    }
}
