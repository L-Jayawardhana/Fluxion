using MediatR;

namespace Fluxion.Application.Features.Users;

public record UpdateUserCommand(
    int UserId,
    int? OrgId,
    string FullName,
    string Email,
    string Role, // Using string since frontend will pass string
    bool IsActive
) : IRequest;
