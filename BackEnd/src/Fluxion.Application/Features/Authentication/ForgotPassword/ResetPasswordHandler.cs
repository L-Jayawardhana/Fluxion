using Fluxion.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Fluxion.Application.Features.Authentication.ForgotPassword;

public class ResetPasswordHandler : IRequestHandler<ResetPasswordCommand, ResetPasswordResponse>
{
    private readonly IApplicationDbContext _context;
    private readonly IVerificationCodeService _codeService;
    private readonly IPasswordHasher _passwordHasher;

    public ResetPasswordHandler(
        IApplicationDbContext context,
        IVerificationCodeService codeService,
        IPasswordHasher passwordHasher)
    {
        _context = context;
        _codeService = codeService;
        _passwordHasher = passwordHasher;
    }

    public async Task<ResetPasswordResponse> Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
    {
        // Validate the verification code
        var isValid = _codeService.ValidateCode(request.Email, request.Code);
        if (!isValid)
        {
            return new ResetPasswordResponse(false, "Invalid or expired verification code.");
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken);

        if (user is null)
        {
            return new ResetPasswordResponse(false, "No account found with this email address.");
        }

        // Update the password
        user.PasswordHash = _passwordHasher.Hash(request.NewPassword);
        user.MustChangePassword = false;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return new ResetPasswordResponse(true, "Password has been reset successfully.");
    }
}
