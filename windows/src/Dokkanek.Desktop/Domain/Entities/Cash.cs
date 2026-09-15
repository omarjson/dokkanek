using System;
using System.ComponentModel.DataAnnotations;

namespace Dokkanek.Desktop.Domain.Entities
{
    /// <summary>
    /// Mirrors Prisma model Expense. Float amount maps to decimal.
    /// </summary>
    public class Expense
    {
        [Key]
        [MaxLength(32)]
        public string Id { get; set; }

        /// <summary>Mirrors branchId. Null means no branch.</summary>
        [MaxLength(32)]
        public string BranchId { get; set; }

        [Required]
        [MaxLength(128)]
        public string Title { get; set; }

        public decimal Amount { get; set; }

        public DateTime Date { get; set; }

        [MaxLength(1024)]
        public string Note { get; set; }
    }

    /// <summary>
    /// Mirrors Prisma model CashShift. Float opening/closing map to decimal.
    /// </summary>
    public class CashShift
    {
        [Key]
        [MaxLength(32)]
        public string Id { get; set; }

        /// <summary>Mirrors branchId. Null means no branch.</summary>
        [MaxLength(32)]
        public string BranchId { get; set; }

        /// <summary>Mirrors userId. Null means unknown user.</summary>
        [MaxLength(32)]
        public string UserId { get; set; }

        public decimal Opening { get; set; }

        /// <summary>Mirrors closing. Null while the shift is open.</summary>
        public decimal? Closing { get; set; }

        /// <summary>Mirrors openedAt.</summary>
        public DateTime OpenedAt { get; set; }

        /// <summary>Mirrors closedAt. Null while the shift is open.</summary>
        public DateTime? ClosedAt { get; set; }

        [MaxLength(32)]
        public string Status { get; set; }
    }
}
