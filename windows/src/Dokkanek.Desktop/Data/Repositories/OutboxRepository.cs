using System;
using System.Collections.Generic;
using Dokkanek.Desktop.Domain.Entities;
using System.Data.SQLite;

namespace Dokkanek.Desktop.Data.Repositories
{
    /// <summary>Offline outbox for salesQueued while the server is unreachable.</summary>
    public class OutboxRepository
    {
        private readonly string _connectionString;

        public OutboxRepository(string connectionString)
        {
            if (connectionString == null)
            {
                throw new ArgumentNullException("connectionString");
            }
            _connectionString = connectionString;
        }

        /// <summary>Enqueue a serialized PendingSale payload. Returns the outbox id.</summary>
        public string Enqueue(string payload)
        {
            if (payload == null)
            {
                throw new ArgumentNullException("payload");
            }
            string id = Guid.NewGuid().ToString("N");
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "INSERT INTO \"PendingSale\"(Id, Payload, CreatedAt) VALUES(@id, @payload, @created);";
                    cmd.Parameters.AddWithValue("@id", id);
                    cmd.Parameters.AddWithValue("@payload", payload);
                    cmd.Parameters.AddWithValue("@created", DateTime.UtcNow.ToString("o"));
                    cmd.ExecuteNonQuery();
                }
            }
            return id;
        }

        public List<PendingSale> List(int take)
        {
            if (take <= 0)
            {
                take = 100;
            }
            List<PendingSale> list = new List<PendingSale>();
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT Id, Payload, CreatedAt FROM \"PendingSale\" ORDER BY CreatedAt ASC LIMIT @take;";
                    cmd.Parameters.AddWithValue("@take", take);
                    using (SQLiteDataReader r = cmd.ExecuteReader())
                    {
                        while (r.Read())
                        {
                            PendingSale p = new PendingSale();
                            p.Id = r.IsDBNull(0) ? string.Empty : r.GetString(0);
                            p.Payload = r.IsDBNull(1) ? string.Empty : r.GetString(1);
                            DateTime dt;
                            p.CreatedAt = !r.IsDBNull(2) && DateTime.TryParse(r.GetString(2), out dt) ? dt : DateTime.UtcNow;
                            list.Add(p);
                        }
                    }
                }
            }
            return list;
        }

        public List<PendingSale> List()
        {
            return List(100);
        }

        /// <summary>Remove an outbox entry after successful sync. Returns rows affected.</summary>
        public int Remove(string id)
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "DELETE FROM \"PendingSale\" WHERE Id = @id;";
                    cmd.Parameters.AddWithValue("@id", (object)id ?? DBNull.Value);
                    return cmd.ExecuteNonQuery();
                }
            }
        }

        public int Count()
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT COUNT(*) FROM \"PendingSale\";";
                    object v = cmd.ExecuteScalar();
                    if (v == null || v == DBNull.Value)
                    {
                        return 0;
                    }
                    return Convert.ToInt32(v);
                }
            }
        }
    }
}
