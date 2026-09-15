using System;
using System.ComponentModel.DataAnnotations;

namespace Dokkanek.Desktop.Domain.Entities
{
    /// <summary>Mirrors Prisma model Category.</summary>
    public class Category
    {
        [Key]
        [MaxLength(32)]
        public string Id { get; set; }

        [Required]
        [MaxLength(128)]
        public string Name { get; set; }
    }

    /// <summary>
    /// Mirrors Prisma model Product.
    /// All Prisma Float money/qty fields map to decimal to avoid floating-point errors.
    /// </summary>
    public class Product
    {
        [Key]
        [MaxLength(32)]
        public string Id { get; set; }

        [Required]
        [MaxLength(64)]
        public string Sku { get; set; }

        [Required]
        [MaxLength(256)]
        public string Name { get; set; }

        /// <summary>Mirrors categoryId. Null means uncategorized.</summary>
        [MaxLength(32)]
        public string CategoryId { get; set; }

        /// <summary>Mirrors costPrice.</summary>
        public decimal CostPrice { get; set; }

        /// <summary>Mirrors costUsd.</summary>
        public decimal CostUsd { get; set; }

        /// <summary>Mirrors salePrice.</summary>
        public decimal SalePrice { get; set; }

        /// <summary>Mirrors quantity (decimal, not double).</summary>
        public decimal Quantity { get; set; }

        /// <summary>Mirrors warehouseId. Null means unassigned.</summary>
        [MaxLength(32)]
        public string WarehouseId { get; set; }

        [MaxLength(64)]
        public string Barcode { get; set; }

        /// <summary>Mirrors isFavorite.</summary>
        public bool IsFavorite { get; set; }

        /// <summary>Mirrors minQuantity.</summary>
        public decimal MinQuantity { get; set; }

        public bool Active { get; set; }

        /// <summary>Mirrors legacyNo.</summary>
        [MaxLength(64)]
        public string LegacyNo { get; set; }

        /// <summary>Mirrors createdAt.</summary>
        public DateTime CreatedAt { get; set; }

        /// <summary>Mirrors updatedAt.</summary>
        public DateTime UpdatedAt { get; set; }
    }
}
