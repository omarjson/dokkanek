using System;
using System.Collections.Generic;
using Dokkanek.Desktop.Domain.Entities;
using System.Data.SQLite;

namespace Dokkanek.Desktop.Data.Repositories
{
    public class SaleRepository
    {
        private readonly string _connectionString;

        public SaleRepository(string connectionString)
        {
            if (connectionString == null)
            {
                throw new ArgumentNullException("connectionString");
            }
            _connectionString = connectionString;
        }

        /// <summary>Insert sale header + items atomically. Returns sale id.</summary>
        public string InsertSale(Sale sale, IList<SaleItem> items)
        {
            if (sale == null)
            {
                throw new ArgumentNullException("sale");
            }
            if (string.IsNullOrEmpty(sale.Id))
            {
                sale.Id = Guid.NewGuid().ToString("N");
            }
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteTransaction tx = conn.BeginTransaction())
                {
                    using (SQLiteCommand cmd = conn.CreateCommand())
                    {
                        cmd.Transaction = tx;
                        cmd.CommandText = "INSERT INTO \"Sale\"(Id, No, BranchId, CustomerId, CashierId, Status, PayMethod, Subtotal, Discount, Total, Paid, PayRef, Date) VALUES(@id,@no,@branch,@cust,@cashier,@status,@pay,@sub,@disc,@total,@paid,@ref,@date);";
                        cmd.Parameters.AddWithValue("@id", sale.Id);
                        cmd.Parameters.AddWithValue("@no", (object)sale.No ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@branch", (object)sale.BranchId ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@cust", (object)sale.CustomerId ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@cashier", (object)sale.CashierId ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@status", (object)sale.Status ?? "COMPLETED");
                        cmd.Parameters.AddWithValue("@pay", (object)sale.PayMethod ?? "CASH");
                        cmd.Parameters.AddWithValue("@sub", sale.Subtotal);
                        cmd.Parameters.AddWithValue("@disc", sale.Discount);
                        cmd.Parameters.AddWithValue("@total", sale.Total);
                        cmd.Parameters.AddWithValue("@paid", sale.Paid);
                        cmd.Parameters.AddWithValue("@ref", (object)sale.PayRef ?? string.Empty);
                        cmd.Parameters.AddWithValue("@date", ToText(sale.Date));
                        cmd.ExecuteNonQuery();
                    }
                    if (items != null)
                    {
                        for (int i = 0; i < items.Count; i++)
                        {
                            SaleItem it = items[i];
                            if (string.IsNullOrEmpty(it.Id))
                            {
                                it.Id = Guid.NewGuid().ToString("N");
                            }
                            it.SaleId = sale.Id;
                            using (SQLiteCommand ic = conn.CreateCommand())
                            {
                                ic.Transaction = tx;
                                ic.CommandText = "INSERT INTO \"SaleItem\"(Id, SaleId, ProductId, Qty, Price) VALUES(@id,@sale,@prod,@qty,@price);";
                                ic.Parameters.AddWithValue("@id", it.Id);
                                ic.Parameters.AddWithValue("@sale", sale.Id);
                                ic.Parameters.AddWithValue("@prod", (object)it.ProductId ?? DBNull.Value);
                                ic.Parameters.AddWithValue("@qty", it.Qty);
                                ic.Parameters.AddWithValue("@price", it.Price);
                                ic.ExecuteNonQuery();
                            }
                        }
                    }
                    tx.Commit();
                }
            }
            return sale.Id;
        }

        /// <summary>Find sale header with items populated into Sale.Items.</summary>
        public Sale FindById(string id)
        {
            Sale sale = null;
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT Id, No, BranchId, CustomerId, CashierId, Status, PayMethod, Subtotal, Discount, Total, Paid, PayRef, Date FROM \"Sale\" WHERE Id = @id;";
                    cmd.Parameters.AddWithValue("@id", (object)id ?? DBNull.Value);
                    using (SQLiteDataReader r = cmd.ExecuteReader())
                    {
                        if (r.Read())
                        {
                            sale = MapSale(r);
                        }
                    }
                }
                if (sale != null)
                {
                    sale.Items = ListItems(conn, sale.Id);
                }
            }
            return sale;
        }

        public List<SaleItem> ListItems(string saleId)
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                return ListItems(conn, saleId);
            }
        }

        /// <summary>Void a sale (status = CANCELLED, matches web + SaleService). Returns rows affected.</summary>
        public int Void(string saleId)
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "UPDATE \"Sale\" SET Status = @s WHERE Id = @id;";
                    cmd.Parameters.AddWithValue("@s", "CANCELLED");
                    cmd.Parameters.AddWithValue("@id", (object)saleId ?? DBNull.Value);
                    return cmd.ExecuteNonQuery();
                }
            }
        }

        public List<Sale> ListRecent(int take)
        {
            if (take <= 0)
            {
                take = 50;
            }
            List<Sale> list = new List<Sale>();
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT Id, No, BranchId, CustomerId, CashierId, Status, PayMethod, Subtotal, Discount, Total, Paid, PayRef, Date FROM \"Sale\" ORDER BY Date DESC LIMIT @take;";
                    cmd.Parameters.AddWithValue("@take", take);
                    using (SQLiteDataReader r = cmd.ExecuteReader())
                    {
                        while (r.Read())
                        {
                            list.Add(MapSale(r));
                        }
                    }
                }
            }
            return list;
        }

        private static List<SaleItem> ListItems(SQLiteConnection conn, string saleId)
        {
            List<SaleItem> items = new List<SaleItem>();
            using (SQLiteCommand cmd = conn.CreateCommand())
            {
                cmd.CommandText = "SELECT Id, SaleId, ProductId, Qty, Price FROM \"SaleItem\" WHERE SaleId = @sale;";
                cmd.Parameters.AddWithValue("@sale", (object)saleId ?? DBNull.Value);
                using (SQLiteDataReader r = cmd.ExecuteReader())
                {
                    while (r.Read())
                    {
                        SaleItem it = new SaleItem();
                        it.Id = r.IsDBNull(0) ? string.Empty : r.GetString(0);
                        it.SaleId = r.IsDBNull(1) ? string.Empty : r.GetString(1);
                        it.ProductId = r.IsDBNull(2) ? string.Empty : r.GetString(2);
                        it.Qty = r.IsDBNull(3) ? 0d : r.GetDouble(3);
                        it.Price = r.IsDBNull(4) ? 0d : r.GetDouble(4);
                        items.Add(it);
                    }
                }
            }
            return items;
        }

        private static Sale MapSale(SQLiteDataReader r)
        {
            Sale s = new Sale();
            s.Id = r.IsDBNull(0) ? string.Empty : r.GetString(0);
            s.No = r.IsDBNull(1) ? string.Empty : r.GetString(1);
            s.BranchId = r.IsDBNull(2) ? null : r.GetString(2);
            s.CustomerId = r.IsDBNull(3) ? null : r.GetString(3);
            s.CashierId = r.IsDBNull(4) ? null : r.GetString(4);
            s.Status = r.IsDBNull(5) ? "COMPLETED" : r.GetString(5);
            s.PayMethod = r.IsDBNull(6) ? "CASH" : r.GetString(6);
            s.Subtotal = r.IsDBNull(7) ? 0d : r.GetDouble(7);
            s.Discount = r.IsDBNull(8) ? 0d : r.GetDouble(8);
            s.Total = r.IsDBNull(9) ? 0d : r.GetDouble(9);
            s.Paid = r.IsDBNull(10) ? 0d : r.GetDouble(10);
            s.PayRef = r.IsDBNull(11) ? string.Empty : r.GetString(11);
            DateTime dt;
            s.Date = !r.IsDBNull(12) && DateTime.TryParse(r.GetString(12), out dt) ? dt : DateTime.UtcNow;
            return s;
        }

        private static string ToText(DateTime dt)
        {
            if (dt == default(DateTime))
            {
                dt = DateTime.UtcNow;
            }
            return dt.ToString("o");
        }
    }
}
