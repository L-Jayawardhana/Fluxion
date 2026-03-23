using MediatR;

namespace Fluxion.Application.Features.Departments;

public record GetDepartmentByIdQuery(int DepartmentId, int OrgId) : IRequest<DepartmentDto?>;
