using Fluxion.Application.Interfaces;
using Fluxion.Domain.Entities;
using Fluxion.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Fluxion.Application.Features.Authentication.Register;

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, RegisterResponse>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;

    public RegisterCommandHandler(IApplicationDbContext context, IPasswordHasher passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    public async Task<RegisterResponse> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        // Check if email already exists
        var emailExists = await _context.Users
            .AnyAsync(u => u.Email == request.Email, cancellationToken);

        if (emailExists)
            throw new InvalidOperationException("A user with this email already exists.");

        // Check if organization exists (only if OrgId is provided)
        if (request.OrgId.HasValue)
        {
            var orgExists = await _context.Organizations
                .AnyAsync(o => o.OrgId == request.OrgId.Value, cancellationToken);

            if (!orgExists)
                throw new InvalidOperationException("The specified organization does not exist.");
        }

        var user = new User
        {
            OrgId = request.OrgId,
            FullName = request.FullName,
            Email = request.Email,
            PasswordHash = _passwordHasher.Hash(request.Password),
            Role = UserRole.user,
            MustChangePassword = false,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync(cancellationToken);

        return new RegisterResponse(
            UserId: user.UserId,
            FullName: user.FullName,
            Email: user.Email,
            Role: user.Role.ToString()
        );
    }
}
