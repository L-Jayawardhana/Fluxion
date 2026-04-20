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

public class TechnicianEndpointsTests : IClassFixture<FluxionWebApplicationFactory>
{
    private static int _seq = 30000;

    private readonly HttpClient _client;
    private readonly FluxionWebApplicationFactory _factory;

    public TechnicianEndpointsTests(FluxionWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private static int NextId() => Interlocked.Increment(ref _seq);

    private string GenerateToken(UserRole role, int userId, int orgId)
    {
        using var scope = _factory.Services.CreateScope();
        var jwtService = scope.ServiceProvider.GetRequiredService<IJwtTokenService>();
        return jwtService.GenerateToken(new User
        {
            UserId = userId,
            OrgId = orgId,
            FullName = $"u-{userId}",
            Email = $"u-{userId}@fluxion.dev",
            PasswordHash = "x",
            Role = role,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
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
    public async Task DashboardStats_TechnicianRole_Returns200AndCounts()
    {
        var orgId = NextId();
        var techId = NextId();
        var reporterId = NextId();
        var assetId = NextId();

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
                AssetName = "Tech Asset",
                AssetType = "Laptop",
                Status = AssetStatus.under_maintenance,
                CreatedBy = reporterId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });

            db.MaintenanceTickets.AddRange(
                new MaintenanceTicket
                {
                    TicketId = NextId(),
                    OrgId = orgId,
                    AssetId = assetId,
                    RaisedBy = reporterId,
                    AssignedTo = techId,
                    Title = "Open one",
                    IssueDescription = "desc",
                    Priority = TicketPriority.low,
                    Status = TicketStatus.open,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new MaintenanceTicket
                {
                    TicketId = NextId(),
                    OrgId = orgId,
                    AssetId = assetId,
                    RaisedBy = reporterId,
                    AssignedTo = techId,
                    Title = "Progress one",
                    IssueDescription = "desc",
                    Priority = TicketPriority.high,
                    Status = TicketStatus.in_progress,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new MaintenanceTicket
                {
                    TicketId = NextId(),
                    OrgId = orgId,
                    AssetId = assetId,
                    RaisedBy = reporterId,
                    AssignedTo = techId,
                    Title = "Closed one",
                    IssueDescription = "desc",
                    Priority = TicketPriority.critical,
                    Status = TicketStatus.closed,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });

            await db.SaveChangesAsync();
        }

        var token = GenerateToken(UserRole.technician, techId, orgId);
        var req = WithAuth(HttpMethod.Get, "/api/technician/dashboard/stats", token);

        var response = await _client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        doc.RootElement.GetProperty("totalAssigned").GetInt32().Should().BeGreaterThanOrEqualTo(3);
        doc.RootElement.GetProperty("openTickets").GetInt32().Should().BeGreaterThanOrEqualTo(1);
    }

    [Fact]
    public async Task GetTicketDetail_NotAssignedToTechnician_Returns404()
    {
        var orgId = NextId();
        var requestingTech = NextId();
        var assignedTech = NextId();
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

            db.Assets.Add(new Asset
            {
                AssetId = assetId,
                OrgId = orgId,
                AssetName = "NAS",
                AssetType = "Storage",
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
                AssignedTo = assignedTech,
                Title = "Disk error",
                IssueDescription = "SMART warning",
                Priority = TicketPriority.high,
                Status = TicketStatus.assigned,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });

            await db.SaveChangesAsync();
        }

        var token = GenerateToken(UserRole.technician, requestingTech, orgId);
        var req = WithAuth(HttpMethod.Get, $"/api/technician/tickets/{ticketId}", token);

        var response = await _client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task UpdateStatus_ToResolved_UpdatesClosedAt()
    {
        var orgId = NextId();
        var techId = NextId();
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

            db.Assets.Add(new Asset
            {
                AssetId = assetId,
                OrgId = orgId,
                AssetName = "Switch",
                AssetType = "Network",
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
                AssignedTo = techId,
                Title = "Port failures",
                IssueDescription = "Flapping",
                Priority = TicketPriority.medium,
                Status = TicketStatus.in_progress,
                CreatedAt = DateTime.UtcNow.AddDays(-2),
                UpdatedAt = DateTime.UtcNow
            });

            await db.SaveChangesAsync();
        }

        var token = GenerateToken(UserRole.technician, techId, orgId);
        var req = WithAuth(HttpMethod.Patch, $"/api/technician/tickets/{ticketId}/status", token, new
        {
            status = "resolved"
        });

        var response = await _client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        using var verifyScope = _factory.Services.CreateScope();
        var verifyDb = verifyScope.ServiceProvider.GetRequiredService<FluxionDbContext>();
        var ticket = verifyDb.MaintenanceTickets.Single(t => t.TicketId == ticketId);
        ticket.Status.Should().Be(TicketStatus.resolved);
        ticket.ClosedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task LogRepair_WhenTicketNotInProgress_Returns400()
    {
        var orgId = NextId();
        var techId = NextId();
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

            db.Assets.Add(new Asset
            {
                AssetId = assetId,
                OrgId = orgId,
                AssetName = "Desktop",
                AssetType = "Desktop",
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
                AssignedTo = techId,
                Title = "Fan noise",
                IssueDescription = "loud fan",
                Priority = TicketPriority.low,
                Status = TicketStatus.assigned,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });

            await db.SaveChangesAsync();
        }

        var token = GenerateToken(UserRole.technician, techId, orgId);
        var req = WithAuth(HttpMethod.Put, $"/api/technician/tickets/{ticketId}/repair", token, new
        {
            repairDescription = "Cleaned fan",
            cost = 20.5m
        });

        var response = await _client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task AddComment_AssignedTicket_Returns200_AndCreatesLog()
    {
        var orgId = NextId();
        var techId = NextId();
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

            db.Assets.Add(new Asset
            {
                AssetId = assetId,
                OrgId = orgId,
                AssetName = "Firewall",
                AssetType = "Network",
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
                AssignedTo = techId,
                Title = "VPN instability",
                IssueDescription = "drops",
                Priority = TicketPriority.high,
                Status = TicketStatus.in_progress,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });

            await db.SaveChangesAsync();
        }

        var token = GenerateToken(UserRole.technician, techId, orgId);
        var req = WithAuth(HttpMethod.Post, $"/api/technician/tickets/{ticketId}/comments", token, new
        {
            content = "Applied temporary workaround",
            isVisibleToEmployee = true
        });

        var response = await _client.SendAsync(req);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        using var verifyScope = _factory.Services.CreateScope();
        var verifyDb = verifyScope.ServiceProvider.GetRequiredService<FluxionDbContext>();
        verifyDb.MaintenanceLogs.Should().Contain(l => l.TicketId == ticketId && l.RepairNotes == "Applied temporary workaround");
    }

    [Fact]
    public async Task UpdateAssetCondition_InvalidCondition_Returns400()
    {
        var orgId = NextId();
        var techId = NextId();
        var creatorId = NextId();
        var assetId = NextId();

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
                AssetName = "AP",
                AssetType = "Network",
                Status = AssetStatus.available,
                CreatedBy = creatorId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });

            await db.SaveChangesAsync();
        }

        var token = GenerateToken(UserRole.technician, techId, orgId);
        var req = WithAuth(HttpMethod.Patch, $"/api/technician/assets/{assetId}/condition", token, new
        {
            condition = "invalid_condition"
        });

        var response = await _client.SendAsync(req);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
