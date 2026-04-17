using Fluxion.Application.Features.Authentication.Register;
using Fluxion.Application.Interfaces;
using Fluxion.Domain.Entities;
using Fluxion.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Fluxion.Application.Features.Users.CreateEmployee;

public class CreateEmployeeCommandHandler : IRequestHandler<CreateEmployeeCommand, RegisterResponse>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IInvitationService _invitationService;
    private readonly ICurrentUserService _currentUserService;

    public CreateEmployeeCommandHandler(
        IApplicationDbContext context,
        IPasswordHasher passwordHasher,
        IInvitationService invitationService,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _invitationService = invitationService;
        _currentUserService = currentUserService;
    }

    public async Task<RegisterResponse> Handle(CreateEmployeeCommand request, CancellationToken cancellationToken)
    {
        // 1. Check if email already exists
        var emailExists = await _context.Users
            .AnyAsync(u => u.Email == request.Email, cancellationToken);
        if (emailExists)
            throw new InvalidOperationException("A user with this email already exists.");

        // 2. Validate OrgId and DepartmentId
        var orgExists = await _context.Organizations
            .AnyAsync(o => o.OrgId == request.OrgId, cancellationToken);
        if (!orgExists)
            throw new InvalidOperationException("The specified organization does not exist.");

        var deptExists = await _context.Departments
            .AnyAsync(d => d.DepartmentId == request.DepartmentId && d.OrgId == request.OrgId, cancellationToken);
        if (!deptExists)
            throw new InvalidOperationException("The specified department does not exist in this organization.");

        // Check user limit based on subscription
        var orgSub = await _context.OrgSubscriptions
            .Include(s => s.Plan)
            .Where(s => s.OrgId == request.OrgId && s.Status == SubscriptionStatus.active)
            .OrderByDescending(s => s.StartedAt)
            .FirstOrDefaultAsync(cancellationToken);
            
        int? maxUsers = orgSub?.MaxUsers ?? orgSub?.Plan?.MaxUsers ?? 5; // Default Free plan limit
        if (maxUsers.HasValue)
        {
            var currentUserCount = await _context.Users.CountAsync(u => u.OrgId == request.OrgId && u.IsActive, cancellationToken);
            if (currentUserCount >= maxUsers.Value)
                throw new InvalidOperationException($"Subscription limit reached. Your plan allows up to {maxUsers.Value} users.");
        }

        // 3. Generate invitation token via Infrastructure service
        var token = _invitationService.GenerateInvitationToken();

        // 4. Validate and parse Role
        if (string.IsNullOrWhiteSpace(request.Role) || 
            !Enum.TryParse<UserRole>(request.Role, true, out var parsedRole) || 
            (parsedRole != UserRole.user && parsedRole != UserRole.technician && parsedRole != UserRole.manager))
        {
            throw new InvalidOperationException("Invalid role specified. Only 'user', 'technician', or 'manager' are allowed.");
        }

        var currentUserRole = _currentUserService.Role?.ToLowerInvariant();
        if (parsedRole == UserRole.manager && currentUserRole != "owner" && currentUserRole != "admin")
        {
            throw new InvalidOperationException("Only owners or admins can add a manager.");
        }

        // 5. Create User with the specified role
        var user = new User
        {
            OrgId = request.OrgId,
            FullName = $"{request.FirstName} {request.LastName}".Trim(),
            Email = request.Email,
            PasswordHash = _passwordHasher.Hash(request.Password),
            Role = parsedRole,
            MustChangePassword = true,
            IsActive = true,
            InvitationAccepted = false,
            InvitationToken = token,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            UserDepartments = new List<UserDepartment>
            {
                new UserDepartment { DepartmentId = request.DepartmentId }
            }
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync(cancellationToken);

        // 6. Send invitation email via Infrastructure service
        await _invitationService.SendInvitationEmailAsync(user.Email, user.FullName, token, request.Password);

        return new RegisterResponse(
            UserId: user.UserId,
            FullName: user.FullName,
            Email: user.Email,
            Role: user.Role.ToString(),
            Token: string.Empty
        );
    }
}
