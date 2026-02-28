using MediatR;

namespace Fluxion.Application.Features.Authentication.Verification;

public record SendVerificationCodeCommand(string Email) : IRequest<SendVerificationCodeResponse>;

public record SendVerificationCodeResponse(bool Success, string Message);
