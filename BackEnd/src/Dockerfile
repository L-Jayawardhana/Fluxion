# Industry-quality Dockerfile for .NET 8 Web API
# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy NuGet.Config first to override any Windows-specific settings
COPY NuGet.Config ./

# Copy all project files for restore
COPY ["Fluxion.API/Fluxion.API.csproj", "Fluxion.API/"]
COPY ["Fluxion.Application/Fluxion.Application.csproj", "Fluxion.Application/"]
COPY ["Fluxion.Domain/Fluxion.Domain.csproj", "Fluxion.Domain/"]
COPY ["Fluxion.Infrastructure/Fluxion.Infrastructure.csproj", "Fluxion.Infrastructure/"]
COPY ["Fluxion.Persistence/Fluxion.Persistence.csproj", "Fluxion.Persistence/"]

# Clear any existing NuGet cache and restore packages
RUN dotnet nuget locals all --clear
RUN dotnet restore "Fluxion.API/Fluxion.API.csproj"

# Copy everything else and build
COPY . .
WORKDIR "/src/Fluxion.API"

# Clean obj and bin folders to remove any Windows-specific cache
RUN find /src -name "obj" -type d -exec rm -rf {} + || true
RUN find /src -name "bin" -type d -exec rm -rf {} + || true

RUN dotnet publish "Fluxion.API.csproj" -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# ✅ Install curl for HEALTHCHECK (runtime image is where healthcheck runs)
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy published output from build stage
COPY --from=build /app/publish ./

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl --fail http://localhost:80/api/health || exit 1

# Expose port (change if your app uses a different port)
EXPOSE 80

# Set environment variables for production
ENV ASPNETCORE_URLS=http://+:80
ENV ASPNETCORE_ENVIRONMENT=Production

# Start the application
ENTRYPOINT ["dotnet", "Fluxion.API.dll"]