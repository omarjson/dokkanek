using System;
using System.Collections.Generic;
using Dokkanek.Desktop.Domain.Entities;
using System.Data.SQLite;

namespace Dokkanek.Desktop.Data.Repositories
{
    /// <summary>Audit log writer. Insert never throws (fire-and-forget safe).</summary>
    public class AuditRepository
    {
        private readonly string _connectionString;

        public AuditRepository(string connectionString)
        {
            if (connectionString == null)
            {
                throw new ArgumentNullException("connectionString");
            }
            _connectionString = connectionString;
        }

        public void Insert(AuditLog log)
        {
            try
            {
                if (log == null)
                {
                    return;
                }
                if (string.IsNullOrEmpty(log.Id))
                {
                    log.Id = Guid.NewGuid().ToString("N");
                }
                using (SQLiteConnection conn = Db.Open(_connectionString))
                {
                    using (SQLiteCommand cmd = conn.CreateCommand())
                    {
                        cmd.CommandText = "INSERT INTO \"AuditLog\"(Id, UserId, Username, Action, Entity, EntityId, Details, CreatedAt) VALUES(@id,@uid,@un,@act,@ent,@eid,@det,@created);";
                        cmd.Parameters.AddWithValue("@id", log.Id);
                        cmd.Parameters.AddWithValue("@uid", (object)log.UserId ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@un", (object)log.Username ?? string.Empty);
                        cmd.Parameters.AddWithValue("@act", (object)log.Action ?? string.Empty);
                        cmd.Parameters.AddWithValue("@ent", (object)log.Entity ?? string.Empty);
                        cmd.Parameters.AddWithValue("@eid", (object)log.EntityId ?? string.Empty);
                        cmd.Parameters.AddWithValue("@det", (object)log.Details ?? string.Empty);
                        cmd.Parameters.AddWithValue("@created", ToText(log.CreatedAt));
                        cmd.ExecuteNonQuery();
                    }
                }
            }
            catch (Exception)
            {
                // fire-and-forget: audit must never break the main flow.
            }
        }

        public List<AuditLog> ListRecent(int take)
        {
            if (take <= 0)
            {
                take = 100;
            }
            List<AuditLog> list = new List<AuditLog>();
            try
            {
                using (SQLiteConnection conn = Db.Open(_connectionString))
                {
                    using (SQLiteCommand cmd = conn.CreateCommand())
                    {
                        cmd.CommandText = "SELECT Id, UserId, Username, Action, Entity, EntityId, Details, CreatedAt FROM \"AuditLog\" ORDER BY CreatedAt DESC LIMIT @take;";
                        cmd.Parameters.AddWithValue("@take", take);
                        using (SQLiteDataReader r = cmd.ExecuteReader())
                        {
                            while (r.Read())
                            {
                                AuditLog a = new AuditLog();
                                a.Id = r.IsDBNull(0) ? string.Empty : r.GetString(0);
                                a.UserId = r.IsDBNull(1) ? null : r.GetString(1);
                                a.Username = r.IsDBNull(2) ? string.Empty : r.GetString(2);
                                a.Action = r.IsDBNull(3) ? string.Empty : r.GetString(3);
                                a.Entity = r.IsDBNull(4) ? string.Empty : r.GetString(4);
                                a.EntityId = r.IsDBNull(5) ? string.Empty : r.GetString(5);
                                a.Details = r.IsDBNull(6) ? string.Empty : r.GetString(6);
                                DateTime dt;
                                a.CreatedAt = !r.IsDBNull(7) && DateTime.TryParse(r.GetString(7), out dt) ? dt : DateTime.UtcNow;
                                list.Add(a);
                            }
                        }
                    }
                }
            }
            catch (Exception)
            {
                // read failure returns what was collected (possibly empty).
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
