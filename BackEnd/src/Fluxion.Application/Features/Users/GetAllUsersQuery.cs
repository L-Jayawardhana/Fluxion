using MediatR;

namespace Fluxion.Application.Features.Users;

public record GetAllUsersQuery(int? OrgId = null) : IRequest<List<UserDto>>;

public record UserDto(
    int UserId,
    int? OrgId,
    string FullName,
    string Email,
    string Role,
    bool IsActive,
    DateTime? LastLoginAt,
    DateTime CreatedAt,
    string? OrganizationName
);
