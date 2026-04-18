using MediatR;

namespace Fluxion.Application.Features.Authentication.ChangePassword;

public record ChangePasswordCommand(int UserId, string CurrentPassword, string NewPassword) : IRequest<bool>;

public record ChangePasswordRequestDto(string CurrentPassword, string NewPassword);
