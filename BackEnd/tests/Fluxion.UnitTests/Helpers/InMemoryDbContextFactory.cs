using Fluxion.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace Fluxion.UnitTests.Helpers;

/// <summary>
/// Creates a fresh in-memory <see cref="FluxionDbContext"/> per test to guarantee isolation.
/// </summary>
public static class InMemoryDbContextFactory
{
    public static FluxionDbContext Create(string? dbName = null)
    {
        dbName ??= Guid.NewGuid().ToString();

        var options = new DbContextOptionsBuilder<FluxionDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;

        var context = new FluxionDbContext(options);
        context.Database.EnsureCreated();
        return context;
    }
}
