using MediatR;

namespace Fluxion.Application.Features.Departments;

public record GetDepartmentsQuery(int OrgId) : IRequest<List<DepartmentDto>>;

public record DepartmentDto(
    int DepartmentId,
    string DepartmentName,
    string? Description,
    int OrgId,
    bool IsActive,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
