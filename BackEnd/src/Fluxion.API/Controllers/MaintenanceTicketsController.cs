using Fluxion.Application.Features.MaintenanceTickets;
using Fluxion.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Fluxion.API.Controllers;

[ApiController]
[Route("api/maintenance-tickets")]
[Authorize]
public class MaintenanceTicketsController : ControllerBase
{
    private readonly IMediator _mediator;

    public MaintenanceTicketsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    [Authorize(Roles = "user,owner,admin")]
    public async Task<IActionResult> CreateTicket([FromBody] CreateTicketRequest request)
    {
        var currentUserIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;

        if (!int.TryParse(currentUserIdStr, out int userId))
        {
            return Unauthorized(new { message = "Invalid token claims." });
        }

        try
        {
            var command = new CreateMaintenanceTicketCommand(
                request.AssetId,
                request.OrgId,
                userId,
                request.Title,
                request.Description,
                request.Priority
            );

            var result = await _mediator.Send(command);

            return CreatedAtAction(nameof(CreateTicket), new { id = result.TicketId }, result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
    [HttpGet]
    [Authorize] // All authenticated roles allowed
    public async Task<IActionResult> GetTickets([FromQuery] GetMaintenanceTicketsQuery query)
    {
        var result = await _mediator.Send(query);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }
    [HttpPatch("{id:int}/assign")]
    [Authorize(Roles = "owner,admin")]
    public async Task<IActionResult> AssignTicket(int id, [FromBody] AssignTicketRequest request)
    {
        try
        {
            var result = await _mediator.Send(new AssignMaintenanceTicketCommand(id, request.TechnicianId));
            if (!result) return BadRequest(new { message = "Failed to assign ticket." });
            return Ok(new { message = "Ticket assigned successfully." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}

public record CreateTicketRequest(
    int AssetId, 
    int OrgId, 
    string Title, 
    string Description, 
    TicketPriority Priority
);

public record AssignTicketRequest(int TechnicianId);
