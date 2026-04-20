using Fluxion.Application.Features.Authentication.Register;
using MediatR;

namespace Fluxion.Application.Features.Users.CreateEmployee;

public record CreateEmployeeCommand(
    string FirstName,
    string LastName,
    string Email,
    string Password,
    int OrgId,
    int DepartmentId,
    string Role = "user"
) : IRequest<RegisterResponse>;
