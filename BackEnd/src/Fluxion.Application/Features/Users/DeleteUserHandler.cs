using Fluxion.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Fluxion.Application.Features.Users;

public class DeleteUserHandler : IRequestHandler<DeleteUserCommand>
{
    private readonly IApplicationDbContext _context;

    public DeleteUserHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(DeleteUserCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .FindAsync(new object[] { request.UserId }, cancellationToken);

        if (user == null)
            throw new Exception("User not found");

        // Soft delete
        user.IsActive = false;
        
        await _context.SaveChangesAsync(cancellationToken);
    }
}
