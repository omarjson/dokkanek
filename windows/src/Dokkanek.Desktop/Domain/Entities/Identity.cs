using System;
using System.ComponentModel.DataAnnotations;

namespace Dokkanek.Desktop.Domain.Entities
{
    /// <summary>Mirrors Prisma model User. Scalars only; no navigation logic.</summary>
    public class User
    {
        /// <summary>Primary key (cuid).</summary>
        [Key]
        [MaxLength(32)]
        public string Id { get; set; }

        [Required]
        [MaxLength(128)]
        public string Name { get; set; }

        [Required]
        [MaxLength(64)]
        public string Username { get; set; }

        /// <summary>Mirrors passwordHash.</summary>
        [MaxLength(256)]
        public string PasswordHash { get; set; }

        /// <summary>Role code, see <see cref="Domain.Roles"/>.</summary>
        [MaxLength(32)]
        public string Role { get; set; }

        public bool Active { get; set; }

        /// <summary>Mirrors branchId. Null means no branch assigned.</summary>
        [MaxLength(32)]
        public string BranchId { get; set; }

        /// <summary>Mirrors createdAt.</summary>
        public DateTime CreatedAt { get; set; }
    }

    /// <summary>Mirrors Prisma model Branch.</summary>
    public class Branch
    {
        [Key]
        [MaxLength(32)]
        public string Id { get; set; }

        [Required]
        [MaxLength(128)]
        public string Name { get; set; }

        [MaxLength(128)]
        public string City { get; set; }

        [MaxLength(32)]
        public string Phone { get; set; }
    }

    /// <summary>Mirrors Prisma model Warehouse.</summary>
    public class Warehouse
    {
        [Key]
        [MaxLength(32)]
        public string Id { get; set; }

        [Required]
        [MaxLength(128)]
        public string Name { get; set; }

        /// <summary>Mirrors branchId. Null means unassigned.</summary>
        [MaxLength(32)]
        public string BranchId { get; set; }
    }

    /// <summary>Mirrors Prisma model Setting (key/value store).</summary>
    public class Setting
    {
        /// <summary>
        /// Setting key (for example "mod_stocktake" or "perm_MANAGER_price.edit").
        /// Longer than cuid IDs, so 128 chars.
        /// </summary>
        [Key]
        [MaxLength(128)]
        public string Key { get; set; }

        /// <summary>Mirrors value.</summary>
        public string Value { get; set; }
    }
}
