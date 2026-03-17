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
using Microsoft.Extensions.Options;

namespace Fluxion.IntegrationTests;

/// <summary>
/// Integration tests for the /api/department endpoints.
/// Uses FluxionWebApplicationFactory which replaces MySQL with in-memory EF.
/// </summary>
public class DepartmentEndpointsTests : IClassFixture<FluxionWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly FluxionWebApplicationFactory _factory;
    private readonly JsonSerializerOptions _jsonOpts = new() { PropertyNameCaseInsensitive = true };

    public DepartmentEndpointsTests(FluxionWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    // ── Helper: generate a JWT for a test user with the given role ─────

    private string GenerateToken(UserRole role, int orgId = 1)
    {
        using var scope = _factory.Services.CreateScope();
        var jwtService = scope.ServiceProvider.GetRequiredService<IJwtTokenService>();
        var user = new User
        {
            UserId = role == UserRole.admin ? 100 : role == UserRole.owner ? 101 : 102,
            FullName = $"Test {role}",
            Email = $"{role}@fluxion.dev",
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
            req.Content = JsonContent.Create(body);
        return req;
    }

    // ── Unauthenticated Requests ───────────────────────────────────────

    [Fact]
    public async Task GetDepartments_NoToken_Returns401()
    {
        var response = await _client.GetAsync("/api/department?orgId=1");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateDepartment_NoToken_Returns401()
    {
        var response = await _client.PostAsJsonAsync("/api/department",
            new { orgId = 1, name = "Test" });
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ── Forbidden for unprivileged role ────────────────────────────────

    [Fact]
    public async Task CreateDepartment_UserRole_Returns201WithDto()
    {
        var token = GenerateToken(UserRole.user, orgId: 11);
        var deptName = $"UserDept-{Guid.NewGuid():N}";

        var req = WithAuth(HttpMethod.Post, "/api/department", token,
            new { orgId = 11, name = deptName, description = "Created by user role" });

        var response = await _client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var body = await response.Content.ReadFromJsonAsync<DepartmentResponseDto>(_jsonOpts);
        body.Should().NotBeNull();
        body!.DepartmentName.Should().Be(deptName);
        body.OrgId.Should().Be(11);
    }

    [Fact]
    public async Task GetDepartments_UserRole_Returns200()
    {
        var token = GenerateToken(UserRole.user);
        var req = WithAuth(HttpMethod.Get, "/api/department?orgId=1", token);

        var response = await _client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // ── Admin / Owner CRUD ─────────────────────────────────────────────

    [Fact]
    public async Task CreateDepartment_AdminRole_Returns201WithDto()
    {
        var token = GenerateToken(UserRole.admin, orgId: 10);
        var deptName = $"Engineering-{Guid.NewGuid():N}";

        var req = WithAuth(HttpMethod.Post, "/api/department", token,
            new { orgId = 10, name = deptName, description = "Backend team" });

        var response = await _client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var body = await response.Content.ReadFromJsonAsync<DepartmentResponseDto>(_jsonOpts);
        body.Should().NotBeNull();
        body!.DepartmentName.Should().Be(deptName);
        body.OrgId.Should().Be(10);
        body.IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task CreateDepartment_OwnerRole_Returns201()
    {
        var token = GenerateToken(UserRole.owner, orgId: 20);
        var deptName = $"Ops-{Guid.NewGuid():N}";

        var req = WithAuth(HttpMethod.Post, "/api/department", token,
            new { orgId = 20, name = deptName });

        var response = await _client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task CreateDepartment_DuplicateName_Returns409()
    {
        var token = GenerateToken(UserRole.admin, orgId: 30);
        var deptName = $"Marketing-{Guid.NewGuid():N}";

        var payload = new { orgId = 30, name = deptName };

        // First create
        await _client.SendAsync(WithAuth(HttpMethod.Post, "/api/department", token, payload));

        // Duplicate
        var dupResponse = await _client.SendAsync(WithAuth(HttpMethod.Post, "/api/department", token, payload));

        dupResponse.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task GetDepartments_AdminRole_Returns200OrgScopedList()
    {
        var token = GenerateToken(UserRole.admin, orgId: 40);
        var name1 = $"TeamA-{Guid.NewGuid():N}";
        var name2 = $"TeamB-{Guid.NewGuid():N}";

        // Create two departments for org 40
        await _client.SendAsync(WithAuth(HttpMethod.Post, "/api/department", token, new { orgId = 40, name = name1 }));
        await _client.SendAsync(WithAuth(HttpMethod.Post, "/api/department", token, new { orgId = 40, name = name2 }));

        var getReq = WithAuth(HttpMethod.Get, "/api/department?orgId=40", token);
        var response = await _client.SendAsync(getReq);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var depts = await response.Content.ReadFromJsonAsync<List<DepartmentResponseDto>>(_jsonOpts);
        depts.Should().Contain(d => d.DepartmentName == name1);
        depts.Should().Contain(d => d.DepartmentName == name2);
        depts.Should().OnlyContain(d => d.OrgId == 40);
    }

    [Fact]
    public async Task UpdateDepartment_AdminRole_Returns204()
    {
        var token = GenerateToken(UserRole.admin, orgId: 50);
        var originalName = $"ToUpdate-{Guid.NewGuid():N}";

        // Create
        var createResp = await _client.SendAsync(WithAuth(HttpMethod.Post, "/api/department", token,
            new { orgId = 50, name = originalName }));
        var created = await createResp.Content.ReadFromJsonAsync<DepartmentResponseDto>(_jsonOpts);

        // Update
        var updatedName = $"Updated-{Guid.NewGuid():N}";
        var updateResp = await _client.SendAsync(WithAuth(HttpMethod.Put,
            $"/api/department/{created!.DepartmentId}", token,
            new { departmentId = created.DepartmentId, orgId = 50, name = updatedName, description = "updated" }));

        updateResp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task ToggleDepartment_AdminRole_Returns204()
    {
        var token = GenerateToken(UserRole.admin, orgId: 60);
        var name = $"ToToggle-{Guid.NewGuid():N}";

        var createResp = await _client.SendAsync(WithAuth(HttpMethod.Post, "/api/department", token,
            new { orgId = 60, name }));
        var created = await createResp.Content.ReadFromJsonAsync<DepartmentResponseDto>(_jsonOpts);

        var toggleResp = await _client.SendAsync(WithAuth(HttpMethod.Patch,
            $"/api/department/{created!.DepartmentId}/toggle", token,
            new { departmentId = created.DepartmentId, orgId = 60, isActive = false }));

        toggleResp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    // ── DTOs for deserialization ──────────────────────────────────────

    private record DepartmentResponseDto(
        int DepartmentId,
        string DepartmentName,
        string? Description,
        int OrgId,
        bool IsActive,
        DateTime CreatedAt,
        DateTime UpdatedAt
    );
}
