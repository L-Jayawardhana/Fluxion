using Fluxion.Application.Interfaces;
using System.Collections.Concurrent;

namespace Fluxion.Infrastructure.Services;

public class InMemoryVerificationCodeService : IVerificationCodeService
{
    private readonly ConcurrentDictionary<string, (string Code, DateTime Expiry)> _codes = new();

    public string GenerateCode(string email)
    {
        var code = Random.Shared.Next(100000, 999999).ToString();
        var expiry = DateTime.UtcNow.AddMinutes(10);
        _codes[email.ToLowerInvariant()] = (code, expiry);
        return code;
    }

    public bool ValidateCode(string email, string code)
    {
        var key = email.ToLowerInvariant();
        if (!_codes.TryGetValue(key, out var entry)) return false;
        if (DateTime.UtcNow > entry.Expiry) { _codes.TryRemove(key, out _); return false; }
        if (entry.Code != code) return false;
        _codes.TryRemove(key, out _); // one-time use
        return true;
    }
}
