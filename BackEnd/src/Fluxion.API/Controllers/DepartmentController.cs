using Fluxion.Application.Features.Departments;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Fluxion.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DepartmentController : ControllerBase
{
    private readonly IMediator _mediator;

    public DepartmentController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>Gets all departments for the specified organisation.</summary>
    [HttpGet]
    [Authorize(Roles = "admin,owner")]
    public async Task<IActionResult> GetAll([FromQuery] int orgId)
    {
        if (orgId <= 0)
            return BadRequest(new { message = "A valid orgId is required." });

        var result = await _mediator.Send(new GetDepartmentsQuery(orgId));
        return Ok(result);
    }

    /// <summary>Gets a single department by id, scoped to the given organisation.</summary>
    [HttpGet("{id:int}")]
    [Authorize(Roles = "user,admin,owner")]
    public async Task<IActionResult> GetById(int id, [FromQuery] int orgId)
    {
        if (orgId <= 0)
            return BadRequest(new { message = "A valid orgId is required." });

        var result = await _mediator.Send(new GetDepartmentByIdQuery(id, orgId));

        if (result is null)
            return NotFound(new { message = "Department not found." });

        return Ok(result);
    }

    /// <summary>Creates a new department.</summary>
    [HttpPost]
    [Authorize(Roles = "admin,owner")]
    public async Task<IActionResult> Create([FromBody] CreateDepartmentCommand command)
    {
        try
        {
            var result = await _mediator.Send(command);
            return CreatedAtAction(nameof(GetById),
                new { id = result.DepartmentId, orgId = result.OrgId },
                result);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    /// <summary>Updates an existing department's name and description.</summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "admin,owner")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateDepartmentCommand command)
    {
        if (id != command.DepartmentId)
            return BadRequest(new { message = "ID mismatch." });

        try
        {
            await _mediator.Send(command);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    /// <summary>Activates or deactivates a department (soft delete pattern).</summary>
    [HttpPatch("{id:int}/toggle")]
    [Authorize(Roles = "admin,owner")]
    public async Task<IActionResult> Toggle(int id, [FromBody] ToggleDepartmentCommand command)
    {
        if (id != command.DepartmentId)
            return BadRequest(new { message = "ID mismatch." });

        try
        {
            await _mediator.Send(command);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}
