using Fluxion.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Fluxion.Application.Features.Authentication.ForgotPassword;

public class ResetPasswordHandler : IRequestHandler<ResetPasswordCommand, ResetPasswordResponse>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;

    public ResetPasswordHandler(
        IApplicationDbContext context,
        IPasswordHasher passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    public async Task<ResetPasswordResponse> Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken);

        if (user is null)
        {
            return new ResetPasswordResponse(false, "No account found with this email address.");
        }

        // Validate the reset code against the DB-stored hashed token
        if (string.IsNullOrEmpty(user.ResetPasswordToken) ||
            user.ResetPasswordTokenExpiresAt == null ||
            DateTime.UtcNow > user.ResetPasswordTokenExpiresAt)
        {
            return new ResetPasswordResponse(false, "Invalid or expired verification code.");
        }

        if (!_passwordHasher.Verify(request.Code, user.ResetPasswordToken))
        {
            return new ResetPasswordResponse(false, "Invalid or expired verification code.");
        }

        // Update the password and clear the reset token
        user.PasswordHash = _passwordHasher.Hash(request.NewPassword);
        user.MustChangePassword = false;
        user.ResetPasswordToken = null;
        user.ResetPasswordTokenExpiresAt = null;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return new ResetPasswordResponse(true, "Password has been reset successfully.");
    }
}
