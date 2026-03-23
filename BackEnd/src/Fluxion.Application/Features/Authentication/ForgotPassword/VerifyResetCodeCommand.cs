using Fluxion.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Fluxion.Application.Features.Authentication.ForgotPassword;

public record VerifyResetCodeCommand(string Email, string Code) : IRequest<VerifyResetCodeResponse>;

public record VerifyResetCodeResponse(bool IsValid, string Message);

public class VerifyResetCodeHandler : IRequestHandler<VerifyResetCodeCommand, VerifyResetCodeResponse>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;

    public VerifyResetCodeHandler(
        IApplicationDbContext context,
        IPasswordHasher passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    public async Task<VerifyResetCodeResponse> Handle(VerifyResetCodeCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken);

        if (user is null)
        {
            return new VerifyResetCodeResponse(false, "Invalid or expired verification code.");
        }

        if (string.IsNullOrEmpty(user.ResetPasswordToken) ||
            user.ResetPasswordTokenExpiresAt == null ||
            DateTime.UtcNow > user.ResetPasswordTokenExpiresAt)
        {
            return new VerifyResetCodeResponse(false, "Invalid or expired verification code.");
        }

        if (!_passwordHasher.Verify(request.Code, user.ResetPasswordToken))
        {
            return new VerifyResetCodeResponse(false, "Invalid or expired verification code.");
        }

        return new VerifyResetCodeResponse(true, "Verification code is valid.");
    }
}
