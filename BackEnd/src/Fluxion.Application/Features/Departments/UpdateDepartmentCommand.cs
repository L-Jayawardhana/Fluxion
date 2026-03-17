using MediatR;

namespace Fluxion.Application.Features.Departments;

public record UpdateDepartmentCommand(
    int DepartmentId,
    int OrgId,
    string Name,
    string? Description
) : IRequest;
