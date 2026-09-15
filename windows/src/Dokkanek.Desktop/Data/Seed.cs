using System;
using System.Security.Cryptography;
using System.Text;
using System.Data.SQLite;

namespace Dokkanek.Desktop.Data
{
    /// <summary>
    /// First-run seed. Runs only when the User table is empty.
    /// All SQL is parameterized; password hashes match lib/auth.ts SHA256("dokkanek:"+pwd).
    /// </summary>
    public static class Seed
    {
        public static void Seed()
        {
            SeedWith(Db.ConnectionString);
        }

        public static void SeedDefault()
        {
            SeedWith(Db.ConnectionString);
        }

        public static void SeedWith(string connectionString)
        {
            if (connectionString == null)
            {
                throw new ArgumentNullException("connectionString");
            }
            Db.EnsureCreated();
            using (SQLiteConnection conn = Db.Open(connectionString))
            {
                long users;
                using (SQLiteCommand count = conn.CreateCommand())
                {
                    count.CommandText = "SELECT COUNT(*) FROM \"User\";";
                    object v = count.ExecuteScalar();
                    users = (v == null || v == DBNull.Value) ? 0 : Convert.ToInt64(v);
                }
                if (users > 0)
                {
                    return;
                }
                using (SQLiteTransaction tx = conn.BeginTransaction())
                {
                    string now = DateTime.UtcNow.ToString("o");

                    // Branches: Tripoli + Benghazi
                    Exec(conn, tx, "INSERT INTO \"Branch\"(Id, Name, City, Phone) VALUES(@id,@name,@city,@phone);",
                        P("@id", "br-tripoli"), P("@name", "Tripoli Branch"), P("@city", "Tripoli"), P("@phone", ""));
                    Exec(conn, tx, "INSERT INTO \"Branch\"(Id, Name, City, Phone) VALUES(@id,@name,@city,@phone);",
                        P("@id", "br-benghazi"), P("@name", "Benghazi Branch"), P("@city", "Benghazi"), P("@phone", ""));

                    // Warehouse
                    Exec(conn, tx, "INSERT INTO \"Warehouse\"(Id, Name, BranchId) VALUES(@id,@name,@branch);",
                        P("@id", "wh-main"), P("@name", "Main Warehouse"), P("@branch", "br-tripoli"));

                    // Users (compat hash SHA256("dokkanek:"+pwd))
                    InsertUser(conn, tx, "u-admin", "System Admin", "admin", HashPassword("admin123"), "ADMIN", "br-tripoli", now);
                    InsertUser(conn, tx, "u-cashier", "Cashier", "cashier", HashPassword("1234"), "CASHIER", "br-tripoli", now);
                    InsertUser(conn, tx, "u-courier", "Courier", "courier", HashPassword("1234"), "COURIER", "br-tripoli", now);
                    InsertUser(conn, tx, "u-tech", "Technician", "tech", HashPassword("1234"), "TECHNICIAN", "br-tripoli", now);

                    // Categories
                    Exec(conn, tx, "INSERT INTO \"Category\"(Id, Name) VALUES(@id,@name);", P("@id", "cat-phones"), P("@name", "Phones"));
                    Exec(conn, tx, "INSERT INTO \"Category\"(Id, Name) VALUES(@id,@name);", P("@id", "cat-tablets"), P("@name", "Tablets"));
                    Exec(conn, tx, "INSERT INTO \"Category\"(Id, Name) VALUES(@id,@name);", P("@id", "cat-accessories"), P("@name", "Accessories"));
                    Exec(conn, tx, "INSERT INTO \"Category\"(Id, Name) VALUES(@id,@name);", P("@id", "cat-parts"), P("@name", "Spare Parts"));

                    // Products (14): PH/TB/AC/SP prefixes
                    InsertProduct(conn, tx, "p-01", "PH-IP14", "iPhone 14 128GB", "cat-phones", 3200, 0, 3650, 12, now);
                    InsertProduct(conn, tx, "p-02", "PH-SM-A54", "Samsung Galaxy A54", "cat-phones", 1400, 0, 1650, 20, now);
                    InsertProduct(conn, tx, "p-03", "PH-RM-11", "Redmi Note 11", "cat-phones", 750, 0, 900, 30, now);
                    InsertProduct(conn, tx, "p-04", "PH-IP11", "iPhone 11 64GB", "cat-phones", 1900, 0, 2200, 8, now);
                    InsertProduct(conn, tx, "p-05", "TB-IPAD9", "iPad 9 64GB", "cat-tablets", 1500, 0, 1780, 10, now);
                    InsertProduct(conn, tx, "p-06", "TB-SM-T220", "Samsung Tab A7 Lite", "cat-tablets", 650, 0, 800, 15, now);
                    InsertProduct(conn, tx, "p-07", "TB-LN-M10", "Lenovo Tab M10", "cat-tablets", 550, 0, 690, 12, now);
                    InsertProduct(conn, tx, "p-08", "AC-CH-25W", "Charger 25W Fast", "cat-accessories", 35, 0, 65, 100, now);
                    InsertProduct(conn, tx, "p-09", "AC-CB-C", "USB-C Cable 1m", "cat-accessories", 8, 0, 20, 200, now);
                    InsertProduct(conn, tx, "p-10", "AC-HP-BT", "Bluetooth Headset", "cat-accessories", 90, 0, 150, 60, now);
                    InsertProduct(conn, tx, "p-11", "AC-CV-LTH", "Leather Cover", "cat-accessories", 25, 0, 55, 80, now);
                    InsertProduct(conn, tx, "p-12", "SP-BT-IP", "iPhone Battery", "cat-parts", 60, 0, 120, 40, now);
                    InsertProduct(conn, tx, "p-13", "SP-SC-SM", "Samsung Screen", "cat-parts", 180, 0, 280, 25, now);
                    InsertProduct(conn, tx, "p-14", "SP-IC-CH", "Charging IC", "cat-parts", 15, 0, 45, 100, now);

                    // Customers (5)
                    InsertCustomer(conn, tx, "cu-01", "Cash Customer", "", "", 0, 0);
                    InsertCustomer(conn, tx, "cu-02", "Ahmed Al-Fitouri", "0910000001", "Tripoli", 5000, 0);
                    InsertCustomer(conn, tx, "cu-03", "Mohamed Ben Ali", "0910000002", "Tripoli", 3000, 0);
                    InsertCustomer(conn, tx, "cu-04", "Sara Khalil", "0910000003", "Benghazi", 2000, 0);
                    InsertCustomer(conn, tx, "cu-05", "Khaled Misrati", "0910000004", "Misrata", 2000, 0);

                    // Suppliers (3)
                    InsertSupplier(conn, tx, "su-01", "Al-Madar Supplier", "021000001", "Tripoli");
                    InsertSupplier(conn, tx, "su-02", "Libya Phone Est.", "021000002", "Tripoli");
                    InsertSupplier(conn, tx, "su-03", "Tripoli Accessories Co.", "021000003", "Tripoli");

                    // Settings
                    UpsertSetting(conn, tx, "store_name", "Dokkanek");
                    UpsertSetting(conn, tx, "currency", "د.ل");
                    UpsertSetting(conn, tx, "schema_version", "1");

                    tx.Commit();
                }
            }
        }

        /// <summary>Compat with web lib/auth.ts: hex(SHA256("dokkanek:"+password)).</summary>
        public static string HashPassword(string password)
        {
            if (password == null)
            {
                password = string.Empty;
            }
            using (SHA256 sha = SHA256.Create())
            {
                byte[] bytes = Encoding.UTF8.GetBytes("dokkanek:" + password);
                byte[] hash = sha.ComputeHash(bytes);
                StringBuilder sb = new StringBuilder(hash.Length * 2);
                for (int i = 0; i < hash.Length; i++)
                {
                    sb.Append(hash[i].ToString("x2"));
                }
                return sb.ToString();
            }
        }

        private static void InsertUser(SQLiteConnection conn, SQLiteTransaction tx, string id, string name, string username, string hash, string role, string branchId, string now)
        {
            Exec(conn, tx, "INSERT INTO \"User\"(Id, Name, Username, PasswordHash, Role, Active, BranchId, CreatedAt) VALUES(@id,@name,@u,@ph,@role,@active,@branch,@created);",
                P("@id", id), P("@name", name), P("@u", username), P("@ph", hash),
                P("@role", role), P("@active", 1), P("@branch", branchId), P("@created", now));
        }

        private static void InsertProduct(SQLiteConnection conn, SQLiteTransaction tx, string id, string sku, string name, string categoryId, double cost, double usd, double price, double qty, string now)
        {
            Exec(conn, tx, "INSERT INTO \"Product\"(Id, Sku, Name, CategoryId, CostPrice, CostUsd, SalePrice, Quantity, WarehouseId, Barcode, IsFavorite, MinQuantity, Active, LegacyNo, CreatedAt, UpdatedAt) VALUES(@id,@sku,@name,@cat,@cost,@usd,@price,@qty,@wh,@bc,@fav,@min,@active,@legacy,@created,@updated);",
                P("@id", id), P("@sku", sku), P("@name", name), P("@cat", categoryId),
                P("@cost", cost), P("@usd", usd), P("@price", price), P("@qty", qty),
                P("@wh", "wh-main"), P("@bc", sku), P("@fav", 0), P("@min", 5),
                P("@active", 1), P("@legacy", string.Empty), P("@created", now), P("@updated", now));
        }

        private static void InsertCustomer(SQLiteConnection conn, SQLiteTransaction tx, string id, string name, string phone, string address, double limit, double balance)
        {
            Exec(conn, tx, "INSERT INTO \"Customer\"(Id, Name, Phone, Address, CreditLimit, Balance) VALUES(@id,@name,@phone,@addr,@limit,@bal);",
                P("@id", id), P("@name", name), P("@phone", phone), P("@addr", address),
                P("@limit", limit), P("@bal", balance));
        }

        private static void InsertSupplier(SQLiteConnection conn, SQLiteTransaction tx, string id, string name, string phone, string address)
        {
            Exec(conn, tx, "INSERT INTO \"Supplier\"(Id, Name, Phone, Address, Balance) VALUES(@id,@name,@phone,@addr,@bal);",
                P("@id", id), P("@name", name), P("@phone", phone), P("@addr", address), P("@bal", 0d));
        }

        private static void UpsertSetting(SQLiteConnection conn, SQLiteTransaction tx, string key, string value)
        {
            Exec(conn, tx, "INSERT INTO \"Setting\"(Key, Value) VALUES(@k,@v) ON CONFLICT(Key) DO UPDATE SET Value = @v;",
                P("@k", key), P("@v", value));
        }

        private static SQLiteParameter P(string name, object value)
        {
            return new SQLiteParameter(name, value ?? DBNull.Value);
        }

        private static void Exec(SQLiteConnection conn, SQLiteTransaction tx, string sql, params SQLiteParameter[] parameters)
        {
            using (SQLiteCommand cmd = conn.CreateCommand())
            {
                cmd.Transaction = tx;
                cmd.CommandText = sql;
                for (int i = 0; i < parameters.Length; i++)
                {
                    cmd.Parameters.Add(parameters[i]);
                }
                cmd.ExecuteNonQuery();
            }
        }
    }
}
