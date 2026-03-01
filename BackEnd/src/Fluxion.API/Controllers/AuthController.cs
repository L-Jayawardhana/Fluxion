using Fluxion.Application.Features.Authentication.Login;
using Fluxion.Application.Features.Authentication.Register;
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

    // ── Temporary test endpoint — remove after testing ──
    [HttpGet("test-email")]
    public async Task<IActionResult> TestEmail()
    {
        await _emailService.SendEmailAsync(
            "puliththewmika@gmail.com",
            "Fluxion — Test Email ✅",
            @"<div style='font-family:sans-serif;padding:24px;'>
                <h2 style='color:#C84B2F;'>Hello from Fluxion! 🚀</h2>
                <p>If you're reading this, the email service is working correctly.</p>
                <p style='color:#8A9BAD;font-size:12px;'>Sent via Gmail SMTP</p>
              </div>"
        );
        return Ok(new { message = "Test email sent to puliththewmika@gmail.com" });
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
}
