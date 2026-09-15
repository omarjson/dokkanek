using System;
using System.ComponentModel.DataAnnotations;

namespace Dokkanek.Desktop.Domain.Entities
{
    /// <summary>
    /// Mirrors Prisma model Purchase. Float total/paid map to decimal.
    /// </summary>
    public class Purchase
    {
        [Key]
        [MaxLength(32)]
        public string Id { get; set; }

        [Required]
        [MaxLength(64)]
        public string No { get; set; }

        /// <summary>Mirrors supplierId. Null means no supplier.</summary>
        [MaxLength(32)]
        public string SupplierId { get; set; }

        /// <summary>Mirrors branchId. Null means no branch.</summary>
        [MaxLength(32)]
        public string BranchId { get; set; }

        public decimal Total { get; set; }

        public decimal Paid { get; set; }

        /// <summary>mirrors status.</summary>
        [MaxLength(32)]
        public string Status { get; set; }

        public DateTime Date { get; set; }
    }

    /// <summary>Mirrors Prisma model PurchaseItem. Float qty/price map to decimal.</summary>
    public class PurchaseItem
    {
        [Key]
        [MaxLength(32)]
        public string Id { get; set; }

        [Required]
        [MaxLength(32)]
        public string PurchaseId { get; set; }

        [Required]
        [MaxLength(32)]
        public string ProductId { get; set; }

        public decimal Qty { get; set; }

        public decimal Price { get; set; }
    }

    /// <summary>
    /// Mirrors Prisma model Sale. Float subtotal/discount/total/paid map to decimal.
    /// </summary>
    public class Sale
    {
        [Key]
        [MaxLength(32)]
        public string Id { get; set; }

        [Required]
        [MaxLength(64)]
        public string No { get; set; }

        /// <summary>Mirrors branchId. Null means no branch.</summary>
        [MaxLength(32)]
        public string BranchId { get; set; }

        /// <summary>Mirrors customerId. Null means walk-in sale.</summary>
        [MaxLength(32)]
        public string CustomerId { get; set; }

        /// <summary>Mirrors cashierId. Null means unknown cashier.</summary>
        [MaxLength(32)]
        public string CashierId { get; set; }

        /// <summary>Status code, see <see cref="Domain.SaleStatuses"/>.</summary>
        [MaxLength(32)]
        public string Status { get; set; }

        /// <summary>Method code, see <see cref="Domain.PayMethods"/>. Mirrors payMethod.</summary>
        [MaxLength(32)]
        public string PayMethod { get; set; }

        public decimal Subtotal { get; set; }

        public decimal Discount { get; set; }

        public decimal Total { get; set; }

        public decimal Paid { get; set; }

        /// <summary>Mirrors payRef.</summary>
        [MaxLength(128)]
        public string PayRef { get; set; }

        public DateTime Date { get; set; }
    }

    /// <summary>Mirrors Prisma model SaleItem. Float qty/price map to decimal.</summary>
    public class SaleItem
    {
        [Key]
        [MaxLength(32)]
        public string Id { get; set; }

        [Required]
        [MaxLength(32)]
        public string SaleId { get; set; }

        [Required]
        [MaxLength(32)]
        public string ProductId { get; set; }

        public decimal Qty { get; set; }

        public decimal Price { get; set; }
    }

    /// <summary>
    /// Mirrors Prisma model Payment. Float amount maps to decimal.
    /// </summary>
    public class Payment
    {
        [Key]
        [MaxLength(32)]
        public string Id { get; set; }

        /// <summary>Mirrors saleId. Null means a standalone customer/supplier payment.</summary>
        [MaxLength(32)]
        public string SaleId { get; set; }

        /// <summary>Mirrors customerId.</summary>
        [MaxLength(32)]
        public string CustomerId { get; set; }

        /// <summary>Mirrors supplierId.</summary>
        [MaxLength(32)]
        public string SupplierId { get; set; }

        public decimal Amount { get; set; }

        /// <summary>Method code, see <see cref="Domain.PayMethods"/>.</summary>
        [MaxLength(32)]
        public string Method { get; set; }

        public DateTime Date { get; set; }

        [MaxLength(1024)]
        public string Note { get; set; }
    }

    /// <summary>Mirrors Prisma model Return. Float qty maps to decimal.</summary>
    public class Return
    {
        [Key]
        [MaxLength(32)]
        public string Id { get; set; }

        /// <summary>Mirrors saleId. Null means sale unknown.</summary>
        [MaxLength(32)]
        public string SaleId { get; set; }

        /// <summary>Mirrors productId. Null means product unknown.</summary>
        [MaxLength(32)]
        public string ProductId { get; set; }

        public decimal Qty { get; set; }

        [MaxLength(1024)]
        public string Reason { get; set; }

        public DateTime Date { get; set; }
    }

    /// <summary>Mirrors Prisma model Damage. Float qty maps to decimal.</summary>
    public class Damage
    {
        [Key]
        [MaxLength(32)]
        public string Id { get; set; }

        /// <summary>Mirrors productId. Null means product unknown.</summary>
        [MaxLength(32)]
        public string ProductId { get; set; }

        public decimal Qty { get; set; }

        [MaxLength(1024)]
        public string Reason { get; set; }

        public DateTime Date { get; set; }
    }

    /// <summary>Mirrors Prisma model StockMove. Float qty maps to decimal.</summary>
    public class StockMove
    {
        [Key]
        [MaxLength(32)]
        public string Id { get; set; }

        [Required]
        [MaxLength(32)]
        public string ProductId { get; set; }

        public decimal Qty { get; set; }

        /// <summary>Mirrors type.</summary>
        [MaxLength(32)]
        public string Type { get; set; }

        [MaxLength(1024)]
        public string Note { get; set; }

        public DateTime Date { get; set; }

        /// <summary>Mirrors userId. Null means system move.</summary>
        [MaxLength(32)]
        public string UserId { get; set; }
    }

    /// <summary>Mirrors Prisma model Stocktake.</summary>
    public class Stocktake
    {
        [Key]
        [MaxLength(32)]
        public string Id { get; set; }

        [Required]
        [MaxLength(64)]
        public string No { get; set; }

        /// <summary>Mirrors branchId. Null means no branch.</summary>
        [MaxLength(32)]
        public string BranchId { get; set; }

        [MaxLength(1024)]
        public string Note { get; set; }

        [MaxLength(32)]
        public string Status { get; set; }

        /// <summary>Mirrors createdAt.</summary>
        public DateTime CreatedAt { get; set; }

        /// <summary>Mirrors closedAt. Null while the stocktake is open.</summary>
        public DateTime? ClosedAt { get; set; }
    }

    /// <summary>
    /// Mirrors Prisma model StocktakeItem. Float systemQty/countedQty map to decimal.
    /// </summary>
    public class StocktakeItem
    {
        [Key]
        [MaxLength(32)]
        public string Id { get; set; }

        [Required]
        [MaxLength(32)]
        public string StocktakeId { get; set; }

        [Required]
        [MaxLength(32)]
        public string ProductId { get; set; }

        /// <summary>Mirrors systemQty.</summary>
        public decimal SystemQty { get; set; }

        /// <summary>Mirrors countedQty.</summary>
        public decimal CountedQty { get; set; }
    }
}
