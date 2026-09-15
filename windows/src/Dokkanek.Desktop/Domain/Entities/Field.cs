using System;
using System.ComponentModel.DataAnnotations;

namespace Dokkanek.Desktop.Domain.Entities
{
    /// <summary>
    /// Mirrors Prisma model CourierTask. Float codAmount/collected map to decimal.
    /// </summary>
    public class CourierTask
    {
        [Key]
        [MaxLength(32)]
        public string Id { get; set; }

        [Required]
        [MaxLength(32)]
        public string SaleId { get; set; }

        /// <summary>Mirrors courierName.</summary>
        [MaxLength(128)]
        public string CourierName { get; set; }

        [MaxLength(32)]
        public string Status { get; set; }

        /// <summary>Mirrors codAmount.</summary>
        public decimal CodAmount { get; set; }

        public decimal Collected { get; set; }

        public DateTime Date { get; set; }
    }

    /// <summary>
    /// Mirrors Prisma model Employee. Float salary/commissionRate map to decimal.
    /// </summary>
    public class Employee
    {
        [Key]
        [MaxLength(32)]
        public string Id { get; set; }

        [Required]
        [MaxLength(128)]
        public string Name { get; set; }

        [MaxLength(32)]
        public string Phone { get; set; }

        [MaxLength(128)]
        public string Title { get; set; }

        public decimal Salary { get; set; }

        /// <summary>Mirrors commissionRate.</summary>
        public decimal CommissionRate { get; set; }

        public bool Active { get; set; }
    }

    /// <summary>Mirrors Prisma model Attendance.</summary>
    public class Attendance
    {
        [Key]
        [MaxLength(32)]
        public string Id { get; set; }

        [Required]
        [MaxLength(32)]
        public string EmployeeId { get; set; }

        public DateTime Date { get; set; }

        /// <summary>Mirrors checkIn. Null means not checked in.</summary>
        public DateTime? CheckIn { get; set; }

        /// <summary>Mirrors checkOut. Null means not checked out.</summary>
        public DateTime? CheckOut { get; set; }

        public int Minutes { get; set; }
    }

    /// <summary>
    /// Mirrors Prisma model EmployeeAdvance. Float amount maps to decimal.
    /// </summary>
    public class EmployeeAdvance
    {
        [Key]
        [MaxLength(32)]
        public string Id { get; set; }

        [Required]
        [MaxLength(32)]
        public string EmployeeId { get; set; }

        public decimal Amount { get; set; }

        public DateTime Date { get; set; }

        [MaxLength(1024)]
        public string Note { get; set; }

        public bool Settled { get; set; }
    }

    /// <summary>
    /// Mirrors Prisma model MaintenanceTicket. Float cost/paid map to decimal.
    /// </summary>
    public class MaintenanceTicket
    {
        [Key]
        [MaxLength(32)]
        public string Id { get; set; }

        [Required]
        [MaxLength(64)]
        public string No { get; set; }

        /// <summary>Mirrors customerName.</summary>
        [Required]
        [MaxLength(128)]
        public string CustomerName { get; set; }

        /// <summary>Mirrors customerPhone.</summary>
        [MaxLength(32)]
        public string CustomerPhone { get; set; }

        [MaxLength(256)]
        public string Device { get; set; }

        [MaxLength(1024)]
        public string Issue { get; set; }

        [MaxLength(32)]
        public string Status { get; set; }

        [MaxLength(128)]
        public string Technician { get; set; }

        public decimal Cost { get; set; }

        public decimal Paid { get; set; }

        /// <summary>Mirrors receivedAt.</summary>
        public DateTime ReceivedAt { get; set; }

        /// <summary>Mirrors deliveredAt. Null means not delivered yet.</summary>
        public DateTime? DeliveredAt { get; set; }
    }

    /// <summary>
    /// Mirrors Prisma model TicketPart. Float price maps to decimal.
    /// </summary>
    public class TicketPart
    {
        [Key]
        [MaxLength(32)]
        public string Id { get; set; }

        [Required]
        [MaxLength(32)]
        public string TicketId { get; set; }

        [Required]
        [MaxLength(128)]
        public string Name { get; set; }

        public decimal Price { get; set; }
    }
}
