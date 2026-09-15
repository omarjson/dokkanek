using System;
using System.ComponentModel.DataAnnotations;

namespace Dokkanek.Desktop.Domain.Entities
{
    /// <summary>Mirrors Prisma model AuditLog.</summary>
    public class AuditLog
    {
        [Key]
        [MaxLength(32)]
        public string Id { get; set; }

        /// <summary>Mirrors userId. Null means system action.</summary>
        [MaxLength(32)]
        public string UserId { get; set; }

        [MaxLength(128)]
        public string Username { get; set; }

        [Required]
        [MaxLength(64)]
        public string Action { get; set; }

        [Required]
        [MaxLength(64)]
        public string Entity { get; set; }

        /// <summary>Mirrors entityId.</summary>
        [MaxLength(32)]
        public string EntityId { get; set; }

        [MaxLength(1024)]
        public string Details { get; set; }

        /// <summary>Mirrors createdAt.</summary>
        public DateTime CreatedAt { get; set; }
    }

    /// <summary>Mirrors Prisma model Notification.</summary>
    public class Notification
    {
        [Key]
        [MaxLength(32)]
        public string Id { get; set; }

        [MaxLength(32)]
        public string Channel { get; set; }

        /// <summary>Recipient. Mirrors "to".</summary>
        [MaxLength(128)]
        public string To { get; set; }

        [MaxLength(128)]
        public string Template { get; set; }

        [MaxLength(2048)]
        public string Body { get; set; }

        [MaxLength(32)]
        public string Status { get; set; }

        [MaxLength(1024)]
        public string Error { get; set; }

        /// <summary>Mirrors relatedType.</summary>
        [MaxLength(64)]
        public string RelatedType { get; set; }

        /// <summary>Mirrors relatedId.</summary>
        [MaxLength(32)]
        public string RelatedId { get; set; }

        /// <summary>Mirrors createdAt.</summary>
        public DateTime CreatedAt { get; set; }

        /// <summary>Mirrors sentAt. Null means not sent yet.</summary>
        public DateTime? SentAt { get; set; }
    }

    /// <summary>
    /// Offline outbox entry for sales created while offline.
    /// Has no Prisma counterpart; it holds the serialized sale until sync succeeds.
    /// </summary>
    public class PendingSale
    {
        [Key]
        [MaxLength(32)]
        public string Id { get; set; }

        /// <summary>Local sale number (mirrors Sale.no).</summary>
        [MaxLength(64)]
        public string No { get; set; }

        /// <summary>Serialized sale payload (JSON).</summary>
        public string PayloadJson { get; set; }

        /// <summary>Outbox status (for example PENDING, SENDING, FAILED).</summary>
        [MaxLength(32)]
        public string Status { get; set; }

        public DateTime CreatedAt { get; set; }

        /// <summary>Last sync error, empty when none.</summary>
        [MaxLength(1024)]
        public string Error { get; set; }
    }
}
