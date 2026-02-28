using Fluxion.Application.Interfaces;
using Fluxion.Domain.Entities;
using Fluxion.Domain.Enums;
using Google.Apis.Auth;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Fluxion.Application.Features.Authentication.GoogleLogin;

public class GoogleLoginHandler : IRequestHandler<GoogleLoginCommand, GoogleLoginResponse>
{
    private readonly IApplicationDbContext _context;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IConfiguration _configuration;

    public GoogleLoginHandler(
        IApplicationDbContext context,
        IJwtTokenService jwtTokenService,
        IConfiguration configuration)
    {
        _context = context;
        _jwtTokenService = jwtTokenService;
        _configuration = configuration;
    }

    public async Task<GoogleLoginResponse> Handle(GoogleLoginCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.IdToken))
        {
            throw new UnauthorizedAccessException("Google sign-in failed. Missing credential token.");
        }

        // Verify the Google ID token
        var clientId = _configuration["GoogleAuth:ClientId"];
        if (string.IsNullOrWhiteSpace(clientId))
        {
            throw new InvalidOperationException("Google sign-in is not configured on the server.");
        }

        var settings = new GoogleJsonWebSignature.ValidationSettings
        {
            Audience = new[] { clientId }
        };

        GoogleJsonWebSignature.Payload payload;
        try
        {
            payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken, settings);
        }
        catch (InvalidJwtException)
        {
            throw new UnauthorizedAccessException("Invalid or expired Google token.");
        }

        if (!string.IsNullOrWhiteSpace(payload.Email) && payload.EmailVerified == false)
        {
            throw new UnauthorizedAccessException("Google account email is not verified.");
        }

        if (string.IsNullOrWhiteSpace(payload.Email))
        {
            throw new UnauthorizedAccessException("Google account did not provide an email address.");
        }

        // Check if user already exists
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == payload.Email, cancellationToken);

        bool isNewUser = false;

        if (user is null)
        {
            // Create new user from Google profile
            isNewUser = true;
            user = new User
            {
                FullName = payload.Name ?? $"{payload.GivenName} {payload.FamilyName}",
                Email = payload.Email,
                PasswordHash = "", // No password for Google users
                Role = UserRole.user,
                MustChangePassword = false,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync(cancellationToken);
        }
        else
        {
            // Update last login
            user.LastLoginAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);
        }

        var token = _jwtTokenService.GenerateToken(user);

        return new GoogleLoginResponse(
            UserId: user.UserId,
            FullName: user.FullName,
            Email: user.Email,
            Role: user.Role.ToString(),
            Token: token,
            IsNewUser: isNewUser
        );
    }
}
