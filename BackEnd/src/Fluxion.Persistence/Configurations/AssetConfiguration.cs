using Fluxion.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Fluxion.Persistence.Configurations;

public class AssetConfiguration : IEntityTypeConfiguration<Asset>
{
    public void Configure(EntityTypeBuilder<Asset> builder)
    {
        builder.HasKey(a => a.AssetId);

        builder.Property(a => a.AssetName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(a => a.AssetType)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(a => a.AssetTag)
            .HasMaxLength(50);

        builder.Property(a => a.SerialNumber)
            .HasMaxLength(100);

        builder.Property(a => a.Cost)
            .HasColumnType("decimal(10,2)");

        builder.Property(a => a.QrCode)
            .HasMaxLength(100);

        builder.Property(a => a.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.Property(a => a.OrgId)
            .IsRequired();

        builder.Property(a => a.CreatedBy)
            .IsRequired();

        builder.Property(a => a.CreatedAt)
            .IsRequired();

        builder.Property(a => a.UpdatedAt)
            .IsRequired();

        // Relationships
        builder.HasOne(a => a.Organization)
            .WithMany(o => o.Assets)
            .HasForeignKey(a => a.OrgId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.Department)
            .WithMany()
            .HasForeignKey(a => a.DepartmentId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(a => a.Assignments)
            .WithOne(aa => aa.Asset)
            .HasForeignKey(aa => aa.AssetId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.ToTable("Assets");
    }
}
