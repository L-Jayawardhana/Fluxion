using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Fluxion.Persistence.Migrations;

public partial class AddExternalPartsCostToMaintenanceLog : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<decimal>(
            name: "ExternalPartsCost",
            table: "MaintenanceLogs",
            type: "decimal(10,2)",
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "ExternalPartsCost",
            table: "MaintenanceLogs");
    }
}
