using Fluxion.Application.Features.Users;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Fluxion.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly IMediator _mediator;

    public UserController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? orgId)
    {
        var result = await _mediator.Send(new GetAllUsersQuery(orgId));
        return Ok(result);
    }
}
