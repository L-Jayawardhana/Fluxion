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

public class MaintenanceEndpointsTests : IClassFixture<FluxionWebApplicationFactory>
{
    private static int _seq = 20000;

    private readonly HttpClient _client;
    private readonly FluxionWebApplicationFactory _factory;
    private readonly JsonSerializerOptions _jsonOpts = new() { PropertyNameCaseInsensitive = true };

    public MaintenanceEndpointsTests(FluxionWebApplicationFactory factory)
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
    public async Task GetMaintenanceLogPage_NoToken_Returns401()
    {
        var response = await _client.GetAsync("/api/maintenance/assets/1/log-page");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetMaintenanceLogPage_UserWithAssignment_Returns200()
    {
        var orgId = NextId();
        var userId = NextId();
        var technicianId = NextId();
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
                    UserId = userId,
                    OrgId = orgId,
                    FullName = "Employee One",
                    Email = $"emp-{userId}@fluxion.dev",
                    PasswordHash = "x",
                    Role = UserRole.user,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
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
                });

            db.Assets.Add(new Asset
            {
                AssetId = assetId,
                OrgId = orgId,
                AssetName = "User Laptop",
                AssetType = "Laptop",
                Status = AssetStatus.under_maintenance,
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });

            db.AssetAssignments.Add(new AssetAssignment
            {
                AssignmentId = NextId(),
                OrgId = orgId,
                AssetId = assetId,
                UserId = userId,
                AssignedBy = userId,
                AssignedDate = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });

            db.MaintenanceTickets.Add(new MaintenanceTicket
            {
                TicketId = ticketId,
                OrgId = orgId,
                AssetId = assetId,
                RaisedBy = userId,
                AssignedTo = technicianId,
                Title = "Battery issue",
                IssueDescription = "Battery drains quickly",
                Priority = TicketPriority.high,
                Status = TicketStatus.in_progress,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });

            db.MaintenanceLogs.Add(new MaintenanceLog
            {
                LogId = NextId(),
                OrgId = orgId,
                TicketId = ticketId,
                AssetId = assetId,
                TechnicianId = technicianId,
                RepairDate = DateTime.UtcNow,
                RepairCost = 75m,
                RepairNotes = "Changed battery health profile",
                IsVisibleToEmployee = null
            });

            await db.SaveChangesAsync();
        }

        var token = GenerateToken(UserRole.user, userId, orgId);
        var req = WithAuth(HttpMethod.Get, $"/api/maintenance/assets/{assetId}/log-page?pageNumber=1&pageSize=10", token);

        var response = await _client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        doc.RootElement.GetProperty("isSuccess").GetBoolean().Should().BeTrue();
        doc.RootElement.GetProperty("data").GetProperty("assetInfo").GetProperty("assetId").GetInt32().Should().Be(assetId);
    }

    [Fact]
    public async Task AddComment_UserRole_Returns403()
    {
        var orgId = NextId();
        var userId = NextId();
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
                AssetName = "Office PC",
                AssetType = "Desktop",
                Status = AssetStatus.under_maintenance,
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });

            db.MaintenanceTickets.Add(new MaintenanceTicket
            {
                TicketId = ticketId,
                OrgId = orgId,
                AssetId = assetId,
                RaisedBy = userId,
                AssignedTo = NextId(),
                Title = "CPU overheating",
                IssueDescription = "fan noise",
                Priority = TicketPriority.medium,
                Status = TicketStatus.assigned,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });

            await db.SaveChangesAsync();
        }

        var token = GenerateToken(UserRole.user, userId, orgId);
        var req = WithAuth(HttpMethod.Post, $"/api/maintenance/tickets/{ticketId}/comments", token, new
        {
            content = "Please fix soon",
            isVisibleToEmployee = true
        });

        var response = await _client.SendAsync(req);
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task AddComment_TechnicianAssignedTicket_Returns200_AndPersists()
    {
        var orgId = NextId();
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

            db.Users.Add(new User
            {
                UserId = technicianId,
                OrgId = orgId,
                FullName = "Technician Main",
                Email = $"tech-{technicianId}@fluxion.dev",
                PasswordHash = "x",
                Role = UserRole.technician,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });

            db.Assets.Add(new Asset
            {
                AssetId = assetId,
                OrgId = orgId,
                AssetName = "Router",
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
                AssignedTo = technicianId,
                Title = "Packet loss",
                IssueDescription = "Intermittent drops",
                Priority = TicketPriority.high,
                Status = TicketStatus.in_progress,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });

            await db.SaveChangesAsync();
        }

        var token = GenerateToken(UserRole.technician, technicianId, orgId);
        var req = WithAuth(HttpMethod.Post, $"/api/maintenance/tickets/{ticketId}/comments", token, new
        {
            content = "Investigating NIC driver",
            isVisibleToEmployee = true
        });

        var response = await _client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        using var verifyScope = _factory.Services.CreateScope();
        var verifyDb = verifyScope.ServiceProvider.GetRequiredService<FluxionDbContext>();
        verifyDb.MaintenanceLogs.Should().Contain(l => l.TicketId == ticketId && l.RepairNotes == "Investigating NIC driver");
    }

    [Fact]
    public async Task GetMaintenanceCostReport_AdminRole_Returns200()
    {
        var orgId = NextId();
        var adminId = NextId();
        var technicianId = NextId();
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

            db.Users.Add(new User
            {
                UserId = adminId,
                OrgId = orgId,
                FullName = "Admin",
                Email = $"admin-{adminId}@fluxion.dev",
                PasswordHash = "x",
                Role = UserRole.admin,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });

            db.Assets.Add(new Asset
            {
                AssetId = assetId,
                OrgId = orgId,
                AssetName = "Server A",
                AssetType = "Server",
                Status = AssetStatus.under_maintenance,
                CreatedBy = adminId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });

            db.MaintenanceTickets.Add(new MaintenanceTicket
            {
                TicketId = ticketId,
                OrgId = orgId,
                AssetId = assetId,
                RaisedBy = adminId,
                AssignedTo = technicianId,
                Title = "Disk warning",
                IssueDescription = "RAID degrade",
                Priority = TicketPriority.critical,
                Status = TicketStatus.resolved,
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                ClosedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });

            db.MaintenanceLogs.Add(new MaintenanceLog
            {
                LogId = NextId(),
                OrgId = orgId,
                TicketId = ticketId,
                AssetId = assetId,
                TechnicianId = technicianId,
                RepairDate = DateTime.UtcNow,
                RepairCost = 300m,
                RepairNotes = "Replaced failed disk",
                IsVisibleToEmployee = null
            });

            await db.SaveChangesAsync();
        }

        var token = GenerateToken(UserRole.admin, adminId, orgId);
        var req = WithAuth(HttpMethod.Get, "/api/maintenance/reports/cost?pageNumber=1&pageSize=20", token);

        var response = await _client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        doc.RootElement.GetProperty("isSuccess").GetBoolean().Should().BeTrue();
        doc.RootElement.GetProperty("data").GetProperty("data").GetProperty("items").GetArrayLength().Should().BeGreaterThan(0);
    }
}
