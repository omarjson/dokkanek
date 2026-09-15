using System;
using System.Collections.Generic;
using System.Data.SQLite;

namespace Dokkanek.Desktop.Data.Repositories
{
    // =====================================================================
    // RowRepositories — direct SQLite implementations of the Row contracts
    // declared in IRepositories.cs (ProductRow, SaleRow, PaymentRow, ...).
    //
    // Conventions used by every repository below:
    //   * System.Data.SQLite only, parameterized SQL only (no string concat
    //     of values into SQL), `using` blocks for every connection/command/
    //     reader, C# 7.3 (no records, no file-scoped namespaces).
    //   * Each ctor takes (string connectionString) and null-checks it.
    //   * New Ids: Guid.NewGuid().ToString("N").
    //   * Dates: stored as ISO8601 ("o") text via DateTime.Now; read back
    //     with DateTime.Parse/TryParse and a DateTime.Now fallback.
    //   * Booleans: INTEGER 0/1. Doubles: REAL.
    //   * Nullable foreign keys (BranchId, CustomerId, SupplierId, ...):
    //     null/empty is stored as NULL so FK enforcement is not tripped.
    //
    // Concurrency note: every repository here opens its own short-lived
    // connection per call (via Db.Open, which applies FK + WAL pragmas).
    // Multi-step writes are NOT atomic at the repo level. Services that
    // need atomicity (notably SaleService: sale header + items + payment +
    // stock moves) wrap their repo calls in SqliteUnitOfWork (Begin /
    // Commit / Rollback) below.
    // =====================================================================

    #region Helpers

    internal static class RowRepoHelper
    {
        internal static string NewId()
        {
            return Guid.NewGuid().ToString("N");
        }

        internal static string ToText(DateTime dt)
        {
            if (dt == default(DateTime))
            {
                dt = DateTime.Now;
            }
            return dt.ToString("o");
        }

        internal static DateTime ParseDate(SQLiteDataReader r, int i)
        {
            if (r.IsDBNull(i))
            {
                return DateTime.Now;
            }
            object v = r.GetValue(i);
            if (v is DateTime)
            {
                return (DateTime)v;
            }
            string s = Convert.ToString(v);
            DateTime dt;
            if (!string.IsNullOrEmpty(s) && DateTime.TryParse(s, out dt))
            {
                return dt;
            }
            return DateTime.Now;
        }

        internal static string Str(SQLiteDataReader r, int i)
        {
            if (r.IsDBNull(i))
            {
                return string.Empty;
            }
            return Convert.ToString(r.GetValue(i));
        }

        internal static string StrNull(SQLiteDataReader r, int i)
        {
            if (r.IsDBNull(i))
            {
                return null;
            }
            return Convert.ToString(r.GetValue(i));
        }

        internal static double Dbl(SQLiteDataReader r, int i)
        {
            if (r.IsDBNull(i))
            {
                return 0d;
            }
            return Convert.ToDouble(r.GetValue(i));
        }

        internal static int Int32(SQLiteDataReader r, int i)
        {
            if (r.IsDBNull(i))
            {
                return 0;
            }
            return Convert.ToInt32(r.GetValue(i));
        }

        internal static bool Bool01(SQLiteDataReader r, int i)
        {
            if (r.IsDBNull(i))
            {
                return false;
            }
            return Convert.ToInt32(r.GetValue(i)) != 0;
        }

        /// <summary>Nullable FK / optional text: null or "" becomes NULL.</summary>
        internal static object Fk(string v)
        {
            if (string.IsNullOrEmpty(v))
            {
                return DBNull.Value;
            }
            return v;
        }

        /// <summary>Required text: null becomes "" (columns are NOT NULL).</summary>
        internal static object Req(string v)
        {
            if (v == null)
            {
                return string.Empty;
            }
            return v;
        }

        internal static void AddTake(SQLiteCommand cmd, int take)
        {
            if (take <= 0)
            {
                take = 50;
            }
            cmd.Parameters.AddWithValue("@take", take);
        }
    }

    #endregion

    #region Unit of work

    /// <summary>
    /// Simple unit of work over a single SQLite connection.
    /// SaleService wraps its multi-repo writes (sale + items + payment +
    /// stock moves) in Begin/Commit/Rollback. Repositories in this file each
    /// open their own connection for simplicity and do not enlist; the
    /// internal Connection/Transaction properties are exposed so future
    /// repo code can enlist its commands in this transaction.
    /// </summary>
    public sealed class SqliteUnitOfWork : IUnitOfWork
    {
        private readonly string _connectionString;
        private SQLiteConnection _conn;
        private bool _inTransaction;
        private bool _disposed;

        public SqliteUnitOfWork(string connectionString)
        {
            if (connectionString == null)
            {
                throw new ArgumentNullException("connectionString");
            }
            _connectionString = connectionString;
            _conn = Db.Open(_connectionString);
        }

        /// <summary>Live connection owned by this unit of work.</summary>
        internal SQLiteConnection Connection
        {
            get { return _conn; }
        }

        /// <summary>
        /// Reserved for API-level enlistment (cmd.Transaction). This unit of
        /// work drives its transaction with raw BEGIN IMMEDIATE / COMMIT /
        /// ROLLBACK commands (see Begin), so no SQLiteTransaction object is
        /// held; this stays null until a future API-level implementation.
        /// </summary>
        internal SQLiteTransaction Transaction
        {
            get { return null; }
        }

        internal bool InTransaction
        {
            get { return _inTransaction; }
        }

        public void Begin()
        {
            if (_disposed)
            {
                throw new ObjectDisposedException("SqliteUnitOfWork");
            }
            if (_inTransaction)
            {
                return;
            }
            using (SQLiteCommand cmd = _conn.CreateCommand())
            {
                // IMMEDIATE reserves the database up-front (write intent) so
                // concurrent writers fail fast instead of deadlocking at COMMIT.
                cmd.CommandText = "BEGIN IMMEDIATE;";
                cmd.ExecuteNonQuery();
            }
            _inTransaction = true;
        }

        public void Commit()
        {
            if (_disposed)
            {
                throw new ObjectDisposedException("SqliteUnitOfWork");
            }
            if (!_inTransaction)
            {
                return;
            }
            try
            {
                using (SQLiteCommand cmd = _conn.CreateCommand())
                {
                    cmd.CommandText = "COMMIT;";
                    cmd.ExecuteNonQuery();
                }
            }
            finally
            {
                _inTransaction = false;
            }
        }

        public void Rollback()
        {
            if (_disposed)
            {
                throw new ObjectDisposedException("SqliteUnitOfWork");
            }
            if (!_inTransaction)
            {
                return;
            }
            try
            {
                using (SQLiteCommand cmd = _conn.CreateCommand())
                {
                    cmd.CommandText = "ROLLBACK;";
                    cmd.ExecuteNonQuery();
                }
            }
            catch (Exception)
            {
                // Rollback is best-effort (typically called from a failure
                // path); never mask the original error.
            }
            finally
            {
                _inTransaction = false;
            }
        }

        public void Dispose()
        {
            if (_disposed)
            {
                return;
            }
            _disposed = true;
            if (_inTransaction)
            {
                try
                {
                    using (SQLiteCommand cmd = _conn.CreateCommand())
                    {
                        cmd.CommandText = "ROLLBACK;";
                        cmd.ExecuteNonQuery();
                    }
                }
                catch (Exception)
                {
                }
                _inTransaction = false;
            }
            if (_conn != null)
            {
                _conn.Dispose();
                _conn = null;
            }
        }
    }

    #endregion

    #region Payment

    public class PaymentRowRepository : IPaymentRepository
    {
        private readonly string _connectionString;

        public PaymentRowRepository(string connectionString)
        {
            if (connectionString == null)
            {
                throw new ArgumentNullException("connectionString");
            }
            _connectionString = connectionString;
        }

        public void Add(PaymentRow row)
        {
            if (row == null)
            {
                throw new ArgumentNullException("row");
            }
            if (string.IsNullOrEmpty(row.Id))
            {
                row.Id = RowRepoHelper.NewId();
            }
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "INSERT INTO \"Payment\"(Id, SaleId, CustomerId, SupplierId, Amount, Method, Date, Note) VALUES(@id,@sale,@cust,@sup,@amount,@method,@date,@note);";
                    cmd.Parameters.AddWithValue("@id", row.Id);
                    cmd.Parameters.AddWithValue("@sale", RowRepoHelper.Fk(row.SaleId));
                    cmd.Parameters.AddWithValue("@cust", RowRepoHelper.Fk(row.CustomerId));
                    cmd.Parameters.AddWithValue("@sup", RowRepoHelper.Fk(row.SupplierId));
                    cmd.Parameters.AddWithValue("@amount", row.Amount);
                    cmd.Parameters.AddWithValue("@method", RowRepoHelper.Req(row.Method));
                    cmd.Parameters.AddWithValue("@date", RowRepoHelper.ToText(row.Date));
                    cmd.Parameters.AddWithValue("@note", RowRepoHelper.Req(row.Note));
                    cmd.ExecuteNonQuery();
                }
            }
        }

        public double SumCashSince(DateTime since)
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT COALESCE(SUM(Amount), 0) FROM \"Payment\" WHERE Method = 'CASH' AND Date >= @since;";
                    cmd.Parameters.AddWithValue("@since", since.ToString("o"));
                    object v = cmd.ExecuteScalar();
                    if (v == null || v == DBNull.Value)
                    {
                        return 0d;
                    }
                    return Convert.ToDouble(v);
                }
            }
        }
    }

    #endregion

    #region Purchase

    public class PurchaseRowRepository : IPurchaseRepository
    {
        private readonly string _connectionString;

        public PurchaseRowRepository(string connectionString)
        {
            if (connectionString == null)
            {
                throw new ArgumentNullException("connectionString");
            }
            _connectionString = connectionString;
        }

        public void Create(PurchaseRow p)
        {
            if (p == null)
            {
                throw new ArgumentNullException("p");
            }
            if (string.IsNullOrEmpty(p.Id))
            {
                p.Id = RowRepoHelper.NewId();
            }
            string status = string.IsNullOrEmpty(p.Status) ? "COMPLETED" : p.Status;
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "INSERT INTO \"Purchase\"(Id, No, SupplierId, BranchId, Total, Paid, Status, Date) VALUES(@id,@no,@sup,@branch,@total,@paid,@status,@date);";
                    cmd.Parameters.AddWithValue("@id", p.Id);
                    cmd.Parameters.AddWithValue("@no", RowRepoHelper.Req(p.No));
                    cmd.Parameters.AddWithValue("@sup", RowRepoHelper.Fk(p.SupplierId));
                    cmd.Parameters.AddWithValue("@branch", RowRepoHelper.Fk(p.BranchId));
                    cmd.Parameters.AddWithValue("@total", p.Total);
                    cmd.Parameters.AddWithValue("@paid", p.Paid);
                    cmd.Parameters.AddWithValue("@status", status);
                    cmd.Parameters.AddWithValue("@date", RowRepoHelper.ToText(p.Date));
                    cmd.ExecuteNonQuery();
                }
            }
        }

        public void AddItem(PurchaseItemRow item)
        {
            if (item == null)
            {
                throw new ArgumentNullException("item");
            }
            string id = RowRepoHelper.NewId();
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "INSERT INTO \"PurchaseItem\"(Id, PurchaseId, ProductId, Qty, Price) VALUES(@id,@pur,@prod,@qty,@price);";
                    cmd.Parameters.AddWithValue("@id", id);
                    cmd.Parameters.AddWithValue("@pur", RowRepoHelper.Req(item.PurchaseId));
                    cmd.Parameters.AddWithValue("@prod", RowRepoHelper.Req(item.ProductId));
                    cmd.Parameters.AddWithValue("@qty", item.Qty);
                    cmd.Parameters.AddWithValue("@price", item.Price);
                    cmd.ExecuteNonQuery();
                }
            }
        }

        public IList<PurchaseRow> ListRecent(int take)
        {
            List<PurchaseRow> list = new List<PurchaseRow>();
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT Id, No, SupplierId, BranchId, Total, Paid, Status, Date FROM \"Purchase\" ORDER BY Date DESC LIMIT @take;";
                    RowRepoHelper.AddTake(cmd, take);
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

        private static PurchaseRow Map(SQLiteDataReader r)
        {
            PurchaseRow p = new PurchaseRow();
            p.Id = RowRepoHelper.Str(r, 0);
            p.No = RowRepoHelper.Str(r, 1);
            p.SupplierId = RowRepoHelper.StrNull(r, 2);
            p.BranchId = RowRepoHelper.StrNull(r, 3);
            p.Total = RowRepoHelper.Dbl(r, 4);
            p.Paid = RowRepoHelper.Dbl(r, 5);
            p.Status = RowRepoHelper.Str(r, 6);
            p.Date = RowRepoHelper.ParseDate(r, 7);
            return p;
        }
    }

    #endregion

    #region Expense

    public class ExpenseRowRepository : IExpenseRepository
    {
        private readonly string _connectionString;

        public ExpenseRowRepository(string connectionString)
        {
            if (connectionString == null)
            {
                throw new ArgumentNullException("connectionString");
            }
            _connectionString = connectionString;
        }

        public void Add(ExpenseRow e)
        {
            if (e == null)
            {
                throw new ArgumentNullException("e");
            }
            if (string.IsNullOrEmpty(e.Id))
            {
                e.Id = RowRepoHelper.NewId();
            }
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "INSERT INTO \"Expense\"(Id, BranchId, Title, Amount, Date, Note) VALUES(@id,@branch,@title,@amount,@date,@note);";
                    cmd.Parameters.AddWithValue("@id", e.Id);
                    cmd.Parameters.AddWithValue("@branch", RowRepoHelper.Fk(e.BranchId));
                    cmd.Parameters.AddWithValue("@title", RowRepoHelper.Req(e.Title));
                    cmd.Parameters.AddWithValue("@amount", e.Amount);
                    cmd.Parameters.AddWithValue("@date", RowRepoHelper.ToText(e.Date));
                    cmd.Parameters.AddWithValue("@note", RowRepoHelper.Req(e.Note));
                    cmd.ExecuteNonQuery();
                }
            }
        }

        public void Delete(string id)
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "DELETE FROM \"Expense\" WHERE Id = @id;";
                    cmd.Parameters.AddWithValue("@id", RowRepoHelper.Req(id));
                    cmd.ExecuteNonQuery();
                }
            }
        }

        public IList<ExpenseRow> ListRecent(int take)
        {
            List<ExpenseRow> list = new List<ExpenseRow>();
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT Id, BranchId, Title, Amount, Date, Note FROM \"Expense\" ORDER BY Date DESC LIMIT @take;";
                    RowRepoHelper.AddTake(cmd, take);
                    using (SQLiteDataReader r = cmd.ExecuteReader())
                    {
                        while (r.Read())
                        {
                            ExpenseRow e = new ExpenseRow();
                            e.Id = RowRepoHelper.Str(r, 0);
                            e.BranchId = RowRepoHelper.StrNull(r, 1);
                            e.Title = RowRepoHelper.Str(r, 2);
                            e.Amount = RowRepoHelper.Dbl(r, 3);
                            e.Date = RowRepoHelper.ParseDate(r, 4);
                            e.Note = RowRepoHelper.Str(r, 5);
                            list.Add(e);
                        }
                    }
                }
            }
            return list;
        }
    }

    #endregion

    #region Shift

    public class ShiftRowRepository : IShiftRepository
    {
        private readonly string _connectionString;

        public ShiftRowRepository(string connectionString)
        {
            if (connectionString == null)
            {
                throw new ArgumentNullException("connectionString");
            }
            _connectionString = connectionString;
        }

        public CashShiftRow GetOpen()
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT Id, BranchId, UserId, Opening, Closing, OpenedAt, ClosedAt, Status FROM \"CashShift\" WHERE Status = 'OPEN' ORDER BY OpenedAt DESC LIMIT 1;";
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

        public void Add(CashShiftRow s)
        {
            if (s == null)
            {
                throw new ArgumentNullException("s");
            }
            if (string.IsNullOrEmpty(s.Id))
            {
                s.Id = RowRepoHelper.NewId();
            }
            string status = string.IsNullOrEmpty(s.Status) ? "OPEN" : s.Status;
            object closing = s.HasClosing ? (object)s.Closing : DBNull.Value;
            object closedAt = s.HasClosing ? (object)RowRepoHelper.ToText(s.ClosedAt) : DBNull.Value;
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "INSERT INTO \"CashShift\"(Id, BranchId, UserId, Opening, Closing, OpenedAt, ClosedAt, Status) VALUES(@id,@branch,@user,@opening,@closing,@opened,@closed,@status);";
                    cmd.Parameters.AddWithValue("@id", s.Id);
                    cmd.Parameters.AddWithValue("@branch", RowRepoHelper.Fk(s.BranchId));
                    cmd.Parameters.AddWithValue("@user", RowRepoHelper.Fk(s.UserId));
                    cmd.Parameters.AddWithValue("@opening", s.Opening);
                    cmd.Parameters.AddWithValue("@closing", closing);
                    cmd.Parameters.AddWithValue("@opened", RowRepoHelper.ToText(s.OpenedAt));
                    cmd.Parameters.AddWithValue("@closed", closedAt);
                    cmd.Parameters.AddWithValue("@status", status);
                    cmd.ExecuteNonQuery();
                }
            }
        }

        public void Close(string id, double closing, DateTime closedAt)
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "UPDATE \"CashShift\" SET Closing = @closing, ClosedAt = @closed, Status = 'CLOSED' WHERE Id = @id AND Status = 'OPEN';";
                    cmd.Parameters.AddWithValue("@closing", closing);
                    cmd.Parameters.AddWithValue("@closed", RowRepoHelper.ToText(closedAt));
                    cmd.Parameters.AddWithValue("@id", RowRepoHelper.Req(id));
                    cmd.ExecuteNonQuery();
                }
            }
        }

        public IList<CashShiftRow> ListRecent(int take)
        {
            List<CashShiftRow> list = new List<CashShiftRow>();
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT Id, BranchId, UserId, Opening, Closing, OpenedAt, ClosedAt, Status FROM \"CashShift\" ORDER BY OpenedAt DESC LIMIT @take;";
                    RowRepoHelper.AddTake(cmd, take);
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

        private static CashShiftRow Map(SQLiteDataReader r)
        {
            CashShiftRow s = new CashShiftRow();
            s.Id = RowRepoHelper.Str(r, 0);
            s.BranchId = RowRepoHelper.StrNull(r, 1);
            s.UserId = RowRepoHelper.StrNull(r, 2);
            s.Opening = RowRepoHelper.Dbl(r, 3);
            s.HasClosing = !r.IsDBNull(4);
            s.Closing = s.HasClosing ? RowRepoHelper.Dbl(r, 4) : 0d;
            s.OpenedAt = RowRepoHelper.ParseDate(r, 5);
            if (!r.IsDBNull(6))
            {
                s.ClosedAt = RowRepoHelper.ParseDate(r, 6);
            }
            else
            {
                s.ClosedAt = default(DateTime);
            }
            s.Status = RowRepoHelper.Str(r, 7);
            return s;
        }
    }

    #endregion

    #region Stocktake

    public class StocktakeRowRepository : IStocktakeRepository
    {
        private readonly string _connectionString;

        public StocktakeRowRepository(string connectionString)
        {
            if (connectionString == null)
            {
                throw new ArgumentNullException("connectionString");
            }
            _connectionString = connectionString;
        }

        public void Create(StocktakeRow st)
        {
            if (st == null)
            {
                throw new ArgumentNullException("st");
            }
            if (string.IsNullOrEmpty(st.Id))
            {
                st.Id = RowRepoHelper.NewId();
            }
            string status = string.IsNullOrEmpty(st.Status) ? "OPEN" : st.Status;
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "INSERT INTO \"Stocktake\"(Id, No, BranchId, Note, Status, CreatedAt, ClosedAt) VALUES(@id,@no,@branch,@note,@status,@created,@closed);";
                    cmd.Parameters.AddWithValue("@id", st.Id);
                    cmd.Parameters.AddWithValue("@no", RowRepoHelper.Req(st.No));
                    cmd.Parameters.AddWithValue("@branch", RowRepoHelper.Fk(st.BranchId));
                    cmd.Parameters.AddWithValue("@note", RowRepoHelper.Req(st.Note));
                    cmd.Parameters.AddWithValue("@status", status);
                    cmd.Parameters.AddWithValue("@created", RowRepoHelper.ToText(st.CreatedAt));
                    cmd.Parameters.AddWithValue("@closed", DBNull.Value);
                    cmd.ExecuteNonQuery();
                }
            }
        }

        public StocktakeRow GetById(string id)
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT Id, No, BranchId, Note, Status, CreatedAt, ClosedAt FROM \"Stocktake\" WHERE Id = @id;";
                    cmd.Parameters.AddWithValue("@id", RowRepoHelper.Req(id));
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

        public IList<StocktakeRow> ListRecent(int take)
        {
            List<StocktakeRow> list = new List<StocktakeRow>();
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT Id, No, BranchId, Note, Status, CreatedAt, ClosedAt FROM \"Stocktake\" ORDER BY CreatedAt DESC LIMIT @take;";
                    RowRepoHelper.AddTake(cmd, take);
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

        public void UpsertItem(StocktakeItemRow item)
        {
            if (item == null)
            {
                throw new ArgumentNullException("item");
            }
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                int affected;
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    // Baseline freeze: a recount must never overwrite SystemQty
                    // (web parity: upsert updates countedQty only).
                    cmd.CommandText = "UPDATE \"StocktakeItem\" SET CountedQty = @counted WHERE StocktakeId = @st AND ProductId = @prod;";
                    cmd.Parameters.AddWithValue("@counted", item.CountedQty);
                    cmd.Parameters.AddWithValue("@st", RowRepoHelper.Req(item.StocktakeId));
                    cmd.Parameters.AddWithValue("@prod", RowRepoHelper.Req(item.ProductId));
                    affected = cmd.ExecuteNonQuery();
                }
                if (affected == 0)
                {
                    using (SQLiteCommand cmd = conn.CreateCommand())
                    {
                        cmd.CommandText = "INSERT INTO \"StocktakeItem\"(Id, StocktakeId, ProductId, SystemQty, CountedQty) VALUES(@id,@st,@prod,@sys,@counted);";
                        cmd.Parameters.AddWithValue("@id", RowRepoHelper.NewId());
                        cmd.Parameters.AddWithValue("@st", RowRepoHelper.Req(item.StocktakeId));
                        cmd.Parameters.AddWithValue("@prod", RowRepoHelper.Req(item.ProductId));
                        cmd.Parameters.AddWithValue("@sys", item.SystemQty);
                        cmd.Parameters.AddWithValue("@counted", item.CountedQty);
                        cmd.ExecuteNonQuery();
                    }
                }
            }
        }

        public IList<StocktakeItemRow> GetItems(string stocktakeId)
        {
            List<StocktakeItemRow> list = new List<StocktakeItemRow>();
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT StocktakeId, ProductId, SystemQty, CountedQty FROM \"StocktakeItem\" WHERE StocktakeId = @st ORDER BY rowid ASC;";
                    cmd.Parameters.AddWithValue("@st", RowRepoHelper.Req(stocktakeId));
                    using (SQLiteDataReader r = cmd.ExecuteReader())
                    {
                        while (r.Read())
                        {
                            StocktakeItemRow item = new StocktakeItemRow();
                            item.StocktakeId = RowRepoHelper.Str(r, 0);
                            item.ProductId = RowRepoHelper.Str(r, 1);
                            item.SystemQty = RowRepoHelper.Dbl(r, 2);
                            item.CountedQty = RowRepoHelper.Dbl(r, 3);
                            // Presence in StocktakeItem means the line was recorded.
                            item.HasCounted = true;
                            list.Add(item);
                        }
                    }
                }
            }
            return list;
        }

        public void UpdateStatus(string id, string status)
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "UPDATE \"Stocktake\" SET Status = @status WHERE Id = @id;";
                    cmd.Parameters.AddWithValue("@status", RowRepoHelper.Req(status));
                    cmd.Parameters.AddWithValue("@id", RowRepoHelper.Req(id));
                    cmd.ExecuteNonQuery();
                }
            }
        }

        private static StocktakeRow Map(SQLiteDataReader r)
        {
            StocktakeRow st = new StocktakeRow();
            st.Id = RowRepoHelper.Str(r, 0);
            st.No = RowRepoHelper.Str(r, 1);
            st.BranchId = RowRepoHelper.StrNull(r, 2);
            st.Note = RowRepoHelper.Str(r, 3);
            st.Status = RowRepoHelper.Str(r, 4);
            st.CreatedAt = RowRepoHelper.ParseDate(r, 5);
            if (!r.IsDBNull(6))
            {
                st.ClosedAt = RowRepoHelper.ParseDate(r, 6);
                st.HasClosedAt = true;
            }
            return st;
        }

        public void MarkClosed(string id, DateTime closedAt)
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "UPDATE \"Stocktake\" SET Status = 'CLOSED', ClosedAt = @closed WHERE Id = @id AND Status = 'OPEN';";
                    cmd.Parameters.AddWithValue("@closed", RowRepoHelper.ToText(closedAt));
                    cmd.Parameters.AddWithValue("@id", RowRepoHelper.Req(id));
                    cmd.ExecuteNonQuery();
                }
            }
        }
    }

    #endregion

    #region Return

    public class ReturnRowRepository : IReturnRepository
    {
        private readonly string _connectionString;

        public ReturnRowRepository(string connectionString)
        {
            if (connectionString == null)
            {
                throw new ArgumentNullException("connectionString");
            }
            _connectionString = connectionString;
        }

        public void AddReturn(ReturnRow r)
        {
            if (r == null)
            {
                throw new ArgumentNullException("r");
            }
            if (string.IsNullOrEmpty(r.Id))
            {
                r.Id = RowRepoHelper.NewId();
            }
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "INSERT INTO \"Return\"(Id, SaleId, ProductId, Qty, Reason, Date) VALUES(@id,@sale,@prod,@qty,@reason,@date);";
                    cmd.Parameters.AddWithValue("@id", r.Id);
                    cmd.Parameters.AddWithValue("@sale", RowRepoHelper.Fk(r.SaleId));
                    cmd.Parameters.AddWithValue("@prod", RowRepoHelper.Fk(r.ProductId));
                    cmd.Parameters.AddWithValue("@qty", r.Qty);
                    cmd.Parameters.AddWithValue("@reason", RowRepoHelper.Req(r.Reason));
                    cmd.Parameters.AddWithValue("@date", RowRepoHelper.ToText(r.Date));
                    cmd.ExecuteNonQuery();
                }
            }
        }

        public void AddDamage(DamageRow d)
        {
            if (d == null)
            {
                throw new ArgumentNullException("d");
            }
            if (string.IsNullOrEmpty(d.Id))
            {
                d.Id = RowRepoHelper.NewId();
            }
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "INSERT INTO \"Damage\"(Id, ProductId, Qty, Reason, Date) VALUES(@id,@prod,@qty,@reason,@date);";
                    cmd.Parameters.AddWithValue("@id", d.Id);
                    cmd.Parameters.AddWithValue("@prod", RowRepoHelper.Fk(d.ProductId));
                    cmd.Parameters.AddWithValue("@qty", d.Qty);
                    cmd.Parameters.AddWithValue("@reason", RowRepoHelper.Req(d.Reason));
                    cmd.Parameters.AddWithValue("@date", RowRepoHelper.ToText(d.Date));
                    cmd.ExecuteNonQuery();
                }
            }
        }
    }

    #endregion

    #region Courier

    public class CourierRowRepository : ICourierRepository
    {
        private readonly string _connectionString;

        public CourierRowRepository(string connectionString)
        {
            if (connectionString == null)
            {
                throw new ArgumentNullException("connectionString");
            }
            _connectionString = connectionString;
        }

        public void Add(CourierTaskRow t)
        {
            if (t == null)
            {
                throw new ArgumentNullException("t");
            }
            if (string.IsNullOrEmpty(t.Id))
            {
                t.Id = RowRepoHelper.NewId();
            }
            string status = string.IsNullOrEmpty(t.Status) ? "PENDING" : t.Status;
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "INSERT INTO \"CourierTask\"(Id, SaleId, CourierName, Status, CodAmount, Collected, Date) VALUES(@id,@sale,@courier,@status,@cod,@collected,@date);";
                    cmd.Parameters.AddWithValue("@id", t.Id);
                    cmd.Parameters.AddWithValue("@sale", RowRepoHelper.Req(t.SaleId));
                    cmd.Parameters.AddWithValue("@courier", RowRepoHelper.Req(t.CourierName));
                    cmd.Parameters.AddWithValue("@status", status);
                    cmd.Parameters.AddWithValue("@cod", t.CodAmount);
                    cmd.Parameters.AddWithValue("@collected", t.Collected);
                    cmd.Parameters.AddWithValue("@date", RowRepoHelper.ToText(t.Date));
                    cmd.ExecuteNonQuery();
                }
            }
        }

        public CourierTaskRow GetBySale(string saleId)
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT Id, SaleId, CourierName, Status, CodAmount, Collected, Date FROM \"CourierTask\" WHERE SaleId = @sale LIMIT 1;";
                    cmd.Parameters.AddWithValue("@sale", RowRepoHelper.Req(saleId));
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

        public void DeleteBySale(string saleId)
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "DELETE FROM \"CourierTask\" WHERE SaleId = @sale;";
                    cmd.Parameters.AddWithValue("@sale", RowRepoHelper.Req(saleId));
                    cmd.ExecuteNonQuery();
                }
            }
        }

        public void UpdateStatus(string saleId, string status, double collected)
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "UPDATE \"CourierTask\" SET Status = @status, Collected = @collected WHERE SaleId = @sale;";
                    cmd.Parameters.AddWithValue("@status", RowRepoHelper.Req(status));
                    cmd.Parameters.AddWithValue("@collected", collected);
                    cmd.Parameters.AddWithValue("@sale", RowRepoHelper.Req(saleId));
                    cmd.ExecuteNonQuery();
                }
            }
        }

        public IList<CourierTaskRow> List(int take)
        {
            List<CourierTaskRow> list = new List<CourierTaskRow>();
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT Id, SaleId, CourierName, Status, CodAmount, Collected, Date FROM \"CourierTask\" ORDER BY Date DESC LIMIT @take;";
                    RowRepoHelper.AddTake(cmd, take);
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

        private static CourierTaskRow Map(SQLiteDataReader r)
        {
            CourierTaskRow t = new CourierTaskRow();
            t.Id = RowRepoHelper.Str(r, 0);
            t.SaleId = RowRepoHelper.Str(r, 1);
            t.CourierName = RowRepoHelper.Str(r, 2);
            t.Status = RowRepoHelper.Str(r, 3);
            t.CodAmount = RowRepoHelper.Dbl(r, 4);
            t.Collected = RowRepoHelper.Dbl(r, 5);
            t.Date = RowRepoHelper.ParseDate(r, 6);
            return t;
        }
    }

    #endregion

    #region Employee

    public class EmployeeRowRepository : IEmployeeRepository
    {
        private readonly string _connectionString;

        public EmployeeRowRepository(string connectionString)
        {
            if (connectionString == null)
            {
                throw new ArgumentNullException("connectionString");
            }
            _connectionString = connectionString;
        }

        public EmployeeRow GetById(string id)
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT Id, Name, Phone, Title, Salary, CommissionRate, Active FROM \"Employee\" WHERE Id = @id;";
                    cmd.Parameters.AddWithValue("@id", RowRepoHelper.Req(id));
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

        public IList<EmployeeRow> List()
        {
            List<EmployeeRow> list = new List<EmployeeRow>();
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT Id, Name, Phone, Title, Salary, CommissionRate, Active FROM \"Employee\" ORDER BY Name ASC;";
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

        public void Add(EmployeeRow e)
        {
            if (e == null)
            {
                throw new ArgumentNullException("e");
            }
            if (string.IsNullOrEmpty(e.Id))
            {
                e.Id = RowRepoHelper.NewId();
            }
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "INSERT INTO \"Employee\"(Id, Name, Phone, Title, Salary, CommissionRate, Active) VALUES(@id,@name,@phone,@title,@salary,@comm,@active);";
                    cmd.Parameters.AddWithValue("@id", e.Id);
                    cmd.Parameters.AddWithValue("@name", RowRepoHelper.Req(e.Name));
                    cmd.Parameters.AddWithValue("@phone", RowRepoHelper.Req(e.Phone));
                    cmd.Parameters.AddWithValue("@title", RowRepoHelper.Req(e.Title));
                    cmd.Parameters.AddWithValue("@salary", e.Salary);
                    cmd.Parameters.AddWithValue("@comm", e.CommissionRate);
                    cmd.Parameters.AddWithValue("@active", e.Active ? 1 : 0);
                    cmd.ExecuteNonQuery();
                }
            }
        }

        public void AddAdvance(AdvanceRow a)
        {
            if (a == null)
            {
                throw new ArgumentNullException("a");
            }
            if (string.IsNullOrEmpty(a.Id))
            {
                a.Id = RowRepoHelper.NewId();
            }
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "INSERT INTO \"EmployeeAdvance\"(Id, EmployeeId, Amount, Date, Note, Settled) VALUES(@id,@emp,@amount,@date,@note,@settled);";
                    cmd.Parameters.AddWithValue("@id", a.Id);
                    cmd.Parameters.AddWithValue("@emp", RowRepoHelper.Req(a.EmployeeId));
                    cmd.Parameters.AddWithValue("@amount", a.Amount);
                    cmd.Parameters.AddWithValue("@date", RowRepoHelper.ToText(a.Date));
                    cmd.Parameters.AddWithValue("@note", RowRepoHelper.Req(a.Note));
                    cmd.Parameters.AddWithValue("@settled", a.Settled ? 1 : 0);
                    cmd.ExecuteNonQuery();
                }
            }
        }

        public AdvanceRow GetAdvance(string id)
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT Id, EmployeeId, Amount, Date, Note, Settled FROM \"EmployeeAdvance\" WHERE Id = @id;";
                    cmd.Parameters.AddWithValue("@id", RowRepoHelper.Req(id));
                    using (SQLiteDataReader r = cmd.ExecuteReader())
                    {
                        if (r.Read())
                        {
                            AdvanceRow a = new AdvanceRow();
                            a.Id = RowRepoHelper.Str(r, 0);
                            a.EmployeeId = RowRepoHelper.Str(r, 1);
                            a.Amount = RowRepoHelper.Dbl(r, 2);
                            a.Date = RowRepoHelper.ParseDate(r, 3);
                            a.Note = RowRepoHelper.Str(r, 4);
                            a.Settled = RowRepoHelper.Bool01(r, 5);
                            return a;
                        }
                    }
                }
            }
            return null;
        }

        public void SettleAdvance(string id)
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "UPDATE \"EmployeeAdvance\" SET Settled = 1 WHERE Id = @id;";
                    cmd.Parameters.AddWithValue("@id", RowRepoHelper.Req(id));
                    cmd.ExecuteNonQuery();
                }
            }
        }

        public void RecordAttendance(AttendanceRow a)
        {
            if (a == null)
            {
                throw new ArgumentNullException("a");
            }
            object checkOut = a.HasCheckOut ? (object)RowRepoHelper.ToText(a.CheckOut) : DBNull.Value;
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "INSERT INTO \"Attendance\"(Id, EmployeeId, Date, CheckIn, CheckOut, Minutes) VALUES(@id,@emp,@date,@in,@out,@min);";
                    cmd.Parameters.AddWithValue("@id", RowRepoHelper.NewId());
                    cmd.Parameters.AddWithValue("@emp", RowRepoHelper.Req(a.EmployeeId));
                    cmd.Parameters.AddWithValue("@date", RowRepoHelper.ToText(a.Date));
                    cmd.Parameters.AddWithValue("@in", RowRepoHelper.ToText(a.CheckIn));
                    cmd.Parameters.AddWithValue("@out", checkOut);
                    cmd.Parameters.AddWithValue("@min", a.Minutes);
                    cmd.ExecuteNonQuery();
                }
            }
        }

        private static EmployeeRow Map(SQLiteDataReader r)
        {
            EmployeeRow e = new EmployeeRow();
            e.Id = RowRepoHelper.Str(r, 0);
            e.Name = RowRepoHelper.Str(r, 1);
            e.Phone = RowRepoHelper.Str(r, 2);
            e.Title = RowRepoHelper.Str(r, 3);
            e.Salary = RowRepoHelper.Dbl(r, 4);
            e.CommissionRate = RowRepoHelper.Dbl(r, 5);
            e.Active = RowRepoHelper.Bool01(r, 6);
            return e;
        }
    }

    #endregion

    #region Ticket

    public class TicketRowRepository : ITicketRepository
    {
        private readonly string _connectionString;

        public TicketRowRepository(string connectionString)
        {
            if (connectionString == null)
            {
                throw new ArgumentNullException("connectionString");
            }
            _connectionString = connectionString;
        }

        public void Add(TicketRow t)
        {
            if (t == null)
            {
                throw new ArgumentNullException("t");
            }
            if (string.IsNullOrEmpty(t.Id))
            {
                t.Id = RowRepoHelper.NewId();
            }
            string status = string.IsNullOrEmpty(t.Status) ? "RECEIVED" : t.Status;
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "INSERT INTO \"MaintenanceTicket\"(Id, No, CustomerName, CustomerPhone, Device, Issue, Status, Technician, Cost, Paid, ReceivedAt, DeliveredAt) VALUES(@id,@no,@cname,@cphone,@device,@issue,@status,@tech,@cost,@paid,@recv,@deliv);";
                    cmd.Parameters.AddWithValue("@id", t.Id);
                    cmd.Parameters.AddWithValue("@no", RowRepoHelper.Req(t.No));
                    cmd.Parameters.AddWithValue("@cname", RowRepoHelper.Req(t.CustomerName));
                    cmd.Parameters.AddWithValue("@cphone", RowRepoHelper.Req(t.CustomerPhone));
                    cmd.Parameters.AddWithValue("@device", RowRepoHelper.Req(t.Device));
                    cmd.Parameters.AddWithValue("@issue", RowRepoHelper.Req(t.Issue));
                    cmd.Parameters.AddWithValue("@status", status);
                    cmd.Parameters.AddWithValue("@tech", RowRepoHelper.Req(t.Technician));
                    cmd.Parameters.AddWithValue("@cost", t.Cost);
                    cmd.Parameters.AddWithValue("@paid", 0d);
                    cmd.Parameters.AddWithValue("@recv", RowRepoHelper.ToText(t.ReceivedAt));
                    cmd.Parameters.AddWithValue("@deliv", DBNull.Value);
                    cmd.ExecuteNonQuery();
                }
            }
        }

        public TicketRow GetById(string id)
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT Id, No, CustomerName, CustomerPhone, Device, Issue, Status, Technician, Cost, ReceivedAt FROM \"MaintenanceTicket\" WHERE Id = @id;";
                    cmd.Parameters.AddWithValue("@id", RowRepoHelper.Req(id));
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

        public IList<TicketRow> ListRecent(int take)
        {
            List<TicketRow> list = new List<TicketRow>();
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT Id, No, CustomerName, CustomerPhone, Device, Issue, Status, Technician, Cost, ReceivedAt FROM \"MaintenanceTicket\" ORDER BY ReceivedAt DESC LIMIT @take;";
                    RowRepoHelper.AddTake(cmd, take);
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

        public void UpdateStatus(string id, string status)
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "UPDATE \"MaintenanceTicket\" SET Status = @status WHERE Id = @id;";
                    cmd.Parameters.AddWithValue("@status", RowRepoHelper.Req(status));
                    cmd.Parameters.AddWithValue("@id", RowRepoHelper.Req(id));
                    cmd.ExecuteNonQuery();
                }
            }
        }

        public void AddPart(TicketPartRow part)
        {
            if (part == null)
            {
                throw new ArgumentNullException("part");
            }
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "INSERT INTO \"TicketPart\"(Id, TicketId, Name, Price) VALUES(@id,@ticket,@name,@price);";
                    cmd.Parameters.AddWithValue("@id", RowRepoHelper.NewId());
                    cmd.Parameters.AddWithValue("@ticket", RowRepoHelper.Req(part.TicketId));
                    cmd.Parameters.AddWithValue("@name", RowRepoHelper.Req(part.Name));
                    cmd.Parameters.AddWithValue("@price", part.Cost);
                    cmd.ExecuteNonQuery();
                }
            }
        }

        private static TicketRow Map(SQLiteDataReader r)
        {
            TicketRow t = new TicketRow();
            t.Id = RowRepoHelper.Str(r, 0);
            t.No = RowRepoHelper.Str(r, 1);
            t.CustomerName = RowRepoHelper.Str(r, 2);
            t.CustomerPhone = RowRepoHelper.Str(r, 3);
            t.Device = RowRepoHelper.Str(r, 4);
            t.Issue = RowRepoHelper.Str(r, 5);
            t.Status = RowRepoHelper.Str(r, 6);
            t.Technician = RowRepoHelper.Str(r, 7);
            t.Cost = RowRepoHelper.Dbl(r, 8);
            t.ReceivedAt = RowRepoHelper.ParseDate(r, 9);
            return t;
        }
    }

    #endregion

    #region Notification

    public class NotificationRowRepository : INotificationRepository
    {
        private readonly string _connectionString;

        public NotificationRowRepository(string connectionString)
        {
            if (connectionString == null)
            {
                throw new ArgumentNullException("connectionString");
            }
            _connectionString = connectionString;
        }

        public NotificationRow Add(NotificationRow n)
        {
            if (n == null)
            {
                throw new ArgumentNullException("n");
            }
            if (string.IsNullOrEmpty(n.Id))
            {
                n.Id = RowRepoHelper.NewId();
            }
            if (n.CreatedAt == default(DateTime))
            {
                n.CreatedAt = DateTime.Now;
            }
            string status = string.IsNullOrEmpty(n.Status) ? "PENDING" : n.Status;
            object sentAt = n.HasSentAt ? (object)RowRepoHelper.ToText(n.SentAt) : DBNull.Value;
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "INSERT INTO \"Notification\"(Id, Channel, \"To\", Template, Body, Status, Error, RelatedType, RelatedId, CreatedAt, SentAt) VALUES(@id,@ch,@to,@tpl,@body,@status,@err,@rtype,@rid,@created,@sent);";
                    cmd.Parameters.AddWithValue("@id", n.Id);
                    cmd.Parameters.AddWithValue("@ch", "WHATSAPP");
                    cmd.Parameters.AddWithValue("@to", RowRepoHelper.Req(n.To));
                    cmd.Parameters.AddWithValue("@tpl", RowRepoHelper.Req(n.Template));
                    cmd.Parameters.AddWithValue("@body", RowRepoHelper.Req(n.Body));
                    cmd.Parameters.AddWithValue("@status", status);
                    cmd.Parameters.AddWithValue("@err", RowRepoHelper.Req(n.Error));
                    cmd.Parameters.AddWithValue("@rtype", RowRepoHelper.Req(n.RelatedType));
                    cmd.Parameters.AddWithValue("@rid", RowRepoHelper.Req(n.RelatedId));
                    cmd.Parameters.AddWithValue("@created", RowRepoHelper.ToText(n.CreatedAt));
                    cmd.Parameters.AddWithValue("@sent", sentAt);
                    cmd.ExecuteNonQuery();
                }
            }
            n.Status = status;
            return n;
        }

        public NotificationRow GetById(string id)
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT Id, \"To\", Template, Body, Status, Error, RelatedType, RelatedId, CreatedAt, SentAt FROM \"Notification\" WHERE Id = @id;";
                    cmd.Parameters.AddWithValue("@id", RowRepoHelper.Req(id));
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

        public void MarkSent(string id, DateTime sentAt)
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "UPDATE \"Notification\" SET Status = 'SENT', SentAt = @sent WHERE Id = @id;";
                    cmd.Parameters.AddWithValue("@sent", RowRepoHelper.ToText(sentAt));
                    cmd.Parameters.AddWithValue("@id", RowRepoHelper.Req(id));
                    cmd.ExecuteNonQuery();
                }
            }
        }

        public void MarkFailed(string id, string error)
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "UPDATE \"Notification\" SET Status = 'FAILED', Error = @err WHERE Id = @id;";
                    cmd.Parameters.AddWithValue("@err", RowRepoHelper.Req(error));
                    cmd.Parameters.AddWithValue("@id", RowRepoHelper.Req(id));
                    cmd.ExecuteNonQuery();
                }
            }
        }

        public IList<NotificationRow> ListPending(int take)
        {
            List<NotificationRow> list = new List<NotificationRow>();
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT Id, \"To\", Template, Body, Status, Error, RelatedType, RelatedId, CreatedAt, SentAt FROM \"Notification\" WHERE Status = 'PENDING' ORDER BY CreatedAt ASC LIMIT @take;";
                    RowRepoHelper.AddTake(cmd, take);
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

        public IList<NotificationRow> ListRecent(int take)
        {
            List<NotificationRow> list = new List<NotificationRow>();
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT Id, \"To\", Template, Body, Status, Error, RelatedType, RelatedId, CreatedAt, SentAt FROM \"Notification\" ORDER BY CreatedAt DESC LIMIT @take;";
                    RowRepoHelper.AddTake(cmd, take);
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

        private static NotificationRow Map(SQLiteDataReader r)
        {
            NotificationRow n = new NotificationRow();
            n.Id = RowRepoHelper.Str(r, 0);
            n.To = RowRepoHelper.Str(r, 1);
            n.Template = RowRepoHelper.Str(r, 2);
            n.Body = RowRepoHelper.Str(r, 3);
            n.Status = RowRepoHelper.Str(r, 4);
            n.Error = RowRepoHelper.Str(r, 5);
            n.RelatedType = RowRepoHelper.Str(r, 6);
            n.RelatedId = RowRepoHelper.Str(r, 7);
            n.CreatedAt = RowRepoHelper.ParseDate(r, 8);
            n.HasSentAt = !r.IsDBNull(9);
            if (n.HasSentAt)
            {
                n.SentAt = RowRepoHelper.ParseDate(r, 9);
            }
            return n;
        }
    }

    #endregion

    #region Audit

    public class AuditRowRepository : IAuditRepository
    {
        private readonly string _connectionString;

        public AuditRowRepository(string connectionString)
        {
            if (connectionString == null)
            {
                throw new ArgumentNullException("connectionString");
            }
            _connectionString = connectionString;
        }

        /// <summary>Audit writes never throw; failures are swallowed.</summary>
        public void Add(AuditRow row)
        {
            try
            {
                if (row == null)
                {
                    return;
                }
                using (SQLiteConnection conn = Db.Open(_connectionString))
                {
                    using (SQLiteCommand cmd = conn.CreateCommand())
                    {
                        cmd.CommandText = "INSERT INTO \"AuditLog\"(Id, UserId, Username, Action, Entity, EntityId, Details, CreatedAt) VALUES(@id,@uid,@uname,@action,@entity,@eid,@details,@created);";
                        cmd.Parameters.AddWithValue("@id", RowRepoHelper.NewId());
                        cmd.Parameters.AddWithValue("@uid", RowRepoHelper.Fk(row.UserId));
                        cmd.Parameters.AddWithValue("@uname", RowRepoHelper.Req(row.Username));
                        cmd.Parameters.AddWithValue("@action", RowRepoHelper.Req(row.Action));
                        cmd.Parameters.AddWithValue("@entity", RowRepoHelper.Req(row.Entity));
                        cmd.Parameters.AddWithValue("@eid", RowRepoHelper.Req(row.EntityId));
                        cmd.Parameters.AddWithValue("@details", RowRepoHelper.Req(row.Details));
                        cmd.Parameters.AddWithValue("@created", RowRepoHelper.ToText(row.Date));
                        cmd.ExecuteNonQuery();
                    }
                }
            }
            catch (Exception)
            {
                // Never throws by contract.
            }
        }
    }

    #endregion

    #region User

    public class UserRowRepository : IUserRepository
    {
        private readonly string _connectionString;

        public UserRowRepository(string connectionString)
        {
            if (connectionString == null)
            {
                throw new ArgumentNullException("connectionString");
            }
            _connectionString = connectionString;
        }

        public UserRow GetById(string id)
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT Id, Name, Username, PasswordHash, Role, Active, BranchId FROM \"User\" WHERE Id = @id;";
                    cmd.Parameters.AddWithValue("@id", RowRepoHelper.Req(id));
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

        public UserRow GetByUsername(string username)
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT Id, Name, Username, PasswordHash, Role, Active, BranchId FROM \"User\" WHERE Username = @u;";
                    cmd.Parameters.AddWithValue("@u", RowRepoHelper.Req(username));
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

        private static UserRow Map(SQLiteDataReader r)
        {
            UserRow u = new UserRow();
            u.Id = RowRepoHelper.Str(r, 0);
            u.Name = RowRepoHelper.Str(r, 1);
            u.Username = RowRepoHelper.Str(r, 2);
            u.PasswordHash = RowRepoHelper.Str(r, 3);
            u.Role = RowRepoHelper.Str(r, 4);
            if (string.IsNullOrEmpty(u.Role))
            {
                u.Role = "CASHIER";
            }
            u.Active = RowRepoHelper.Bool01(r, 5);
            u.BranchId = RowRepoHelper.StrNull(r, 6);
            return u;
        }
    }

    #endregion

    #region Product

    public class ProductRowRepository : IProductRepository
    {
        private readonly string _connectionString;

        public ProductRowRepository(string connectionString)
        {
            if (connectionString == null)
            {
                throw new ArgumentNullException("connectionString");
            }
            _connectionString = connectionString;
        }

        public ProductRow GetById(string id)
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT Id, Sku, Name, CategoryId, CostPrice, CostUsd, SalePrice, Quantity, WarehouseId, Barcode, IsFavorite, MinQuantity, Active FROM \"Product\" WHERE Id = @id;";
                    cmd.Parameters.AddWithValue("@id", RowRepoHelper.Req(id));
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

        public IList<ProductRow> Search(string q, int take)
        {
            List<ProductRow> list = new List<ProductRow>();
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    if (string.IsNullOrWhiteSpace(q))
                    {
                        cmd.CommandText = "SELECT Id, Sku, Name, CategoryId, CostPrice, CostUsd, SalePrice, Quantity, WarehouseId, Barcode, IsFavorite, MinQuantity, Active FROM \"Product\" WHERE Active = 1 ORDER BY Name ASC LIMIT @take;";
                    }
                    else
                    {
                        cmd.CommandText = "SELECT Id, Sku, Name, CategoryId, CostPrice, CostUsd, SalePrice, Quantity, WarehouseId, Barcode, IsFavorite, MinQuantity, Active FROM \"Product\" WHERE Active = 1 AND (Name LIKE @q OR Sku LIKE @q OR Barcode LIKE @q) ORDER BY Name ASC LIMIT @take;";
                        cmd.Parameters.AddWithValue("@q", "%" + q.Trim() + "%");
                    }
                    RowRepoHelper.AddTake(cmd, take);
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

        public void Add(ProductRow p)
        {
            if (p == null)
            {
                throw new ArgumentNullException("p");
            }
            if (string.IsNullOrEmpty(p.Id))
            {
                p.Id = RowRepoHelper.NewId();
            }
            string now = RowRepoHelper.ToText(DateTime.Now);
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "INSERT INTO \"Product\"(Id, Sku, Name, CategoryId, CostPrice, CostUsd, SalePrice, Quantity, WarehouseId, Barcode, IsFavorite, MinQuantity, Active, LegacyNo, CreatedAt, UpdatedAt) VALUES(@id,@sku,@name,@cat,@cost,@usd,@price,@qty,@wh,@bc,@fav,@min,@active,@legacy,@created,@updated);";
                    Bind(cmd, p);
                    cmd.Parameters.AddWithValue("@legacy", string.Empty);
                    cmd.Parameters.AddWithValue("@created", now);
                    cmd.Parameters.AddWithValue("@updated", now);
                    cmd.ExecuteNonQuery();
                }
            }
        }

        public void Update(ProductRow p)
        {
            if (p == null)
            {
                throw new ArgumentNullException("p");
            }
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "UPDATE \"Product\" SET Sku = @sku, Name = @name, CategoryId = @cat, CostPrice = @cost, CostUsd = @usd, SalePrice = @price, Quantity = @qty, WarehouseId = @wh, Barcode = @bc, IsFavorite = @fav, MinQuantity = @min, Active = @active, UpdatedAt = @updated WHERE Id = @id;";
                    Bind(cmd, p);
                    cmd.Parameters.AddWithValue("@updated", RowRepoHelper.ToText(DateTime.Now));
                    cmd.ExecuteNonQuery();
                }
            }
        }

        public void AdjustQuantity(string id, double delta)
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "UPDATE \"Product\" SET Quantity = Quantity + @d, UpdatedAt = @now WHERE Id = @id;";
                    cmd.Parameters.AddWithValue("@d", delta);
                    cmd.Parameters.AddWithValue("@now", RowRepoHelper.ToText(DateTime.Now));
                    cmd.Parameters.AddWithValue("@id", RowRepoHelper.Req(id));
                    cmd.ExecuteNonQuery();
                }
            }
        }

        public void SetQuantity(string id, double qty)
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "UPDATE \"Product\" SET Quantity = @q, UpdatedAt = @now WHERE Id = @id;";
                    cmd.Parameters.AddWithValue("@q", qty);
                    cmd.Parameters.AddWithValue("@now", RowRepoHelper.ToText(DateTime.Now));
                    cmd.Parameters.AddWithValue("@id", RowRepoHelper.Req(id));
                    cmd.ExecuteNonQuery();
                }
            }
        }

        public void SetCost(string id, double cost)
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "UPDATE \"Product\" SET CostPrice = @c, UpdatedAt = @now WHERE Id = @id;";
                    cmd.Parameters.AddWithValue("@c", cost);
                    cmd.Parameters.AddWithValue("@now", RowRepoHelper.ToText(DateTime.Now));
                    cmd.Parameters.AddWithValue("@id", RowRepoHelper.Req(id));
                    cmd.ExecuteNonQuery();
                }
            }
        }

        /// <summary>
        /// Atomic guarded decrement: succeeds only when enough stock exists.
        /// Returns true when one row was updated, false when stock is short.
        /// This is the race-free path for sales and damage records.
        /// </summary>
        public bool DecrementStockGuarded(string id, double qty)
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "UPDATE \"Product\" SET Quantity = Quantity - @q, UpdatedAt = @now WHERE Id = @id AND Quantity >= @q;";
                    cmd.Parameters.AddWithValue("@q", qty);
                    cmd.Parameters.AddWithValue("@now", RowRepoHelper.ToText(DateTime.Now));
                    cmd.Parameters.AddWithValue("@id", RowRepoHelper.Req(id));
                    return cmd.ExecuteNonQuery() > 0;
                }
            }
        }

        /// <summary>Warehouse-only update for transfers (never touches Quantity).</summary>
        public void SetWarehouse(string id, string warehouseId)
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "UPDATE \"Product\" SET WarehouseId = @wh, UpdatedAt = @now WHERE Id = @id;";
                    cmd.Parameters.AddWithValue("@wh", RowRepoHelper.Fk(warehouseId));
                    cmd.Parameters.AddWithValue("@now", RowRepoHelper.ToText(DateTime.Now));
                    cmd.Parameters.AddWithValue("@id", RowRepoHelper.Req(id));
                    cmd.ExecuteNonQuery();
                }
            }
        }

        /// <summary>
        /// Single-statement purchase receipt: quantity and cost move together,
        /// so readers never observe new qty with old cost.
        /// </summary>
        public void AddStockWithCost(string id, double qty, double cost)
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "UPDATE \"Product\" SET Quantity = Quantity + @q, CostPrice = @c, UpdatedAt = @now WHERE Id = @id;";
                    cmd.Parameters.AddWithValue("@q", qty);
                    cmd.Parameters.AddWithValue("@c", cost);
                    cmd.Parameters.AddWithValue("@now", RowRepoHelper.ToText(DateTime.Now));
                    cmd.Parameters.AddWithValue("@id", RowRepoHelper.Req(id));
                    cmd.ExecuteNonQuery();
                }
            }
        }

        private static void Bind(SQLiteCommand cmd, ProductRow p)
        {
            cmd.Parameters.AddWithValue("@id", p.Id);
            cmd.Parameters.AddWithValue("@sku", RowRepoHelper.Req(p.Sku));
            cmd.Parameters.AddWithValue("@name", RowRepoHelper.Req(p.Name));
            cmd.Parameters.AddWithValue("@cat", RowRepoHelper.Fk(p.CategoryId));
            cmd.Parameters.AddWithValue("@cost", p.CostPrice);
            cmd.Parameters.AddWithValue("@usd", p.CostUsd);
            cmd.Parameters.AddWithValue("@price", p.SalePrice);
            cmd.Parameters.AddWithValue("@qty", p.Quantity);
            cmd.Parameters.AddWithValue("@wh", RowRepoHelper.Fk(p.WarehouseId));
            cmd.Parameters.AddWithValue("@bc", RowRepoHelper.Req(p.Barcode));
            cmd.Parameters.AddWithValue("@fav", p.IsFavorite ? 1 : 0);
            cmd.Parameters.AddWithValue("@min", p.MinQuantity);
            cmd.Parameters.AddWithValue("@active", p.Active ? 1 : 0);
        }

        private static ProductRow Map(SQLiteDataReader r)
        {
            ProductRow p = new ProductRow();
            p.Id = RowRepoHelper.Str(r, 0);
            p.Sku = RowRepoHelper.Str(r, 1);
            p.Name = RowRepoHelper.Str(r, 2);
            p.CategoryId = RowRepoHelper.StrNull(r, 3);
            p.CostPrice = RowRepoHelper.Dbl(r, 4);
            p.CostUsd = RowRepoHelper.Dbl(r, 5);
            p.SalePrice = RowRepoHelper.Dbl(r, 6);
            p.Quantity = RowRepoHelper.Dbl(r, 7);
            p.WarehouseId = RowRepoHelper.StrNull(r, 8);
            p.Barcode = RowRepoHelper.Str(r, 9);
            p.IsFavorite = RowRepoHelper.Bool01(r, 10);
            p.MinQuantity = RowRepoHelper.Dbl(r, 11);
            p.Active = RowRepoHelper.Bool01(r, 12);
            return p;
        }
    }

    #endregion

    #region Sale

    public class SaleRowRepository : ISaleRepository
    {
        private readonly string _connectionString;

        public SaleRowRepository(string connectionString)
        {
            if (connectionString == null)
            {
                throw new ArgumentNullException("connectionString");
            }
            _connectionString = connectionString;
        }

        public SaleRow GetById(string id)
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT Id, No, BranchId, CustomerId, CashierId, Status, PayMethod, Subtotal, Discount, Total, Paid, PayRef, Date FROM \"Sale\" WHERE Id = @id;";
                    cmd.Parameters.AddWithValue("@id", RowRepoHelper.Req(id));
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

        public IList<SaleItemRow> GetItems(string saleId)
        {
            List<SaleItemRow> list = new List<SaleItemRow>();
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT SaleId, ProductId, Qty, Price FROM \"SaleItem\" WHERE SaleId = @sale ORDER BY rowid ASC;";
                    cmd.Parameters.AddWithValue("@sale", RowRepoHelper.Req(saleId));
                    using (SQLiteDataReader r = cmd.ExecuteReader())
                    {
                        while (r.Read())
                        {
                            SaleItemRow item = new SaleItemRow();
                            item.SaleId = RowRepoHelper.Str(r, 0);
                            item.ProductId = RowRepoHelper.Str(r, 1);
                            item.Qty = RowRepoHelper.Dbl(r, 2);
                            item.Price = RowRepoHelper.Dbl(r, 3);
                            list.Add(item);
                        }
                    }
                }
            }
            return list;
        }

        public IList<SaleRow> ListRecent(int take)
        {
            List<SaleRow> list = new List<SaleRow>();
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT Id, No, BranchId, CustomerId, CashierId, Status, PayMethod, Subtotal, Discount, Total, Paid, PayRef, Date FROM \"Sale\" ORDER BY Date DESC LIMIT @take;";
                    RowRepoHelper.AddTake(cmd, take);
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

        public void Create(SaleRow sale)
        {
            if (sale == null)
            {
                throw new ArgumentNullException("sale");
            }
            if (string.IsNullOrEmpty(sale.Id))
            {
                sale.Id = RowRepoHelper.NewId();
            }
            string status = string.IsNullOrEmpty(sale.Status) ? "COMPLETED" : sale.Status;
            string payMethod = string.IsNullOrEmpty(sale.PayMethod) ? "CASH" : sale.PayMethod;
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "INSERT INTO \"Sale\"(Id, No, BranchId, CustomerId, CashierId, Status, PayMethod, Subtotal, Discount, Total, Paid, PayRef, Date) VALUES(@id,@no,@branch,@cust,@cashier,@status,@pay,@sub,@disc,@total,@paid,@ref,@date);";
                    cmd.Parameters.AddWithValue("@id", sale.Id);
                    cmd.Parameters.AddWithValue("@no", RowRepoHelper.Req(sale.No));
                    cmd.Parameters.AddWithValue("@branch", RowRepoHelper.Fk(sale.BranchId));
                    cmd.Parameters.AddWithValue("@cust", RowRepoHelper.Fk(sale.CustomerId));
                    cmd.Parameters.AddWithValue("@cashier", RowRepoHelper.Fk(sale.CashierId));
                    cmd.Parameters.AddWithValue("@status", status);
                    cmd.Parameters.AddWithValue("@pay", payMethod);
                    cmd.Parameters.AddWithValue("@sub", sale.Subtotal);
                    cmd.Parameters.AddWithValue("@disc", sale.Discount);
                    cmd.Parameters.AddWithValue("@total", sale.Total);
                    cmd.Parameters.AddWithValue("@paid", sale.Paid);
                    cmd.Parameters.AddWithValue("@ref", RowRepoHelper.Req(sale.PayRef));
                    cmd.Parameters.AddWithValue("@date", RowRepoHelper.ToText(sale.Date));
                    cmd.ExecuteNonQuery();
                }
            }
        }

        public void AddItem(SaleItemRow item)
        {
            if (item == null)
            {
                throw new ArgumentNullException("item");
            }
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "INSERT INTO \"SaleItem\"(Id, SaleId, ProductId, Qty, Price) VALUES(@id,@sale,@prod,@qty,@price);";
                    cmd.Parameters.AddWithValue("@id", RowRepoHelper.NewId());
                    cmd.Parameters.AddWithValue("@sale", RowRepoHelper.Req(item.SaleId));
                    cmd.Parameters.AddWithValue("@prod", RowRepoHelper.Req(item.ProductId));
                    cmd.Parameters.AddWithValue("@qty", item.Qty);
                    cmd.Parameters.AddWithValue("@price", item.Price);
                    cmd.ExecuteNonQuery();
                }
            }
        }

        public void AddPaid(string saleId, double amount)
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "UPDATE \"Sale\" SET Paid = Paid + @amount WHERE Id = @id;";
                    cmd.Parameters.AddWithValue("@amount", amount);
                    cmd.Parameters.AddWithValue("@id", RowRepoHelper.Req(saleId));
                    cmd.ExecuteNonQuery();
                }
            }
        }

        public void SetStatus(string saleId, string status)
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "UPDATE \"Sale\" SET Status = @status WHERE Id = @id;";
                    cmd.Parameters.AddWithValue("@status", RowRepoHelper.Req(status));
                    cmd.Parameters.AddWithValue("@id", RowRepoHelper.Req(saleId));
                    cmd.ExecuteNonQuery();
                }
            }
        }

        private static SaleRow Map(SQLiteDataReader r)
        {
            SaleRow s = new SaleRow();
            s.Id = RowRepoHelper.Str(r, 0);
            s.No = RowRepoHelper.Str(r, 1);
            s.BranchId = RowRepoHelper.StrNull(r, 2);
            s.CustomerId = RowRepoHelper.StrNull(r, 3);
            s.CashierId = RowRepoHelper.StrNull(r, 4);
            s.Status = RowRepoHelper.Str(r, 5);
            s.PayMethod = RowRepoHelper.Str(r, 6);
            s.Subtotal = RowRepoHelper.Dbl(r, 7);
            s.Discount = RowRepoHelper.Dbl(r, 8);
            s.Total = RowRepoHelper.Dbl(r, 9);
            s.Paid = RowRepoHelper.Dbl(r, 10);
            s.PayRef = RowRepoHelper.Str(r, 11);
            s.Date = RowRepoHelper.ParseDate(r, 12);
            return s;
        }
    }

    #endregion

    #region Customer

    public class CustomerRowRepository : ICustomerRepository
    {
        private readonly string _connectionString;

        public CustomerRowRepository(string connectionString)
        {
            if (connectionString == null)
            {
                throw new ArgumentNullException("connectionString");
            }
            _connectionString = connectionString;
        }

        public CustomerRow GetById(string id)
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT Id, Name, Phone, Address, CreditLimit, Balance FROM \"Customer\" WHERE Id = @id;";
                    cmd.Parameters.AddWithValue("@id", RowRepoHelper.Req(id));
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

        public IList<CustomerRow> List()
        {
            List<CustomerRow> list = new List<CustomerRow>();
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT Id, Name, Phone, Address, CreditLimit, Balance FROM \"Customer\" ORDER BY Name ASC;";
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

        public void Add(CustomerRow c)
        {
            if (c == null)
            {
                throw new ArgumentNullException("c");
            }
            if (string.IsNullOrEmpty(c.Id))
            {
                c.Id = RowRepoHelper.NewId();
            }
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "INSERT INTO \"Customer\"(Id, Name, Phone, Address, CreditLimit, Balance) VALUES(@id,@name,@phone,@addr,@limit,@bal);";
                    cmd.Parameters.AddWithValue("@id", c.Id);
                    cmd.Parameters.AddWithValue("@name", RowRepoHelper.Req(c.Name));
                    cmd.Parameters.AddWithValue("@phone", RowRepoHelper.Req(c.Phone));
                    cmd.Parameters.AddWithValue("@addr", RowRepoHelper.Req(c.Address));
                    cmd.Parameters.AddWithValue("@limit", c.CreditLimit);
                    cmd.Parameters.AddWithValue("@bal", c.Balance);
                    cmd.ExecuteNonQuery();
                }
            }
        }

        public void AdjustBalance(string id, double delta)
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "UPDATE \"Customer\" SET Balance = Balance + @d WHERE Id = @id;";
                    cmd.Parameters.AddWithValue("@d", delta);
                    cmd.Parameters.AddWithValue("@id", RowRepoHelper.Req(id));
                    cmd.ExecuteNonQuery();
                }
            }
        }

        private static CustomerRow Map(SQLiteDataReader r)
        {
            CustomerRow c = new CustomerRow();
            c.Id = RowRepoHelper.Str(r, 0);
            c.Name = RowRepoHelper.Str(r, 1);
            c.Phone = RowRepoHelper.Str(r, 2);
            c.Address = RowRepoHelper.Str(r, 3);
            c.CreditLimit = RowRepoHelper.Dbl(r, 4);
            c.Balance = RowRepoHelper.Dbl(r, 5);
            return c;
        }
    }

    #endregion

    #region Supplier

    public class SupplierRowRepository : ISupplierRepository
    {
        private readonly string _connectionString;

        public SupplierRowRepository(string connectionString)
        {
            if (connectionString == null)
            {
                throw new ArgumentNullException("connectionString");
            }
            _connectionString = connectionString;
        }

        public SupplierRow GetById(string id)
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT Id, Name, Phone, Address, Balance FROM \"Supplier\" WHERE Id = @id;";
                    cmd.Parameters.AddWithValue("@id", RowRepoHelper.Req(id));
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

        public IList<SupplierRow> List()
        {
            List<SupplierRow> list = new List<SupplierRow>();
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT Id, Name, Phone, Address, Balance FROM \"Supplier\" ORDER BY Name ASC;";
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

        public void Add(SupplierRow s)
        {
            if (s == null)
            {
                throw new ArgumentNullException("s");
            }
            if (string.IsNullOrEmpty(s.Id))
            {
                s.Id = RowRepoHelper.NewId();
            }
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "INSERT INTO \"Supplier\"(Id, Name, Phone, Address, Balance) VALUES(@id,@name,@phone,@addr,@bal);";
                    cmd.Parameters.AddWithValue("@id", s.Id);
                    cmd.Parameters.AddWithValue("@name", RowRepoHelper.Req(s.Name));
                    cmd.Parameters.AddWithValue("@phone", RowRepoHelper.Req(s.Phone));
                    cmd.Parameters.AddWithValue("@addr", RowRepoHelper.Req(s.Address));
                    cmd.Parameters.AddWithValue("@bal", s.Balance);
                    cmd.ExecuteNonQuery();
                }
            }
        }

        public void AdjustBalance(string id, double delta)
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "UPDATE \"Supplier\" SET Balance = Balance + @d WHERE Id = @id;";
                    cmd.Parameters.AddWithValue("@d", delta);
                    cmd.Parameters.AddWithValue("@id", RowRepoHelper.Req(id));
                    cmd.ExecuteNonQuery();
                }
            }
        }

        private static SupplierRow Map(SQLiteDataReader r)
        {
            SupplierRow s = new SupplierRow();
            s.Id = RowRepoHelper.Str(r, 0);
            s.Name = RowRepoHelper.Str(r, 1);
            s.Phone = RowRepoHelper.Str(r, 2);
            s.Address = RowRepoHelper.Str(r, 3);
            s.Balance = RowRepoHelper.Dbl(r, 4);
            return s;
        }
    }

    #endregion

    #region StockMove

    public class StockMoveRowRepository : IStockMoveRepository
    {
        private readonly string _connectionString;

        public StockMoveRowRepository(string connectionString)
        {
            if (connectionString == null)
            {
                throw new ArgumentNullException("connectionString");
            }
            _connectionString = connectionString;
        }

        public void Add(StockMoveRow move)
        {
            if (move == null)
            {
                throw new ArgumentNullException("move");
            }
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "INSERT INTO \"StockMove\"(Id, ProductId, Qty, Type, Note, Date, UserId) VALUES(@id,@prod,@qty,@type,@note,@date,@user);";
                    cmd.Parameters.AddWithValue("@id", RowRepoHelper.NewId());
                    cmd.Parameters.AddWithValue("@prod", RowRepoHelper.Req(move.ProductId));
                    cmd.Parameters.AddWithValue("@qty", move.Qty);
                    cmd.Parameters.AddWithValue("@type", RowRepoHelper.Req(move.Type));
                    cmd.Parameters.AddWithValue("@note", RowRepoHelper.Req(move.Note));
                    cmd.Parameters.AddWithValue("@date", RowRepoHelper.ToText(move.Date));
                    cmd.Parameters.AddWithValue("@user", RowRepoHelper.Fk(move.UserId));
                    cmd.ExecuteNonQuery();
                }
            }
        }
    }

    #endregion

    #region Settings store

    public class SettingsStoreAdapter : ISettingsStore
    {
        private readonly SettingsRepository _inner;

        public SettingsStoreAdapter(string connectionString)
        {
            if (connectionString == null)
            {
                throw new ArgumentNullException("connectionString");
            }
            _inner = new SettingsRepository(connectionString);
        }

        public IDictionary<string, string> GetAll()
        {
            return _inner.All();
        }

        public string Get(string key, string fallback)
        {
            if (fallback == null)
            {
                fallback = string.Empty;
            }
            return _inner.Get(key, fallback);
        }

        public void Set(string key, string value)
        {
            _inner.Set(key, value);
        }
    }

    #endregion

    #region Branch store

    public class BranchStoreAdapter : IBranchStore
    {
        private readonly string _connectionString;

        public BranchStoreAdapter(string connectionString)
        {
            if (connectionString == null)
            {
                throw new ArgumentNullException("connectionString");
            }
            _connectionString = connectionString;
        }

        public string GetDefaultBranchId()
        {
            using (SQLiteConnection conn = Db.Open(_connectionString))
            {
                using (SQLiteCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT Id FROM \"Branch\" LIMIT 1;";
                    object v = cmd.ExecuteScalar();
                    if (v == null || v == DBNull.Value)
                    {
                        return null;
                    }
                    string id = Convert.ToString(v);
                    if (string.IsNullOrEmpty(id))
                    {
                        return null;
                    }
                    return id;
                }
            }
        }
    }

    #endregion
}
