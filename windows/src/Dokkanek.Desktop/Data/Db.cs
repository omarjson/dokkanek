using System;
using System.IO;
using System.Data.SQLite;

namespace Dokkanek.Desktop.Data
{
    /// <summary>
    /// SQLite database bootstrap: path resolution, connection string,
    /// schema creation (28 domain tables + PendingSale outbox), pragmas.
    /// </summary>
    public static class Db
    {
        /// <summary>Current schema version, stored in PRAGMA user_version.</summary>
        public const int SchemaVersion = 1;

        private static string _dbPath;
        private static string _connectionString;
        private static readonly object _lock = new object();

        /// <summary>
        /// Primary: %ProgramData%\Dokkanek\dokkanek.db, fallback to %LOCALAPPDATA%\Dokkanek\dokkanek.db.
        /// </summary>
        public static string DbPath
        {
            get
            {
                if (_dbPath != null)
                {
                    return _dbPath;
                }
                lock (_lock)
                {
                    if (_dbPath != null)
                    {
                        return _dbPath;
                    }
                    string primary = Path.Combine(
                        Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData),
                        "Dokkanek",
                        "dokkanek.db");
                    try
                    {
                        string dir = Path.GetDirectoryName(primary);
                        if (!Directory.Exists(dir))
                        {
                            Directory.CreateDirectory(dir);
                        }
                        _dbPath = primary;
                    }
                    catch (Exception)
                    {
                        string fallback = Path.Combine(
                            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                            "Dokkanek",
                            "dokkanek.db");
                        string dir2 = Path.GetDirectoryName(fallback);
                        if (!Directory.Exists(dir2))
                        {
                            Directory.CreateDirectory(dir2);
                        }
                        _dbPath = fallback;
                    }
                    return _dbPath;
                }
            }
        }

        /// <summary>SQLite connection string with foreign keys enforcement requested.</summary>
        public static string ConnectionString
        {
            get
            {
                if (_connectionString != null)
                {
                    return _connectionString;
                }
                lock (_lock)
                {
                    if (_connectionString == null)
                    {
                        _connectionString = "Data Source=" + DbPath + ";Foreign Keys=True;Pooling=True";
                    }
                    return _connectionString;
                }
            }
        }

        /// <summary>Open a connection with FK enforcement + WAL journal mode applied.</summary>
        public static SQLiteConnection Open()
        {
            return Open(ConnectionString);
        }

        /// <summary>Open a connection for an explicit connection string (repos use this).</summary>
        public static SQLiteConnection Open(string connectionString)
        {
            SQLiteConnection conn = new SQLiteConnection(connectionString);
            conn.Open();
            using (SQLiteCommand cmd = conn.CreateCommand())
            {
                cmd.CommandText = "PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout = 5000;";
                cmd.ExecuteNonQuery();
            }
            return conn;
        }

        /// <summary>Create all tables + indexes if missing, then stamp PRAGMA user_version.</summary>
        public static void EnsureCreated()
        {
            string dir = Path.GetDirectoryName(DbPath);
            if (!Directory.Exists(dir))
            {
                Directory.CreateDirectory(dir);
            }
            using (SQLiteConnection conn = Open())
            {
                using (SQLiteTransaction tx = conn.BeginTransaction())
                {
                    string[] statements = SchemaSql();
                    for (int i = 0; i < statements.Length; i++)
                    {
                        using (SQLiteCommand cmd = conn.CreateCommand())
                        {
                            cmd.Transaction = tx;
                            cmd.CommandText = statements[i];
                            cmd.ExecuteNonQuery();
                        }
                    }
                    tx.Commit();
                }
                using (SQLiteCommand ver = conn.CreateCommand())
                {
                    // user_version pragma takes no parameters; value is a compile-time const.
                    ver.CommandText = "PRAGMA user_version = 1;";
                    ver.ExecuteNonQuery();
                }
            }
        }

        /// <summary>Run PRAGMA integrity_check; true when first row is "ok". Never throws.</summary>
        public static bool IntegrityCheck()
        {
            try
            {
                using (SQLiteConnection conn = Open())
                {
                    using (SQLiteCommand cmd = conn.CreateCommand())
                    {
                        cmd.CommandText = "PRAGMA integrity_check;";
                        using (SQLiteDataReader r = cmd.ExecuteReader())
                        {
                            if (r.Read())
                            {
                                string v = r.IsDBNull(0) ? string.Empty : r.GetString(0);
                                return string.Equals(v, "ok", StringComparison.OrdinalIgnoreCase);
                            }
                        }
                    }
                }
            }
            catch (Exception)
            {
                return false;
            }
            return false;
        }

        /// <summary>Read back PRAGMA user_version. Returns -1 on error.</summary>
        public static int GetUserVersion()
        {
            try
            {
                using (SQLiteConnection conn = Open())
                {
                    using (SQLiteCommand cmd = conn.CreateCommand())
                    {
                        cmd.CommandText = "PRAGMA user_version;";
                        object v = cmd.ExecuteScalar();
                        if (v != null && v != DBNull.Value)
                        {
                            return Convert.ToInt32(v);
                        }
                    }
                }
            }
            catch (Exception)
            {
                return -1;
            }
            return -1;
        }

        private static string[] SchemaSql()
        {
            return new string[]
            {
                @"CREATE TABLE IF NOT EXISTS ""Branch"" (Id TEXT PRIMARY KEY, Name TEXT NOT NULL, City TEXT NOT NULL DEFAULT '', Phone TEXT NOT NULL DEFAULT '');",
                @"CREATE TABLE IF NOT EXISTS ""User"" (Id TEXT PRIMARY KEY, Name TEXT NOT NULL, Username TEXT NOT NULL, PasswordHash TEXT NOT NULL DEFAULT '', Role TEXT NOT NULL DEFAULT 'CASHIER', Active INTEGER NOT NULL DEFAULT 1, BranchId TEXT REFERENCES ""Branch""(Id), CreatedAt TEXT NOT NULL);",
                @"CREATE TABLE IF NOT EXISTS ""Warehouse"" (Id TEXT PRIMARY KEY, Name TEXT NOT NULL, BranchId TEXT REFERENCES ""Branch""(Id));",
                @"CREATE TABLE IF NOT EXISTS ""Setting"" (Key TEXT PRIMARY KEY, Value TEXT NOT NULL DEFAULT '');",
                @"CREATE TABLE IF NOT EXISTS ""Category"" (Id TEXT PRIMARY KEY, Name TEXT NOT NULL);",
                @"CREATE TABLE IF NOT EXISTS ""Product"" (Id TEXT PRIMARY KEY, Sku TEXT NOT NULL, Name TEXT NOT NULL, CategoryId TEXT REFERENCES ""Category""(Id), CostPrice REAL NOT NULL DEFAULT 0, CostUsd REAL NOT NULL DEFAULT 0, SalePrice REAL NOT NULL DEFAULT 0, Quantity REAL NOT NULL DEFAULT 0, WarehouseId TEXT REFERENCES ""Warehouse""(Id), Barcode TEXT NOT NULL DEFAULT '', IsFavorite INTEGER NOT NULL DEFAULT 0, MinQuantity REAL NOT NULL DEFAULT 5, Active INTEGER NOT NULL DEFAULT 1, LegacyNo TEXT NOT NULL DEFAULT '', CreatedAt TEXT NOT NULL, UpdatedAt TEXT NOT NULL);",
                @"CREATE TABLE IF NOT EXISTS ""Customer"" (Id TEXT PRIMARY KEY, Name TEXT NOT NULL, Phone TEXT NOT NULL DEFAULT '', Address TEXT NOT NULL DEFAULT '', CreditLimit REAL NOT NULL DEFAULT 0, Balance REAL NOT NULL DEFAULT 0);",
                @"CREATE TABLE IF NOT EXISTS ""Supplier"" (Id TEXT PRIMARY KEY, Name TEXT NOT NULL, Phone TEXT NOT NULL DEFAULT '', Address TEXT NOT NULL DEFAULT '', Balance REAL NOT NULL DEFAULT 0);",
                @"CREATE TABLE IF NOT EXISTS ""Purchase"" (Id TEXT PRIMARY KEY, No TEXT NOT NULL, SupplierId TEXT REFERENCES ""Supplier""(Id), BranchId TEXT REFERENCES ""Branch""(Id), Total REAL NOT NULL DEFAULT 0, Paid REAL NOT NULL DEFAULT 0, Status TEXT NOT NULL DEFAULT 'COMPLETED', Date TEXT NOT NULL);",
                @"CREATE TABLE IF NOT EXISTS ""PurchaseItem"" (Id TEXT PRIMARY KEY, PurchaseId TEXT NOT NULL REFERENCES ""Purchase""(Id) ON DELETE CASCADE, ProductId TEXT NOT NULL REFERENCES ""Product""(Id), Qty REAL NOT NULL, Price REAL NOT NULL);",
                @"CREATE TABLE IF NOT EXISTS ""Sale"" (Id TEXT PRIMARY KEY, No TEXT NOT NULL, BranchId TEXT REFERENCES ""Branch""(Id), CustomerId TEXT REFERENCES ""Customer""(Id), CashierId TEXT REFERENCES ""User""(Id), Status TEXT NOT NULL DEFAULT 'COMPLETED', PayMethod TEXT NOT NULL DEFAULT 'CASH', Subtotal REAL NOT NULL DEFAULT 0, Discount REAL NOT NULL DEFAULT 0, Total REAL NOT NULL DEFAULT 0, Paid REAL NOT NULL DEFAULT 0, PayRef TEXT NOT NULL DEFAULT '', Date TEXT NOT NULL);",
                @"CREATE TABLE IF NOT EXISTS ""SaleItem"" (Id TEXT PRIMARY KEY, SaleId TEXT NOT NULL REFERENCES ""Sale""(Id) ON DELETE CASCADE, ProductId TEXT NOT NULL REFERENCES ""Product""(Id), Qty REAL NOT NULL, Price REAL NOT NULL);",
                @"CREATE TABLE IF NOT EXISTS ""Payment"" (Id TEXT PRIMARY KEY, SaleId TEXT REFERENCES ""Sale""(Id), CustomerId TEXT REFERENCES ""Customer""(Id), SupplierId TEXT REFERENCES ""Supplier""(Id), Amount REAL NOT NULL, Method TEXT NOT NULL DEFAULT 'CASH', Date TEXT NOT NULL, Note TEXT NOT NULL DEFAULT '');",
                @"CREATE TABLE IF NOT EXISTS ""Expense"" (Id TEXT PRIMARY KEY, BranchId TEXT REFERENCES ""Branch""(Id), Title TEXT NOT NULL, Amount REAL NOT NULL, Date TEXT NOT NULL, Note TEXT NOT NULL DEFAULT '');",
                @"CREATE TABLE IF NOT EXISTS ""CashShift"" (Id TEXT PRIMARY KEY, BranchId TEXT REFERENCES ""Branch""(Id), UserId TEXT REFERENCES ""User""(Id), Opening REAL NOT NULL DEFAULT 0, Closing REAL, OpenedAt TEXT NOT NULL, ClosedAt TEXT, Status TEXT NOT NULL DEFAULT 'OPEN');",
                @"CREATE TABLE IF NOT EXISTS ""StockMove"" (Id TEXT PRIMARY KEY, ProductId TEXT NOT NULL REFERENCES ""Product""(Id), Qty REAL NOT NULL, Type TEXT NOT NULL, Note TEXT NOT NULL DEFAULT '', Date TEXT NOT NULL, UserId TEXT REFERENCES ""User""(Id));",
                @"CREATE TABLE IF NOT EXISTS ""Return"" (Id TEXT PRIMARY KEY, SaleId TEXT REFERENCES ""Sale""(Id), ProductId TEXT REFERENCES ""Product""(Id), Qty REAL NOT NULL, Reason TEXT NOT NULL DEFAULT '', Date TEXT NOT NULL);",
                @"CREATE TABLE IF NOT EXISTS ""Damage"" (Id TEXT PRIMARY KEY, ProductId TEXT REFERENCES ""Product""(Id), Qty REAL NOT NULL, Reason TEXT NOT NULL DEFAULT '', Date TEXT NOT NULL);",
                @"CREATE TABLE IF NOT EXISTS ""CourierTask"" (Id TEXT PRIMARY KEY, SaleId TEXT NOT NULL REFERENCES ""Sale""(Id) ON DELETE CASCADE, CourierName TEXT NOT NULL DEFAULT '', Status TEXT NOT NULL DEFAULT 'PENDING', CodAmount REAL NOT NULL DEFAULT 0, Collected REAL NOT NULL DEFAULT 0, Date TEXT NOT NULL);",
                @"CREATE TABLE IF NOT EXISTS ""Employee"" (Id TEXT PRIMARY KEY, Name TEXT NOT NULL, Phone TEXT NOT NULL DEFAULT '', Title TEXT NOT NULL DEFAULT '', Salary REAL NOT NULL DEFAULT 0, CommissionRate REAL NOT NULL DEFAULT 0, Active INTEGER NOT NULL DEFAULT 1);",
                @"CREATE TABLE IF NOT EXISTS ""Attendance"" (Id TEXT PRIMARY KEY, EmployeeId TEXT NOT NULL REFERENCES ""Employee""(Id) ON DELETE CASCADE, Date TEXT NOT NULL, CheckIn TEXT, CheckOut TEXT, Minutes INTEGER NOT NULL DEFAULT 0);",
                @"CREATE TABLE IF NOT EXISTS ""EmployeeAdvance"" (Id TEXT PRIMARY KEY, EmployeeId TEXT NOT NULL REFERENCES ""Employee""(Id) ON DELETE CASCADE, Amount REAL NOT NULL, Date TEXT NOT NULL, Note TEXT NOT NULL DEFAULT '', Settled INTEGER NOT NULL DEFAULT 0);",
                @"CREATE TABLE IF NOT EXISTS ""MaintenanceTicket"" (Id TEXT PRIMARY KEY, No TEXT NOT NULL, CustomerName TEXT NOT NULL, CustomerPhone TEXT NOT NULL DEFAULT '', Device TEXT NOT NULL, Issue TEXT NOT NULL DEFAULT '', Status TEXT NOT NULL DEFAULT 'RECEIVED', Technician TEXT NOT NULL DEFAULT '', Cost REAL NOT NULL DEFAULT 0, Paid REAL NOT NULL DEFAULT 0, ReceivedAt TEXT NOT NULL, DeliveredAt TEXT);",
                @"CREATE TABLE IF NOT EXISTS ""TicketPart"" (Id TEXT PRIMARY KEY, TicketId TEXT NOT NULL REFERENCES ""MaintenanceTicket""(Id) ON DELETE CASCADE, Name TEXT NOT NULL, Price REAL NOT NULL DEFAULT 0);",
                @"CREATE TABLE IF NOT EXISTS ""AuditLog"" (Id TEXT PRIMARY KEY, UserId TEXT, Username TEXT NOT NULL DEFAULT '', Action TEXT NOT NULL, Entity TEXT NOT NULL, EntityId TEXT NOT NULL DEFAULT '', Details TEXT NOT NULL DEFAULT '', CreatedAt TEXT NOT NULL);",
                @"CREATE TABLE IF NOT EXISTS ""Notification"" (Id TEXT PRIMARY KEY, Channel TEXT NOT NULL DEFAULT 'WHATSAPP', ""To"" TEXT NOT NULL DEFAULT '', Template TEXT NOT NULL DEFAULT '', Body TEXT NOT NULL DEFAULT '', Status TEXT NOT NULL DEFAULT 'PENDING', Error TEXT NOT NULL DEFAULT '', RelatedType TEXT NOT NULL DEFAULT '', RelatedId TEXT NOT NULL DEFAULT '', CreatedAt TEXT NOT NULL, SentAt TEXT);",
                @"CREATE TABLE IF NOT EXISTS ""Stocktake"" (Id TEXT PRIMARY KEY, No TEXT NOT NULL, BranchId TEXT REFERENCES ""Branch""(Id), Note TEXT NOT NULL DEFAULT '', Status TEXT NOT NULL DEFAULT 'OPEN', CreatedAt TEXT NOT NULL, ClosedAt TEXT);",
                @"CREATE TABLE IF NOT EXISTS ""StocktakeItem"" (Id TEXT PRIMARY KEY, StocktakeId TEXT NOT NULL REFERENCES ""Stocktake""(Id) ON DELETE CASCADE, ProductId TEXT NOT NULL REFERENCES ""Product""(Id), SystemQty REAL NOT NULL, CountedQty REAL NOT NULL DEFAULT 0);",
                @"CREATE TABLE IF NOT EXISTS ""PendingSale"" (Id TEXT PRIMARY KEY, Payload TEXT NOT NULL, CreatedAt TEXT NOT NULL);",
                @"CREATE UNIQUE INDEX IF NOT EXISTS UX_User_Username ON ""User""(Username);",
                @"CREATE UNIQUE INDEX IF NOT EXISTS UX_Category_Name ON ""Category""(Name);",
                @"CREATE UNIQUE INDEX IF NOT EXISTS UX_Product_Sku ON ""Product""(Sku);",
                @"CREATE UNIQUE INDEX IF NOT EXISTS UX_Sale_No ON ""Sale""(No);",
                @"CREATE UNIQUE INDEX IF NOT EXISTS UX_Purchase_No ON ""Purchase""(No);",
                @"CREATE UNIQUE INDEX IF NOT EXISTS UX_Stocktake_No ON ""Stocktake""(No);",
                @"CREATE UNIQUE INDEX IF NOT EXISTS UX_Ticket_No ON ""MaintenanceTicket""(No);",
                @"CREATE UNIQUE INDEX IF NOT EXISTS UX_CourierTask_SaleId ON ""CourierTask""(SaleId);",
                @"CREATE UNIQUE INDEX IF NOT EXISTS UX_StocktakeItem_Pair ON ""StocktakeItem""(StocktakeId, ProductId);",
                @"CREATE INDEX IF NOT EXISTS IX_Sale_Date ON ""Sale""(Date);",
                @"CREATE INDEX IF NOT EXISTS IX_StockMove_Product_Date ON ""StockMove""(ProductId, Date);",
            };
        }
    }
}
