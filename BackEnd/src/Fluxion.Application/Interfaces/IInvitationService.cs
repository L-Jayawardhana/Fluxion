namespace Fluxion.Application.Interfaces;

public interface IInvitationService
{
    /// <summary>
    /// Generates a unique invitation token.
    /// </summary>
    string GenerateInvitationToken();

    /// <summary>
    /// Sends an invitation email to the employee with an acceptance link.
    /// </summary>
    Task SendInvitationEmailAsync(string toEmail, string employeeName, string invitationToken, string temporaryPassword);
}
