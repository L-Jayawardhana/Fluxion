using FluentAssertions;
using Fluxion.Application.Features.Departments;
using Fluxion.Domain.Entities;
using Fluxion.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace Fluxion.UnitTests.Departments;

public class DepartmentHandlerTests : IDisposable
{
    private readonly FluxionDbContext _db;

    public DepartmentHandlerTests()
    {
        var options = new DbContextOptionsBuilder<FluxionDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()) // fresh DB per test class
            .Options;
        _db = new FluxionDbContext(options);
        _db.Database.EnsureCreated();
    }

    public void Dispose() => _db.Dispose();

    // ── Create ────────────────────────────────────────────────────────

    [Fact]
    public async Task CreateDepartment_ValidInput_ReturnsDto()
    {
        var handler = new CreateDepartmentHandler(_db);
        var command = new CreateDepartmentCommand(OrgId: 1, Name: "Engineering", Description: "Tech team");

        var result = await handler.Handle(command, CancellationToken.None);

        result.Should().NotBeNull();
        result.DepartmentName.Should().Be("Engineering");
        result.Description.Should().Be("Tech team");
        result.OrgId.Should().Be(1);
        result.IsActive.Should().BeTrue();
        result.DepartmentId.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task CreateDepartment_DuplicateNameSameOrg_ThrowsInvalidOperationException()
    {
        _db.Departments.Add(new Department
        {
            OrgId = 1,
            DepartmentName = "HR",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();

        var handler = new CreateDepartmentHandler(_db);
        var command = new CreateDepartmentCommand(OrgId: 1, Name: "HR", Description: null);

        var act = async () => await handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*already exists*");
    }

    [Fact]
    public async Task CreateDepartment_SameNameDifferentOrg_Succeeds()
    {
        _db.Departments.Add(new Department
        {
            OrgId = 1,
            DepartmentName = "Finance",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();

        var handler = new CreateDepartmentHandler(_db);
        var command = new CreateDepartmentCommand(OrgId: 2, Name: "Finance", Description: null);

        var result = await handler.Handle(command, CancellationToken.None);

        result.Should().NotBeNull();
        result.OrgId.Should().Be(2);
    }

    // ── List / GetById ─────────────────────────────────────────────────

    [Fact]
    public async Task GetDepartments_ReturnsOnlyOrgScopedDepartments()
    {
        _db.Departments.AddRange(
            new Department { OrgId = 10, DepartmentName = "Alpha", IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Department { OrgId = 10, DepartmentName = "Beta", IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Department { OrgId = 99, DepartmentName = "Other Org", IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        );
        await _db.SaveChangesAsync();

        var handler = new GetDepartmentsHandler(_db);
        var result = await handler.Handle(new GetDepartmentsQuery(OrgId: 10), CancellationToken.None);

        result.Should().HaveCount(2);
        result.Should().OnlyContain(d => d.OrgId == 10);
        result.Select(d => d.DepartmentName).Should().BeInAscendingOrder();
    }

    // ── Update ─────────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateDepartment_ValidInput_UpdatesNameAndDescription()
    {
        var dept = new Department
        {
            OrgId = 1,
            DepartmentName = "Old Name",
            Description = "Old desc",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.Departments.Add(dept);
        await _db.SaveChangesAsync();

        var handler = new UpdateDepartmentHandler(_db);
        await handler.Handle(
            new UpdateDepartmentCommand(dept.DepartmentId, OrgId: 1, Name: "New Name", Description: "New desc"),
            CancellationToken.None);

        var updated = await _db.Departments.FindAsync(dept.DepartmentId);
        updated!.DepartmentName.Should().Be("New Name");
        updated.Description.Should().Be("New desc");
    }

    [Fact]
    public async Task UpdateDepartment_DuplicateNameExcludesSelf()
    {
        var dept = new Department
        {
            OrgId = 1,
            DepartmentName = "Existing",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.Departments.Add(dept);
        await _db.SaveChangesAsync();

        var handler = new UpdateDepartmentHandler(_db);
        // Updating a department to its own existing name should NOT throw
        var act = async () => await handler.Handle(
            new UpdateDepartmentCommand(dept.DepartmentId, OrgId: 1, Name: "Existing", Description: null),
            CancellationToken.None);

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task UpdateDepartment_DuplicateNameFromAnotherDept_Throws()
    {
        _db.Departments.AddRange(
            new Department { OrgId = 1, DepartmentName = "Finance", IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Department { OrgId = 1, DepartmentName = "HR", IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        );
        await _db.SaveChangesAsync();

        var hrDept = _db.Departments.Local.First(d => d.DepartmentName == "HR");
        var handler = new UpdateDepartmentHandler(_db);

        var act = async () => await handler.Handle(
            new UpdateDepartmentCommand(hrDept.DepartmentId, OrgId: 1, Name: "Finance", Description: null),
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*already exists*");
    }

    [Fact]
    public async Task UpdateDepartment_NotFound_ThrowsKeyNotFoundException()
    {
        var handler = new UpdateDepartmentHandler(_db);
        var act = async () => await handler.Handle(
            new UpdateDepartmentCommand(DepartmentId: 9999, OrgId: 1, Name: "X", Description: null),
            CancellationToken.None);

        await act.Should().ThrowAsync<KeyNotFoundException>();
    }

    // ── Toggle ─────────────────────────────────────────────────────────

    [Fact]
    public async Task ToggleDepartment_Deactivate_SetsIsActiveFalse()
    {
        var dept = new Department
        {
            OrgId = 1,
            DepartmentName = "Operations",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.Departments.Add(dept);
        await _db.SaveChangesAsync();

        var handler = new ToggleDepartmentHandler(_db);
        await handler.Handle(
            new ToggleDepartmentCommand(dept.DepartmentId, OrgId: 1, IsActive: false),
            CancellationToken.None);

        var toggled = await _db.Departments.FindAsync(dept.DepartmentId);
        toggled!.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task ToggleDepartment_WrongOrg_ThrowsKeyNotFoundException()
    {
        var dept = new Department
        {
            OrgId = 1,
            DepartmentName = "Security",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.Departments.Add(dept);
        await _db.SaveChangesAsync();

        var handler = new ToggleDepartmentHandler(_db);
        var act = async () => await handler.Handle(
            new ToggleDepartmentCommand(dept.DepartmentId, OrgId: 999, IsActive: false),
            CancellationToken.None);

        await act.Should().ThrowAsync<KeyNotFoundException>();
    }

    [Fact]
    public async Task ToggleDepartment_ReactivatingDuplicateName_ThrowsInvalidOperationException()
    {
        // Add one active department and one inactive department with the same name
        _db.Departments.AddRange(
            new Department { OrgId = 1, DepartmentName = "Marketing", IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Department { OrgId = 1, DepartmentName = "Marketing", IsActive = false, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        );
        await _db.SaveChangesAsync();

        var inactiveDept = _db.Departments.Local.First(d => !d.IsActive && d.DepartmentName == "Marketing");

        var handler = new ToggleDepartmentHandler(_db);
        var act = async () => await handler.Handle(
            new ToggleDepartmentCommand(inactiveDept.DepartmentId, OrgId: 1, IsActive: true),
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Cannot reactivate: a department with this name already exists and is active.");
    }
}
