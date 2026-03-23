using Fluxion.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Fluxion.Infrastructure.Services;

public class InvitationService : IInvitationService
{
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<InvitationService> _logger;

    public InvitationService(
        IEmailService emailService,
        IConfiguration configuration,
        ILogger<InvitationService> logger)
    {
        _emailService = emailService;
        _configuration = configuration;
        _logger = logger;
    }

    public string GenerateInvitationToken()
    {
        return Guid.NewGuid().ToString();
    }

    public async Task SendInvitationEmailAsync(string toEmail, string employeeName, string invitationToken, string temporaryPassword)
    {
        var frontendUrl = _configuration["FrontendUrl"] ?? "https://fluxion-nu.vercel.app/";
        var inviteLink = $"{frontendUrl}/accept-invite?token={invitationToken}";

        var htmlBody = $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;'>
                <div style='text-align: center; margin-bottom: 24px;'>
                    <h1 style='color: #1A1A1A; font-size: 24px; margin: 0;'>Welcome to Fluxion</h1>
                </div>
                <p style='color: #333; font-size: 15px; line-height: 1.6;'>
                    Hello <strong>{employeeName}</strong>,
                </p>
                <p style='color: #555; font-size: 14px; line-height: 1.6;'>
                    You have been invited to join the organisation as an employee.
                    Please click the button below to accept the invitation and activate your account.
                </p>
                <div style='text-align: center; margin: 32px 0;'>
                    <a href='{inviteLink}'
                       style='display: inline-block; background: #2A6FC8; color: white; padding: 12px 32px;
                              border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;'>
                        Accept Invitation
                    </a>
                </div>
                <div style='background: #f9f9f9; padding: 16px; border-radius: 6px; margin: 24px 0;'>
                    <p style='margin: 0; color: #333; font-size: 14px;'><strong>Your Login Details:</strong></p>
                    <p style='margin: 8px 0; color: #555; font-size: 14px;'>Email: <strong>{toEmail}</strong></p>
                    <p style='margin: 0; color: #333; font-size: 14px;'>This is the password that the owner created for you during registration:</p>
                    <p style='margin: 8px 0 0 0; color: #555; font-size: 14px;'>Password: <strong>{temporaryPassword}</strong></p>
                </div>
                <p style='color: #d9534f; font-size: 14px; font-weight: bold; line-height: 1.5;'>
                    Important: Please change this password within 1 week for security reasons.
                </p>
                <p style='color: #888; font-size: 12px; line-height: 1.5;'>
                    If you did not expect this invitation, you can safely ignore this email.
                </p>
                <hr style='border: none; border-top: 1px solid #eee; margin: 24px 0;' />
                <p style='color: #aaa; font-size: 11px; text-align: center;'>
                    Fluxion — Enterprise Asset & Maintenance Management
                </p>
            </div>";

        await _emailService.SendEmailAsync(toEmail, "Fluxion — You've Been Invited!", htmlBody);

        _logger.LogInformation("Invitation email sent to {Email} for employee {Name}.", toEmail, employeeName);
    }
}
