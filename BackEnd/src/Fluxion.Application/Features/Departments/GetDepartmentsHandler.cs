using Fluxion.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Fluxion.Application.Features.Departments;

public class GetDepartmentsHandler : IRequestHandler<GetDepartmentsQuery, List<DepartmentDto>>
{
    private readonly IApplicationDbContext _context;

    public GetDepartmentsHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<DepartmentDto>> Handle(GetDepartmentsQuery request, CancellationToken cancellationToken)
    {
        return await _context.Departments
            .AsNoTracking()
            .Where(d => d.OrgId == request.OrgId)
            .OrderBy(d => d.DepartmentName)
            .Select(d => new DepartmentDto(
                d.DepartmentId,
                d.DepartmentName,
                d.Description,
                d.OrgId,
                d.IsActive,
                d.CreatedAt,
                d.UpdatedAt))
            .ToListAsync(cancellationToken);
    }
}
