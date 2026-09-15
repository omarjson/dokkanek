using System;
using System.Collections.Generic;
using Dokkanek.Desktop.Domain.Entities;
using System.Data.SQLite;

namespace Dokkanek.Desktop.Data.Repositories
{
    public class CustomerRepository
    {
        private readonly string _connectionString;

        public CustomerRepository(string connectionString)
        {
            if (connectionString == null)
            {
                throw new ArgumentNullException("connectionString");
            }
            _connectionString = connectionString;
        }

        public Customer FindById(string id)
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT Id, Name, Phone, Address, CreditLimit, Balance FROM \"Customer\" WHERE Id = @id;";
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

        public List<Customer> ListAll()
        {
            List<Customer> list = new List<Customer>();
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT Id, Name, Phone, Address, CreditLimit, Balance FROM \"Customer\" ORDER BY Name;";
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

        public void Insert(Customer c)
        {
            if (c == null)
            {
                throw new ArgumentNullException("c");
            }
            if (string.IsNullOrEmpty(c.Id))
            {
                c.Id = Guid.NewGuid().ToString("N");
            }
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "INSERT INTO \"Customer\"(Id, Name, Phone, Address, CreditLimit, Balance) VALUES(@id,@name,@phone,@addr,@limit,@bal);";
                    cmd.Parameters.AddWithValue("@id", c.Id);
                    cmd.Parameters.AddWithValue("@name", (object)c.Name ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@phone", (object)c.Phone ?? string.Empty);
                    cmd.Parameters.AddWithValue("@addr", (object)c.Address ?? string.Empty);
                    cmd.Parameters.AddWithValue("@limit", c.CreditLimit);
                    cmd.Parameters.AddWithValue("@bal", c.Balance);
                    cmd.ExecuteNonQuery();
                }
            }
        }

        /// <summary>Atomically shift balance by delta (positive = debt up). Returns rows affected.</summary>
        public int AdjustBalance(string customerId, double delta)
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "UPDATE \"Customer\" SET Balance = Balance + @d WHERE Id = @id;";
                    cmd.Parameters.AddWithValue("@d", delta);
                    cmd.Parameters.AddWithValue("@id", (object)customerId ?? DBNull.Value);
                    return cmd.ExecuteNonQuery();
                }
            }
        }

        private static Customer Map(SQLiteDataReader r)
        {
            Customer c = new Customer();
            c.Id = r.IsDBNull(0) ? string.Empty : r.GetString(0);
            c.Name = r.IsDBNull(1) ? string.Empty : r.GetString(1);
            c.Phone = r.IsDBNull(2) ? string.Empty : r.GetString(2);
            c.Address = r.IsDBNull(3) ? string.Empty : r.GetString(3);
            c.CreditLimit = r.IsDBNull(4) ? 0d : r.GetDouble(4);
            c.Balance = r.IsDBNull(5) ? 0d : r.GetDouble(5);
            return c;
        }
    }
}
