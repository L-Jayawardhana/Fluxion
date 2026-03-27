using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Fluxion.Application.DTOs.Common;
using Fluxion.Application.Interfaces;
using Fluxion.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Fluxion.Application.Features.MaintenanceTickets;

public class GetMaintenanceTicketsQueryHandler : IRequestHandler<GetMaintenanceTicketsQuery, Result<PagedResult<MaintenanceTicketSummaryDto>>>
{
    private readonly IMaintenanceTicketRepository _repository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IApplicationDbContext _dbContext;

    public GetMaintenanceTicketsQueryHandler(
        IMaintenanceTicketRepository repository,
        ICurrentUserService currentUserService,
        IApplicationDbContext dbContext)
    {
        _repository = repository;
        _currentUserService = currentUserService;
        _dbContext = dbContext;
    }

    public async Task<Result<PagedResult<MaintenanceTicketSummaryDto>>> Handle(GetMaintenanceTicketsQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        var role = _currentUserService.Role?.ToLower();

        if (userId == null || string.IsNullOrEmpty(role))
        {
            return Result<PagedResult<MaintenanceTicketSummaryDto>>.Failure("Unauthorized access");
        }

        var query = _repository.GetTicketsQuery();

        // 1. Apply role-based scoping
        if (role == "employee" || role == "user")
        {
            query = query.Where(t => t.Asset.Assignments != null && 
                                     t.Asset.Assignments.Any(a => a.UserId == userId.Value && a.ReturnDate == null));
        }
        else if (role == "technician")
        {
            query = query.Where(t => t.AssignedTo == userId.Value);
        }
        else if (role == "manager")
        {
            var userDepartments = await _dbContext.UserDepartments
                .Where(ud => ud.UserId == userId.Value)
                .Select(ud => ud.DepartmentId)
                .ToListAsync(cancellationToken);

            query = query.Where(t => t.Asset.DepartmentId != null && userDepartments.Contains(t.Asset.DepartmentId.Value));
        }
        else if (role == "admin" || role == "owner" || role == "systemadmin")
        {
            // unscoped
        }

        // 2. Apply filters
        if (request.Status.HasValue)
        {
            query = query.Where(t => t.Status == request.Status.Value);
        }

        if (request.Priority.HasValue)
        {
            query = query.Where(t => t.Priority == request.Priority.Value);
        }

        if (request.AssetId.HasValue)
        {
            query = query.Where(t => t.AssetId == request.AssetId.Value);
        }

        if (request.DepartmentId.HasValue)
        {
            query = query.Where(t => t.Asset.DepartmentId == request.DepartmentId.Value);
        }

        if (request.TechnicianId.HasValue)
        {
            query = query.Where(t => t.AssignedTo == request.TechnicianId.Value);
        }

        if (request.DateFrom.HasValue)
        {
            query = query.Where(t => t.CreatedAt >= request.DateFrom.Value);
        }

        if (request.DateTo.HasValue)
        {
            query = query.Where(t => t.CreatedAt <= request.DateTo.Value); // If needed, can make it entire day
        }

        if (!string.IsNullOrEmpty(request.Keyword))
        {
            var keyword = request.Keyword.ToLower();
            query = query.Where(t => t.Title.ToLower().Contains(keyword) || t.IssueDescription.ToLower().Contains(keyword));
        }

        // Apply ordering
        query = query.OrderByDescending(t => t.CreatedAt);

        var totalCount = await query.CountAsync(cancellationToken);

        if (totalCount == 0)
        {
            return Result<PagedResult<MaintenanceTicketSummaryDto>>.Success(
                new PagedResult<MaintenanceTicketSummaryDto>(new System.Collections.Generic.List<MaintenanceTicketSummaryDto>(), 0, request.PageNumber, request.PageSize)
            );
        }

        var pagedQuery = query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize);

        // Project and fetch related data
        var pagedList = await (from t in pagedQuery
                               join ru in _dbContext.Users on t.RaisedBy equals ru.UserId into ruGroup
                               from ru in ruGroup.DefaultIfEmpty()
                               join au in _dbContext.Users on t.AssignedTo equals au.UserId into auGroup
                               from au in auGroup.DefaultIfEmpty()
                               select new MaintenanceTicketSummaryDto
                               {
                                   TicketId = t.TicketId,
                                   Title = t.Title,
                                   Priority = t.Priority,
                                   Status = t.Status,
                                   AssetName = t.Asset.AssetName,
                                   ReportedByUserName = ru != null ? ru.FullName : string.Empty,
                                   AssignedTechnicianName = au != null ? au.FullName : null,
                                   CreatedAt = t.CreatedAt,
                                   Cost = null // Fill in if needed, currently leaving null
                               }).ToListAsync(cancellationToken);

        var pagedResult = new PagedResult<MaintenanceTicketSummaryDto>(pagedList, totalCount, request.PageNumber, request.PageSize);
        return Result<PagedResult<MaintenanceTicketSummaryDto>>.Success(pagedResult);
    }
}
