using System;
using System.Collections.Generic;
using Dokkanek.Desktop.Domain.Entities;
using System.Data.SQLite;

namespace Dokkanek.Desktop.Data.Repositories
{
    public class StockRepository
    {
        private readonly string _connectionString;

        public StockRepository(string connectionString)
        {
            if (connectionString == null)
            {
                throw new ArgumentNullException("connectionString");
            }
            _connectionString = connectionString;
        }

        public string InsertMove(StockMove move)
        {
            if (move == null)
            {
                throw new ArgumentNullException("move");
            }
            if (string.IsNullOrEmpty(move.Id))
            {
                move.Id = Guid.NewGuid().ToString("N");
            }
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "INSERT INTO \"StockMove\"(Id, ProductId, Qty, Type, Note, Date, UserId) VALUES(@id,@prod,@qty,@type,@note,@date,@user);";
                    cmd.Parameters.AddWithValue("@id", move.Id);
                    cmd.Parameters.AddWithValue("@prod", (object)move.ProductId ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@qty", move.Qty);
                    cmd.Parameters.AddWithValue("@type", (object)move.Type ?? string.Empty);
                    cmd.Parameters.AddWithValue("@note", (object)move.Note ?? string.Empty);
                    cmd.Parameters.AddWithValue("@date", ToText(move.Date));
                    cmd.Parameters.AddWithValue("@user", (object)move.UserId ?? DBNull.Value);
                    cmd.ExecuteNonQuery();
                }
            }
            return move.Id;
        }

        public List<StockMove> ListByProduct(string productId, int take)
        {
            if (take <= 0)
            {
                take = 100;
            }
            List<StockMove> list = new List<StockMove>();
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT Id, ProductId, Qty, Type, Note, Date, UserId FROM \"StockMove\" WHERE ProductId = @p ORDER BY Date DESC LIMIT @take;";
                    cmd.Parameters.AddWithValue("@p", (object)productId ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@take", take);
                    using (SQLiteDataReader r = cmd.ExecuteReader())
                    {
                        while (r.Read())
                        {
                            StockMove m = new StockMove();
                            m.Id = r.IsDBNull(0) ? string.Empty : r.GetString(0);
                            m.ProductId = r.IsDBNull(1) ? string.Empty : r.GetString(1);
                            m.Qty = r.IsDBNull(2) ? 0d : r.GetDouble(2);
                            m.Type = r.IsDBNull(3) ? string.Empty : r.GetString(3);
                            m.Note = r.IsDBNull(4) ? string.Empty : r.GetString(4);
                            DateTime dt;
                            m.Date = !r.IsDBNull(5) && DateTime.TryParse(r.GetString(5), out dt) ? dt : DateTime.UtcNow;
                            m.UserId = r.IsDBNull(6) ? null : r.GetString(6);
                            list.Add(m);
                        }
                    }
                }
            }
            return list;
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
