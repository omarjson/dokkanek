using System;
using System.Collections.Generic;
using Dokkanek.Desktop.Domain.Entities;
using System.Data.SQLite;

namespace Dokkanek.Desktop.Data.Repositories
{
    public class SupplierRepository
    {
        private readonly string _connectionString;

        public SupplierRepository(string connectionString)
        {
            if (connectionString == null)
            {
                throw new ArgumentNullException("connectionString");
            }
            _connectionString = connectionString;
        }

        public Supplier FindById(string id)
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT Id, Name, Phone, Address, Balance FROM \"Supplier\" WHERE Id = @id;";
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

        public List<Supplier> ListAll()
        {
            List<Supplier> list = new List<Supplier>();
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT Id, Name, Phone, Address, Balance FROM \"Supplier\" ORDER BY Name;";
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

        public void Insert(Supplier s)
        {
            if (s == null)
            {
                throw new ArgumentNullException("s");
            }
            if (string.IsNullOrEmpty(s.Id))
            {
                s.Id = Guid.NewGuid().ToString("N");
            }
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "INSERT INTO \"Supplier\"(Id, Name, Phone, Address, Balance) VALUES(@id,@name,@phone,@addr,@bal);";
                    cmd.Parameters.AddWithValue("@id", s.Id);
                    cmd.Parameters.AddWithValue("@name", (object)s.Name ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@phone", (object)s.Phone ?? string.Empty);
                    cmd.Parameters.AddWithValue("@addr", (object)s.Address ?? string.Empty);
                    cmd.Parameters.AddWithValue("@bal", s.Balance);
                    cmd.ExecuteNonQuery();
                }
            }
        }

        /// <summary>Atomically shift supplier balance by delta. Returns rows affected.</summary>
        public int AdjustBalance(string supplierId, double delta)
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "UPDATE \"Supplier\" SET Balance = Balance + @d WHERE Id = @id;";
                    cmd.Parameters.AddWithValue("@d", delta);
                    cmd.Parameters.AddWithValue("@id", (object)supplierId ?? DBNull.Value);
                    return cmd.ExecuteNonQuery();
                }
            }
        }

        private static Supplier Map(SQLiteDataReader r)
        {
            Supplier s = new Supplier();
            s.Id = r.IsDBNull(0) ? string.Empty : r.GetString(0);
            s.Name = r.IsDBNull(1) ? string.Empty : r.GetString(1);
            s.Phone = r.IsDBNull(2) ? string.Empty : r.GetString(2);
            s.Address = r.IsDBNull(3) ? string.Empty : r.GetString(3);
            s.Balance = r.IsDBNull(4) ? 0d : r.GetDouble(4);
            return s;
        }
    }
}
