using System;
using System.Collections.Generic;
using Dokkanek.Desktop.Domain.Entities;
using System.Data.SQLite;

namespace Dokkanek.Desktop.Data.Repositories
{
    public class UserRepository
    {
        private readonly string _connectionString;

        public UserRepository(string connectionString)
        {
            if (connectionString == null)
            {
                throw new ArgumentNullException("connectionString");
            }
            _connectionString = connectionString;
        }

        public User FindById(string id)
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT Id, Name, Username, PasswordHash, Role, Active, BranchId, CreatedAt FROM \"User\" WHERE Id = @id;";
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

        public User FindByUsername(string username)
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT Id, Name, Username, PasswordHash, Role, Active, BranchId, CreatedAt FROM \"User\" WHERE Username = @u;";
                    cmd.Parameters.AddWithValue("@u", (object)username ?? DBNull.Value);
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

        public List<User> ListAll()
        {
            List<User> list = new List<User>();
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT Id, Name, Username, PasswordHash, Role, Active, BranchId, CreatedAt FROM \"User\" ORDER BY Name;";
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

        public void Insert(User user)
        {
            if (user == null)
            {
                throw new ArgumentNullException("user");
            }
            if (string.IsNullOrEmpty(user.Id))
            {
                user.Id = Guid.NewGuid().ToString("N");
            }
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "INSERT INTO \"User\"(Id, Name, Username, PasswordHash, Role, Active, BranchId, CreatedAt) VALUES(@id, @name, @u, @ph, @role, @active, @branch, @created);";
                    cmd.Parameters.AddWithValue("@id", user.Id);
                    cmd.Parameters.AddWithValue("@name", (object)user.Name ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@u", (object)user.Username ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@ph", (object)user.PasswordHash ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@role", (object)user.Role ?? "CASHIER");
                    cmd.Parameters.AddWithValue("@active", user.Active ? 1 : 0);
                    cmd.Parameters.AddWithValue("@branch", (object)user.BranchId ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@created", ToText(user.CreatedAt));
                    cmd.ExecuteNonQuery();
                }
            }
        }

        public int SetActive(string id, bool active)
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "UPDATE \"User\" SET Active = @a WHERE Id = @id;";
                    cmd.Parameters.AddWithValue("@a", active ? 1 : 0);
                    cmd.Parameters.AddWithValue("@id", (object)id ?? DBNull.Value);
                    return cmd.ExecuteNonQuery();
                }
            }
        }

        private static User Map(SQLiteDataReader r)
        {
            User u = new User();
            u.Id = r.IsDBNull(0) ? string.Empty : r.GetString(0);
            u.Name = r.IsDBNull(1) ? string.Empty : r.GetString(1);
            u.Username = r.IsDBNull(2) ? string.Empty : r.GetString(2);
            u.PasswordHash = r.IsDBNull(3) ? string.Empty : r.GetString(3);
            u.Role = r.IsDBNull(4) ? "CASHIER" : r.GetString(4);
            u.Active = !r.IsDBNull(5) && r.GetInt32(5) == 1;
            u.BranchId = r.IsDBNull(6) ? null : r.GetString(6);
            u.CreatedAt = ParseDate(r, 7);
            return u;
        }

        private static string ToText(DateTime dt)
        {
            if (dt == default(DateTime))
            {
                dt = DateTime.UtcNow;
            }
            return dt.ToString("o");
        }

        private static DateTime ParseDate(SQLiteDataReader r, int ordinal)
        {
            if (r.IsDBNull(ordinal))
            {
                return DateTime.UtcNow;
            }
            DateTime dt;
            if (DateTime.TryParse(r.GetString(ordinal), out dt))
            {
                return dt;
            }
            return DateTime.UtcNow;
        }
    }
}
