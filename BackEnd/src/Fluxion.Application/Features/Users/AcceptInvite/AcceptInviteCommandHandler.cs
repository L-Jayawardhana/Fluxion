using Fluxion.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Fluxion.Application.Features.Users.AcceptInvite;

public class AcceptInviteCommandHandler : IRequestHandler<AcceptInviteCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public AcceptInviteCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(AcceptInviteCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.InvitationToken == request.Token, cancellationToken);
            
        if (user == null)
            return false;

        user.InvitationAccepted = true;
        user.InvitationToken = null;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
