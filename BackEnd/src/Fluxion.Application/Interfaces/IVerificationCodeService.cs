namespace Fluxion.Application.Interfaces;

public interface IVerificationCodeService
{
    string GenerateCode(string email);
    bool ValidateCode(string email, string code);
}
