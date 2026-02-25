using Microsoft.EntityFrameworkCore;

namespace Fluxion.API.Data;

public class FluxionDbContext : DbContext
{
    public FluxionDbContext(DbContextOptions<FluxionDbContext> options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
    }
}
