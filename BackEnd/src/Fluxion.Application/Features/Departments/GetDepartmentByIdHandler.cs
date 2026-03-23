using Fluxion.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Fluxion.Application.Features.Departments;

public class GetDepartmentByIdHandler : IRequestHandler<GetDepartmentByIdQuery, DepartmentDto?>
{
    private readonly IApplicationDbContext _context;

    public GetDepartmentByIdHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DepartmentDto?> Handle(GetDepartmentByIdQuery request, CancellationToken cancellationToken)
    {
        var department = await _context.Departments
            .AsNoTracking()
            .Where(d => d.DepartmentId == request.DepartmentId && d.OrgId == request.OrgId)
            .Select(d => new DepartmentDto(
                d.DepartmentId,
                d.DepartmentName,
                d.Description,
                d.OrgId,
                d.IsActive,
                d.CreatedAt,
                d.UpdatedAt))
            .FirstOrDefaultAsync(cancellationToken);

        return department;
    }
}
