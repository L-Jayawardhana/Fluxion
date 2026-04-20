using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Fluxion.Application.Interfaces;
using Fluxion.Domain.Entities;
using Fluxion.Domain.Enums;
using Fluxion.Infrastructure.JWT;
using Fluxion.Persistence.Context;
using Microsoft.Extensions.DependencyInjection;

namespace Fluxion.IntegrationTests;

public class MaintenanceTicketsEndpointsTests : IClassFixture<FluxionWebApplicationFactory>
{
    private static int _seq = 10000;

    private readonly HttpClient _client;
    private readonly FluxionWebApplicationFactory _factory;
    private readonly JsonSerializerOptions _jsonOpts = new() { PropertyNameCaseInsensitive = true };

    public MaintenanceTicketsEndpointsTests(FluxionWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private static int NextId() => Interlocked.Increment(ref _seq);

    private string GenerateToken(UserRole role, int userId, int orgId)
    {
        using var scope = _factory.Services.CreateScope();
        var jwtService = scope.ServiceProvider.GetRequiredService<IJwtTokenService>();
        var user = new User
        {
            UserId = userId,
            FullName = $"User-{userId}",
            Email = $"u{userId}@fluxion.dev",
            PasswordHash = "irrelevant",
            OrgId = orgId,
            Role = role,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        return jwtService.GenerateToken(user);
    }

    private HttpRequestMessage WithAuth(HttpMethod method, string url, string token, object? body = null)
    {
        var req = new HttpRequestMessage(method, url);
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        if (body is not null)
        {
            req.Content = JsonContent.Create(body);
        }
        return req;
    }

    [Fact]
    public async Task CreateTicket_NoToken_Returns401()
    {
        var response = await _client.PostAsJsonAsync("/api/maintenance-tickets", new
        {
            assetId = 1,
            orgId = 1,
            title = "No auth",
            description = "Should fail",
            priority = "high"
        });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateTicket_UserRole_Returns201_AndUpdatesAssetStatus()
    {
        var orgId = NextId();
        var assetId = NextId();
        var userId = NextId();
        var ticketTitle = $"mt-create-{Guid.NewGuid():N}";

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<FluxionDbContext>();

            db.Organizations.Add(new Organization
            {
                OrgId = orgId,
                OrgName = $"Org-{orgId}",
                Slug = $"org-{orgId}",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });

            db.Assets.Add(new Asset
            {
                AssetId = assetId,
                OrgId = orgId,
                AssetName = "Employee Laptop",
                AssetType = "Laptop",
                Status = AssetStatus.available,
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });

            await db.SaveChangesAsync();
        }

        var token = GenerateToken(UserRole.user, userId, orgId);

        var req = WithAuth(HttpMethod.Post, "/api/maintenance-tickets", token, new
        {
            assetId,
            orgId,
            title = ticketTitle,
            description = "Trackpad not responding",
            priority = "high"
        });

        var response = await _client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Created);

        using var verifyScope = _factory.Services.CreateScope();
        var verifyDb = verifyScope.ServiceProvider.GetRequiredService<FluxionDbContext>();
        var createdTicket = verifyDb.MaintenanceTickets.Single(t => t.Title == ticketTitle);
        createdTicket.AssetId.Should().Be(assetId);
        createdTicket.OrgId.Should().Be(orgId);
        createdTicket.RaisedBy.Should().Be(userId);
        createdTicket.Status.Should().Be(TicketStatus.open);

        var asset = verifyDb.Assets.Single(a => a.AssetId == assetId);
        asset.Status.Should().Be(AssetStatus.under_maintenance);
    }

    [Fact]
    public async Task AssignTicket_AdminRole_Returns200_AndAssignsTechnician()
    {
        var orgId = NextId();
        var adminId = NextId();
        var technicianId = NextId();
        var reporterId = NextId();
        var assetId = NextId();
        var ticketId = NextId();

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<FluxionDbContext>();

            db.Organizations.Add(new Organization
            {
                OrgId = orgId,
                OrgName = $"Org-{orgId}",
                Slug = $"org-{orgId}",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });

            db.Users.AddRange(
                new User
                {
                    UserId = technicianId,
                    OrgId = orgId,
                    FullName = "Tech One",
                    Email = $"tech-{technicianId}@fluxion.dev",
                    PasswordHash = "x",
                    Role = UserRole.technician,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new User
                {
                    UserId = reporterId,
                    OrgId = orgId,
                    FullName = "Reporter",
                    Email = $"reporter-{reporterId}@fluxion.dev",
                    PasswordHash = "x",
                    Role = UserRole.user,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });

            db.Assets.Add(new Asset
            {
                AssetId = assetId,
                OrgId = orgId,
                AssetName = "Printer",
                AssetType = "Printer",
                Status = AssetStatus.under_maintenance,
                CreatedBy = reporterId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });

            db.MaintenanceTickets.Add(new MaintenanceTicket
            {
                TicketId = ticketId,
                OrgId = orgId,
                AssetId = assetId,
                RaisedBy = reporterId,
                Title = "Paper jam",
                IssueDescription = "Repeated jam",
                Priority = TicketPriority.medium,
                Status = TicketStatus.open,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });

            await db.SaveChangesAsync();
        }

        var token = GenerateToken(UserRole.admin, adminId, orgId);
        var req = WithAuth(HttpMethod.Patch, $"/api/maintenance-tickets/{ticketId}/assign", token, new
        {
            technicianId
        });

        var response = await _client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        using var verifyScope = _factory.Services.CreateScope();
        var verifyDb = verifyScope.ServiceProvider.GetRequiredService<FluxionDbContext>();
        var ticket = verifyDb.MaintenanceTickets.Single(t => t.TicketId == ticketId);
        ticket.AssignedTo.Should().Be(technicianId);
        ticket.Status.Should().Be(TicketStatus.assigned);
    }

    [Fact]
    public async Task GetTickets_UserRole_ReturnsOnlyAssignedAssetTickets()
    {
        var orgId = NextId();
        var userId = NextId();
        var otherUserId = NextId();
        var assetMine = NextId();
        var assetOther = NextId();
        var ticketMine = NextId();
        var ticketOther = NextId();

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<FluxionDbContext>();

            db.Organizations.Add(new Organization
            {
                OrgId = orgId,
                OrgName = $"Org-{orgId}",
                Slug = $"org-{orgId}",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });

            db.Users.AddRange(
                new User
                {
                    UserId = userId,
                    OrgId = orgId,
                    FullName = "Current User",
                    Email = $"u-{userId}@fluxion.dev",
                    PasswordHash = "x",
                    Role = UserRole.user,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new User
                {
                    UserId = otherUserId,
                    OrgId = orgId,
                    FullName = "Other User",
                    Email = $"u-{otherUserId}@fluxion.dev",
                    PasswordHash = "x",
                    Role = UserRole.user,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });

            db.Assets.AddRange(
                new Asset
                {
                    AssetId = assetMine,
                    OrgId = orgId,
                    AssetName = "Mine",
                    AssetType = "Laptop",
                    Status = AssetStatus.under_maintenance,
                    CreatedBy = userId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Asset
                {
                    AssetId = assetOther,
                    OrgId = orgId,
                    AssetName = "Other",
                    AssetType = "Monitor",
                    Status = AssetStatus.under_maintenance,
                    CreatedBy = otherUserId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });

            db.AssetAssignments.AddRange(
                new AssetAssignment
                {
                    AssignmentId = NextId(),
                    OrgId = orgId,
                    AssetId = assetMine,
                    UserId = userId,
                    AssignedBy = userId,
                    AssignedDate = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new AssetAssignment
                {
                    AssignmentId = NextId(),
                    OrgId = orgId,
                    AssetId = assetOther,
                    UserId = otherUserId,
                    AssignedBy = otherUserId,
                    AssignedDate = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });

            db.MaintenanceTickets.AddRange(
                new MaintenanceTicket
                {
                    TicketId = ticketMine,
                    OrgId = orgId,
                    AssetId = assetMine,
                    RaisedBy = userId,
                    Title = "Mine-ticket",
                    IssueDescription = "mine",
                    Priority = TicketPriority.low,
                    Status = TicketStatus.open,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                },
                new MaintenanceTicket
                {
                    TicketId = ticketOther,
                    OrgId = orgId,
                    AssetId = assetOther,
                    RaisedBy = otherUserId,
                    Title = "Other-ticket",
                    IssueDescription = "other",
                    Priority = TicketPriority.low,
                    Status = TicketStatus.open,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                });

            await db.SaveChangesAsync();
        }

        var token = GenerateToken(UserRole.user, userId, orgId);
        var req = WithAuth(HttpMethod.Get, "/api/maintenance-tickets?pageNumber=1&pageSize=10", token);

        var response = await _client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<GetTicketsResult>(_jsonOpts);
        body.Should().NotBeNull();
        body!.IsSuccess.Should().BeTrue();
        body.Data.Items.Should().ContainSingle(i => i.TicketId == ticketMine);
        body.Data.Items.Should().NotContain(i => i.TicketId == ticketOther);
    }

    private record GetTicketsResult(bool IsSuccess, TicketsData Data, string? ErrorMessage);
    private record TicketsData(List<TicketItem> Items, int PageNumber, int PageSize, int TotalCount);
    private record TicketItem(int TicketId, string Title, string AssetName);
}
