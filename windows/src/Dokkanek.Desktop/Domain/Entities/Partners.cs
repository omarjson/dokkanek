using System.ComponentModel.DataAnnotations;

namespace Dokkanek.Desktop.Domain.Entities
{
    /// <summary>
    /// Mirrors Prisma model Customer.
    /// Prisma Float creditLimit/balance map to decimal.
    /// </summary>
    public class Customer
    {
        [Key]
        [MaxLength(32)]
        public string Id { get; set; }

        [Required]
        [MaxLength(128)]
        public string Name { get; set; }

        [MaxLength(32)]
        public string Phone { get; set; }

        [MaxLength(256)]
        public string Address { get; set; }

        /// <summary>Mirrors creditLimit.</summary>
        public decimal CreditLimit { get; set; }

        /// <summary>Mirrors balance.</summary>
        public decimal Balance { get; set; }
    }

    /// <summary>
    /// Mirrors Prisma model Supplier.
    /// Prisma Float balance maps to decimal.
    /// </summary>
    public class Supplier
    {
        [Key]
        [MaxLength(32)]
        public string Id { get; set; }

        [Required]
        [MaxLength(128)]
        public string Name { get; set; }

        [MaxLength(32)]
        public string Phone { get; set; }

        [MaxLength(256)]
        public string Address { get; set; }

        /// <summary>Mirrors balance.</summary>
        public decimal Balance { get; set; }
    }
}
