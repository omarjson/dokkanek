using System;
using Dokkanek.Desktop.Domain.Entities;

namespace Dokkanek.Desktop.Data.Repositories
{
    /// <summary>
    /// Maps Domain entities (decimal money/qty — canonical model) to the
    /// Row DTO contracts in IRepositories.cs (double — matches Prisma Float
    /// and the web reference). Services depend ONLY on the Row contracts;
    /// concrete SQLite repositories below work with Domain entities.
    /// Wiring (P1): wrap each concrete repository with an adapter that
    /// implements the corresponding I*Repository interface via these helpers.
    /// Money is rounded to 2dp on the way out, exactly like the web
    /// weighted-average cost path.
    /// </summary>
    public static class Adapters
    {
        public static ProductRow ToRow(Product p)
        {
            if (p == null)
            {
                return null;
            }
            return new ProductRow
            {
                Id = p.Id ?? string.Empty,
                Sku = p.Sku ?? string.Empty,
                Name = p.Name ?? string.Empty,
                CategoryId = p.CategoryId,
                CostPrice = (double)Math.Round(p.CostPrice, 2),
                CostUsd = (double)Math.Round(p.CostUsd, 2),
                SalePrice = (double)Math.Round(p.SalePrice, 2),
                Quantity = (double)p.Quantity,
                WarehouseId = p.WarehouseId,
                Barcode = p.Barcode ?? string.Empty,
                MinQuantity = (double)p.MinQuantity,
                IsFavorite = p.IsFavorite,
                Active = p.Active
            };
        }

        public static Product ToEntity(ProductRow r)
        {
            if (r == null)
            {
                return null;
            }
            return new Product
            {
                Id = r.Id,
                Sku = r.Sku,
                Name = r.Name,
                CategoryId = r.CategoryId,
                CostPrice = (decimal)r.CostPrice,
                CostUsd = (decimal)r.CostUsd,
                SalePrice = (decimal)r.SalePrice,
                Quantity = (decimal)r.Quantity,
                WarehouseId = r.WarehouseId,
                Barcode = r.Barcode,
                IsFavorite = r.IsFavorite,
                MinQuantity = (decimal)r.MinQuantity,
                Active = r.Active,
                LegacyNo = string.Empty,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };
        }

        public static SaleRow ToRow(Sale s)
        {
            if (s == null)
            {
                return null;
            }
            return new SaleRow
            {
                Id = s.Id ?? string.Empty,
                No = s.No ?? string.Empty,
                BranchId = s.BranchId,
                CustomerId = s.CustomerId,
                CashierId = s.CashierId,
                Status = s.Status ?? "COMPLETED",
                PayMethod = s.PayMethod ?? "CASH",
                Subtotal = (double)s.Subtotal,
                Discount = (double)s.Discount,
                Total = (double)s.Total,
                Paid = (double)s.Paid,
                PayRef = s.PayRef ?? string.Empty,
                Date = s.Date
            };
        }

        public static CustomerRow ToRow(Customer c)
        {
            if (c == null)
            {
                return null;
            }
            return new CustomerRow
            {
                Id = c.Id ?? string.Empty,
                Name = c.Name ?? string.Empty,
                Phone = c.Phone ?? string.Empty,
                Address = c.Address ?? string.Empty,
                CreditLimit = (double)c.CreditLimit,
                Balance = (double)c.Balance
            };
        }

        public static SupplierRow ToRow(Supplier s)
        {
            if (s == null)
            {
                return null;
            }
            return new SupplierRow
            {
                Id = s.Id ?? string.Empty,
                Name = s.Name ?? string.Empty,
                Phone = s.Phone ?? string.Empty,
                Address = s.Address ?? string.Empty,
                Balance = (double)s.Balance
            };
        }

        public static UserRow ToRow(User u)
        {
            if (u == null)
            {
                return null;
            }
            return new UserRow
            {
                Id = u.Id ?? string.Empty,
                Name = u.Name ?? string.Empty,
                Username = u.Username ?? string.Empty,
                PasswordHash = u.PasswordHash ?? string.Empty,
                Role = u.Role ?? "CASHIER",
                Active = u.Active,
                BranchId = u.BranchId
            };
        }
    }
}
