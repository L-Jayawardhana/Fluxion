using MediatR;

namespace Fluxion.Application.Features.Departments;

public record ToggleDepartmentCommand(
    int DepartmentId,
    int OrgId,
    bool IsActive
) : IRequest;
