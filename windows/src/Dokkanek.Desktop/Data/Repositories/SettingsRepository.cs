using System;
using System.Collections.Generic;
using System.Data.SQLite;

namespace Dokkanek.Desktop.Data.Repositories
{
    /// <summary>
    /// Key/value settings store with in-memory cache (lock protected).
    /// Used for perm/mod overrides (perm_{ROLE}_{key}, mod_{name}) and store prefs.
    /// </summary>
    public class SettingsRepository
    {
        private readonly string _connectionString;
        private readonly Dictionary<string, string> _cache = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        private readonly object _lock = new object();
        private bool _loaded;

        public SettingsRepository(string connectionString)
        {
            if (connectionString == null)
            {
                throw new ArgumentNullException("connectionString");
            }
            _connectionString = connectionString;
        }

        public Dictionary<string, string> All()
        {
            lock (_lock)
            {
                if (_loaded)
                {
                    return new Dictionary<string, string>(_cache, StringComparer.OrdinalIgnoreCase);
                }
            }
            Dictionary<string, string> fresh = LoadAllFromDb();
            lock (_lock)
            {
                _cache.Clear();
                foreach (KeyValuePair<string, string> kv in fresh)
                {
                    _cache[kv.Key] = kv.Value;
                }
                _loaded = true;
                return new Dictionary<string, string>(_cache, StringComparer.OrdinalIgnoreCase);
            }
        }

        public string Get(string key, string defaultValue)
        {
            if (key == null)
            {
                throw new ArgumentNullException("key");
            }
            if (defaultValue == null)
            {
                defaultValue = string.Empty;
            }
            lock (_lock)
            {
                string cached;
                if (_cache.TryGetValue(key, out cached))
                {
                    return cached;
                }
            }
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT Value FROM \"Setting\" WHERE Key = @k;";
                    cmd.Parameters.AddWithValue("@k", key);
                    object v = cmd.ExecuteScalar();
                    string result = (v == null || v == DBNull.Value) ? defaultValue : Convert.ToString(v);
                    lock (_lock)
                    {
                        _cache[key] = result;
                    }
                    return result;
                }
            }
        }

        public string Get(string key)
        {
            return Get(key, string.Empty);
        }

        public void Set(string key, string value)
        {
            if (key == null)
            {
                throw new ArgumentNullException("key");
            }
            if (value == null)
            {
                value = string.Empty;
            }
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "INSERT INTO \"Setting\"(Key, Value) VALUES(@k, @v) ON CONFLICT(Key) DO UPDATE SET Value = @v;";
                    cmd.Parameters.AddWithValue("@k", key);
                    cmd.Parameters.AddWithValue("@v", value);
                    cmd.ExecuteNonQuery();
                }
            }
            lock (_lock)
            {
                _cache[key] = value;
            }
        }

        public void Invalidate()
        {
            lock (_lock)
            {
                _cache.Clear();
                _loaded = false;
            }
        }

        private Dictionary<string, string> LoadAllFromDb()
        {
            Dictionary<string, string> map = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT Key, Value FROM \"Setting\";";
                    using (SQLiteDataReader r = cmd.ExecuteReader())
                    {
                        while (r.Read())
                        {
                            string k = r.IsDBNull(0) ? string.Empty : r.GetString(0);
                            string v = r.IsDBNull(1) ? string.Empty : r.GetString(1);
                            map[k] = v;
                        }
                    }
                }
            }
            return map;
        }
    }
}
