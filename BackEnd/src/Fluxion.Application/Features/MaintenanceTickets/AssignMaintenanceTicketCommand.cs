using MediatR;

namespace Fluxion.Application.Features.MaintenanceTickets;

public record AssignMaintenanceTicketCommand(int TicketId, int TechnicianId) : IRequest<bool>;
