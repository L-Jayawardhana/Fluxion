using Fluxion.API.Data;
using Microsoft.AspNetCore.Mvc;

namespace Fluxion.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly FluxionDbContext _context;

    public HealthController(FluxionDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetHealth()
    {
        var response = new
        {
            status = "Healthy",
            timestamp = DateTime.UtcNow,
            database = "Disconnected"
        };

        try
        {
            var canConnect = await _context.Database.CanConnectAsync();
            response = response with { database = canConnect ? "Connected" : "Disconnected" };
        }
        catch (Exception ex)
        {
            response = response with { database = $"Error: {ex.Message}" };
        }

        return Ok(response);
    }
}
