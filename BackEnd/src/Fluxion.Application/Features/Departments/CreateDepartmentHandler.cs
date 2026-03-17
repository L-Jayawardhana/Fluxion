using Fluxion.Application.Interfaces;
using Fluxion.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Fluxion.Application.Features.Departments;

public class CreateDepartmentHandler : IRequestHandler<CreateDepartmentCommand, DepartmentDto>
{
    private readonly IApplicationDbContext _context;

    public CreateDepartmentHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DepartmentDto> Handle(CreateDepartmentCommand request, CancellationToken cancellationToken)
    {
        // Validate duplicate name within the same organisation (only check active departments)
        var duplicate = await _context.Departments
            .AnyAsync(d => d.OrgId == request.OrgId &&
                           d.DepartmentName == request.Name &&
                           d.IsActive,
                      cancellationToken);

        if (duplicate)
            throw new InvalidOperationException("A department with this name already exists in the organisation.");

        var now = DateTime.UtcNow;

        var department = new Department
        {
            OrgId = request.OrgId,
            DepartmentName = request.Name,
            Description = request.Description,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };

        _context.Departments.Add(department);
        await _context.SaveChangesAsync(cancellationToken);

        return ToDto(department);
    }

    internal static DepartmentDto ToDto(Department d) => new(
        d.DepartmentId,
        d.DepartmentName,
        d.Description,
        d.OrgId,
        d.IsActive,
        d.CreatedAt,
        d.UpdatedAt
    );
}
