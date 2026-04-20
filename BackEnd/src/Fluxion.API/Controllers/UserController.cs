using Fluxion.Application.Features.Users;
using Fluxion.Application.Features.Users.CreateEmployee;
using Fluxion.Application.Features.Users.AcceptInvite;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Fluxion.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UserController : ControllerBase
{
    private readonly IMediator _mediator;

    public UserController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>Invites (creates) a new employee. Admin/owner/manager only.</summary>
    [HttpPost("employee")]
    [Authorize(Roles = "owner,admin,manager")]
    public async Task<IActionResult> CreateEmployee([FromBody] CreateEmployeeCommand command)
    {
        try
        {
            var result = await _mediator.Send(command);
            return StatusCode(StatusCodes.Status201Created, result);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    /// <summary>Accept invite — public endpoint (no token required).</summary>
    [HttpPost("accept-invite")]
    [AllowAnonymous]
    public async Task<IActionResult> AcceptInvite([FromBody] AcceptInviteCommand command)
    {
        var success = await _mediator.Send(command);
        if (!success) return BadRequest(new { message = "Invalid or expired invitation token." });
        return Ok(new { message = "Invitation accepted successfully." });
    }

    /// <summary>Lists all users. Admin/owner/manager only.</summary>
    [HttpGet]
    [Authorize(Roles = "owner,admin,systemAdmin,manager")]
    public async Task<IActionResult> GetAll([FromQuery] int? orgId)
    {
        var result = await _mediator.Send(new GetAllUsersQuery(orgId));
        return Ok(result);
    }

    /// <summary>Updates a user record. Admin/owner/manager only.</summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "owner,admin,manager")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUserCommand command)
    {
        if (id != command.UserId) return BadRequest("ID mismatch");
        await _mediator.Send(command);
        return NoContent();
    }

    /// <summary>Deletes (or deactivates) a user. Owner/admin only.</summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "owner,admin")]
    public async Task<IActionResult> Delete(int id)
    {
        await _mediator.Send(new DeleteUserCommand(id));
        return NoContent();
    }
}
