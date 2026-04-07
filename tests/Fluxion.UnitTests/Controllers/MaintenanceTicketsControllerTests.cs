using System.Security.Claims;
using FluentAssertions;
using Fluxion.API.Controllers;
using Fluxion.Application.DTOs.Common;
using Fluxion.Application.Features.MaintenanceTickets;
using Fluxion.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace Fluxion.UnitTests.Controllers;

public class MaintenanceTicketsControllerTests
{
    private readonly Mock<IMediator> _mediator = new();

    private MaintenanceTicketsController CreateController(string? userIdClaim = "101")
    {
        var controller = new MaintenanceTicketsController(_mediator.Object);

        var identity = new ClaimsIdentity();
        if (userIdClaim is not null)
        {
            identity.AddClaim(new Claim(ClaimTypes.NameIdentifier, userIdClaim));
        }

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(identity)
            }
        };

        return controller;
    }

    [Fact]
    public async Task CreateTicket_InvalidTokenClaims_ReturnsUnauthorized()
    {
        var controller = CreateController(userIdClaim: "not-an-int");
        var request = new CreateTicketRequest(1, 1, "Screen issue", "Flickering", TicketPriority.high);

        var result = await controller.CreateTicket(request);

        result.Should().BeOfType<UnauthorizedObjectResult>();
    }

    [Fact]
    public async Task CreateTicket_ValidRequest_ReturnsCreated()
    {
        _mediator
            .Setup(m => m.Send(It.IsAny<CreateMaintenanceTicketCommand>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CreateMaintenanceTicketResult(55));

        var controller = CreateController(userIdClaim: "77");
        var request = new CreateTicketRequest(10, 99, "Keyboard broken", "Keys stuck", TicketPriority.medium);

        var result = await controller.CreateTicket(request);

        var created = result.Should().BeOfType<CreatedAtActionResult>().Subject;
        created.ActionName.Should().Be(nameof(MaintenanceTicketsController.CreateTicket));
        created.RouteValues!["id"].Should().Be(55);

        _mediator.Verify(m => m.Send(
            It.Is<CreateMaintenanceTicketCommand>(c =>
                c.AssetId == 10 &&
                c.OrgId == 99 &&
                c.RaisedBy == 77 &&
                c.Title == "Keyboard broken" &&
                c.Description == "Keys stuck" &&
                c.Priority == TicketPriority.medium),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateTicket_WhenAssetMissing_ReturnsNotFound()
    {
        _mediator
            .Setup(m => m.Send(It.IsAny<CreateMaintenanceTicketCommand>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new KeyNotFoundException("Asset not found"));

        var controller = CreateController();
        var request = new CreateTicketRequest(999, 1, "Issue", "Desc", TicketPriority.low);

        var result = await controller.CreateTicket(request);

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task GetTickets_WhenMediatorReturnsFailure_ReturnsBadRequest()
    {
        _mediator
            .Setup(m => m.Send(It.IsAny<GetMaintenanceTicketsQuery>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result<PagedResult<MaintenanceTicketSummaryDto>>.Failure("Invalid filters"));

        var controller = CreateController();

        var result = await controller.GetTickets(new GetMaintenanceTicketsQuery());

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task AssignTicket_WhenMediatorReturnsTrue_ReturnsOk()
    {
        _mediator
            .Setup(m => m.Send(It.IsAny<AssignMaintenanceTicketCommand>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var controller = CreateController();

        var result = await controller.AssignTicket(15, new AssignTicketRequest(220));

        result.Should().BeOfType<OkObjectResult>();
        _mediator.Verify(m => m.Send(
            It.Is<AssignMaintenanceTicketCommand>(c => c.TicketId == 15 && c.TechnicianId == 220),
            It.IsAny<CancellationToken>()), Times.Once);
    }
}
