using Fluxion.Application.Features.Authentication.Login;
using Fluxion.Application.Features.Authentication.Register;
using Fluxion.Application.Features.Authentication.RegisterSystemAdmin;
using Fluxion.Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Fluxion.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IEmailService _emailService;

    public AuthController(IMediator mediator, IEmailService emailService)
    {
        _mediator = mediator;
        _emailService = emailService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginCommand command)
    {
        try
        {
            var result = await _mediator.Send(command);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterCommand command)
    {
        try
        {
            var result = await _mediator.Send(command);
            return CreatedAtAction(nameof(Register), new { id = result.UserId }, result);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpPost("register-system-admin")]
    public async Task<IActionResult> RegisterSystemAdmin([FromBody] RegisterSystemAdminCommand command)
    {
        try
        {
            var result = await _mediator.Send(command);
            return CreatedAtAction(nameof(RegisterSystemAdmin), new { id = result.UserId }, result);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }


    [HttpPost("google")]
    public async Task<IActionResult> GoogleLogin([FromBody] Application.Features.Authentication.GoogleLogin.GoogleLoginCommand command)
    {
        try
        {
            var result = await _mediator.Send(command);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            var msg = ex.Message + (ex.InnerException != null ? " | " + ex.InnerException.Message : "");
            Console.WriteLine("GOOGLE LOGIN ERROR: " + msg);
            Console.WriteLine(ex.StackTrace);
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Server Error: " + msg });
        }
    }

    [HttpPost("send-verification-code")]
    public async Task<IActionResult> SendVerificationCode([FromBody] Application.Features.Authentication.Verification.SendVerificationCodeCommand command)
    {
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    [HttpPost("verify-code")]
    public async Task<IActionResult> VerifyCode([FromBody] Application.Features.Authentication.Verification.VerifyCodeCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.IsValid) return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("send-welcome-email")]
    public async Task<IActionResult> SendWelcomeEmail([FromBody] Application.Features.Authentication.Welcome.SendWelcomeEmailCommand command)
    {
        await _mediator.Send(command);
        return Ok(new { message = "Welcome email sent." });
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] Application.Features.Authentication.ForgotPassword.ForgotPasswordCommand command)
    {
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] Application.Features.Authentication.ForgotPassword.ResetPasswordCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.Success) return BadRequest(new { message = result.Message });
        return Ok(result);
    }

    [HttpPost("verify-reset-code")]
    public async Task<IActionResult> VerifyResetCode([FromBody] Application.Features.Authentication.ForgotPassword.VerifyResetCodeCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.IsValid) return BadRequest(new { message = result.Message });
        return Ok(result);
    }

    [HttpPost("change-password")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] Application.Features.Authentication.ChangePassword.ChangePasswordRequestDto request, [FromServices] ICurrentUserService currentUserService)
    {
        if (currentUserService.UserId == null)
            return Unauthorized();

        try
        {
            var command = new Application.Features.Authentication.ChangePassword.ChangePasswordCommand(
                currentUserService.UserId.Value, request.CurrentPassword, request.NewPassword);
                
            await _mediator.Send(command);
            return Ok(new { message = "Password updated successfully." });
        }
        catch (UnauthorizedAccessException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
