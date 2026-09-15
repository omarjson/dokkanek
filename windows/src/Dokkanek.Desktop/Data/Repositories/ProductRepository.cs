using System;
using System.Collections.Generic;
using System.Text;
using Dokkanek.Desktop.Domain.Entities;
using System.Data.SQLite;

namespace Dokkanek.Desktop.Data.Repositories
{
    public class ProductRepository
    {
        private readonly string _connectionString;

        public ProductRepository(string connectionString)
        {
            if (connectionString == null)
            {
                throw new ArgumentNullException("connectionString");
            }
            _connectionString = connectionString;
        }

        public Product FindById(string id)
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = SelectSql() + " WHERE Id = @id;";
                    cmd.Parameters.AddWithValue("@id", (object)id ?? DBNull.Value);
                    using (SQLiteDataReader r = cmd.ExecuteReader())
                    {
                        if (r.Read())
                        {
                            return Map(r);
                        }
                    }
                }
            }
            return null;
        }

        public Product FindBySku(string sku)
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = SelectSql() + " WHERE Sku = @sku;";
                    cmd.Parameters.AddWithValue("@sku", (object)sku ?? DBNull.Value);
                    using (SQLiteDataReader r = cmd.ExecuteReader())
                    {
                        if (r.Read())
                        {
                            return Map(r);
                        }
                    }
                }
            }
            return null;
        }

        /// <summary>Search by name/sku/barcode with optional category filter.</summary>
        public List<Product> SearchPaged(string q, string categoryId, int take, int skip)
        {
            if (take <= 0)
            {
                take = 50;
            }
            if (skip < 0)
            {
                skip = 0;
            }
            StringBuilder sb = new StringBuilder();
            sb.Append(SelectSql());
            sb.Append(" WHERE Active = 1");
            if (!string.IsNullOrWhiteSpace(q))
            {
                sb.Append(" AND (Name LIKE @q OR Sku LIKE @q OR Barcode LIKE @q)");
            }
            if (!string.IsNullOrWhiteSpace(categoryId))
            {
                sb.Append(" AND CategoryId = @cat");
            }
            sb.Append(" ORDER BY Name ASC LIMIT @take OFFSET @skip;");
            List<Product> list = new List<Product>();
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = sb.ToString();
                    if (!string.IsNullOrWhiteSpace(q))
                    {
                        cmd.Parameters.AddWithValue("@q", "%" + q.Trim() + "%");
                    }
                    if (!string.IsNullOrWhiteSpace(categoryId))
                    {
                        cmd.Parameters.AddWithValue("@cat", categoryId);
                    }
                    cmd.Parameters.AddWithValue("@take", take);
                    cmd.Parameters.AddWithValue("@skip", skip);
                    using (SQLiteDataReader r = cmd.ExecuteReader())
                    {
                        while (r.Read())
                        {
                            list.Add(Map(r));
                        }
                    }
                }
            }
            return list;
        }

        public List<Product> SearchPaged(string q, string categoryId, int take)
        {
            return SearchPaged(q, categoryId, take, 0);
        }

        /// <summary>
        /// Atomic stock decrement; succeeds only when enough quantity exists.
        /// Returns rows affected (1 = ok, 0 = insufficient stock / missing).
        /// </summary>
        public int DecrementStockAtomic(string productId, double qty)
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "UPDATE \"Product\" SET Quantity = Quantity - @qty, UpdatedAt = @now WHERE Id = @id AND Quantity >= @qty;";
                    cmd.Parameters.AddWithValue("@qty", qty);
                    cmd.Parameters.AddWithValue("@now", DateTime.UtcNow.ToString("o"));
                    cmd.Parameters.AddWithValue("@id", (object)productId ?? DBNull.Value);
                    return cmd.ExecuteNonQuery();
                }
            }
        }

        public int IncrementStock(string productId, double qty)
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "UPDATE \"Product\" SET Quantity = Quantity + @qty, UpdatedAt = @now WHERE Id = @id;";
                    cmd.Parameters.AddWithValue("@qty", qty);
                    cmd.Parameters.AddWithValue("@now", DateTime.UtcNow.ToString("o"));
                    cmd.Parameters.AddWithValue("@id", (object)productId ?? DBNull.Value);
                    return cmd.ExecuteNonQuery();
                }
            }
        }

        public void Insert(Product p)
        {
            if (p == null)
            {
                throw new ArgumentNullException("p");
            }
            if (string.IsNullOrEmpty(p.Id))
            {
                p.Id = Guid.NewGuid().ToString("N");
            }
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "INSERT INTO \"Product\"(Id, Sku, Name, CategoryId, CostPrice, CostUsd, SalePrice, Quantity, WarehouseId, Barcode, IsFavorite, MinQuantity, Active, LegacyNo, CreatedAt, UpdatedAt) VALUES(@id,@sku,@name,@cat,@cost,@usd,@price,@qty,@wh,@bc,@fav,@min,@active,@legacy,@created,@updated);";
                    Bind(cmd, p);
                    cmd.ExecuteNonQuery();
                }
            }
        }

        private static string SelectSql()
        {
            return "SELECT Id, Sku, Name, CategoryId, CostPrice, CostUsd, SalePrice, Quantity, WarehouseId, Barcode, IsFavorite, MinQuantity, Active, LegacyNo, CreatedAt, UpdatedAt FROM \"Product\"";
        }

        private static void Bind(SQLiteCommand cmd, Product p)
        {
            cmd.Parameters.AddWithValue("@id", p.Id);
            cmd.Parameters.AddWithValue("@sku", (object)p.Sku ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@name", (object)p.Name ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@cat", (object)p.CategoryId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@cost", p.CostPrice);
            cmd.Parameters.AddWithValue("@usd", p.CostUsd);
            cmd.Parameters.AddWithValue("@price", p.SalePrice);
            cmd.Parameters.AddWithValue("@qty", p.Quantity);
            cmd.Parameters.AddWithValue("@wh", (object)p.WarehouseId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@bc", (object)p.Barcode ?? string.Empty);
            cmd.Parameters.AddWithValue("@fav", p.IsFavorite ? 1 : 0);
            cmd.Parameters.AddWithValue("@min", p.MinQuantity);
            cmd.Parameters.AddWithValue("@active", p.Active ? 1 : 0);
            cmd.Parameters.AddWithValue("@legacy", (object)p.LegacyNo ?? string.Empty);
            cmd.Parameters.AddWithValue("@created", ToText(p.CreatedAt));
            cmd.Parameters.AddWithValue("@updated", ToText(p.UpdatedAt));
        }

        private static Product Map(SQLiteDataReader r)
        {
            Product p = new Product();
            p.Id = GetStr(r, 0);
            p.Sku = GetStr(r, 1);
            p.Name = GetStr(r, 2);
            p.CategoryId = r.IsDBNull(3) ? null : r.GetString(3);
            p.CostPrice = GetDbl(r, 4);
            p.CostUsd = GetDbl(r, 5);
            p.SalePrice = GetDbl(r, 6);
            p.Quantity = GetDbl(r, 7);
            p.WarehouseId = r.IsDBNull(8) ? null : r.GetString(8);
            p.Barcode = GetStr(r, 9);
            p.IsFavorite = !r.IsDBNull(10) && r.GetInt32(10) == 1;
            p.MinQuantity = GetDbl(r, 11);
            p.Active = r.IsDBNull(12) || r.GetInt32(12) == 1;
            p.LegacyNo = GetStr(r, 13);
            p.CreatedAt = ParseDate(r, 14);
            p.UpdatedAt = ParseDate(r, 15);
            return p;
        }

        private static string GetStr(SQLiteDataReader r, int i)
        {
            return r.IsDBNull(i) ? string.Empty : r.GetString(i);
        }

        private static double GetDbl(SQLiteDataReader r, int i)
        {
            return r.IsDBNull(i) ? 0d : r.GetDouble(i);
        }

        private static string ToText(DateTime dt)
        {
            if (dt == default(DateTime))
            {
                dt = DateTime.UtcNow;
            }
            return dt.ToString("o");
        }

        private static DateTime ParseDate(SQLiteDataReader r, int i)
        {
            if (r.IsDBNull(i))
            {
                return DateTime.UtcNow;
            }
            DateTime dt;
            if (DateTime.TryParse(r.GetString(i), out dt))
            {
                return dt;
            }
            return DateTime.UtcNow;
        }
    }
}
