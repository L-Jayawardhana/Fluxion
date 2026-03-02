using Fluxion.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Fluxion.Application.Features.Users;

public class GetAllUsersHandler : IRequestHandler<GetAllUsersQuery, List<UserDto>>
{
    private readonly IApplicationDbContext _context;

    public GetAllUsersHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<UserDto>> Handle(GetAllUsersQuery request, CancellationToken cancellationToken)
    {
        var usersQuery = _context.Users.AsNoTracking();

        if (request.OrgId.HasValue)
        {
            usersQuery = usersQuery.Where(u => u.OrgId == request.OrgId.Value);
        }

        var users = await usersQuery
            .Select(u => new UserDto(
                u.UserId,
                u.OrgId,
                u.FullName,
                u.Email,
                u.Role.ToString(),
                u.IsActive,
                u.LastLoginAt,
                u.CreatedAt,
                u.Organization != null ? u.Organization.OrgName : null
            ))
            .ToListAsync(cancellationToken);

        return users;
    }
}
