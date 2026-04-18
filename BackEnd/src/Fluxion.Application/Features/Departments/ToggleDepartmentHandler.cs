using Fluxion.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Fluxion.Application.Features.Departments;

public class ToggleDepartmentHandler : IRequestHandler<ToggleDepartmentCommand>
{
    private readonly IApplicationDbContext _context;

    public ToggleDepartmentHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(ToggleDepartmentCommand request, CancellationToken cancellationToken)
    {
        var department = await _context.Departments
            .FirstOrDefaultAsync(d => d.DepartmentId == request.DepartmentId && d.OrgId == request.OrgId,
                                 cancellationToken);

        if (department is null)
            throw new KeyNotFoundException("Department not found.");

        if (request.IsActive && !department.IsActive)
        {
            var duplicate = await _context.Departments
                .AnyAsync(d => d.OrgId == request.OrgId &&
                               d.DepartmentName == department.DepartmentName &&
                               d.DepartmentId != request.DepartmentId &&
                               d.IsActive,
                          cancellationToken);

            if (duplicate)
                throw new InvalidOperationException("Cannot reactivate: a department with this name already exists and is active.");
        }

        department.IsActive = request.IsActive;
        department.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
    }
}
