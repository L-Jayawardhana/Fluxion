using Fluxion.Application.Interfaces;
using Fluxion.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Fluxion.Application.Features.Users;

public class UpdateUserHandler : IRequestHandler<UpdateUserCommand>
{
    private readonly IApplicationDbContext _context;

    public UpdateUserHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(UpdateUserCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .FindAsync(new object[] { request.UserId }, cancellationToken);

        if (user == null)
            throw new Exception("User not found");

        if (Enum.TryParse<UserRole>(request.Role, true, out var role))
        {
            user.Role = role;
        }

        user.FullName = request.FullName;
        user.Email = request.Email;
        user.IsActive = request.IsActive;
        user.OrgId = request.OrgId;

        await _context.SaveChangesAsync(cancellationToken);
    }
}
