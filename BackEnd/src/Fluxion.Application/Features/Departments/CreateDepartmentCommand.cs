using MediatR;

namespace Fluxion.Application.Features.Departments;

public record CreateDepartmentCommand(
    int OrgId,
    string Name,
    string? Description
) : IRequest<DepartmentDto>;
