using System;
using System.Collections.Generic;

namespace Dokkanek.Desktop.Data.Repositories
{
    // POCOs تطابق prisma/schema.prisma — لا توجد مراجع SQLite هنا؛ التنفيذ في طبقة Data فقط.

    public class ProductRow
    {
        public string Id { get; set; } public string Sku { get; set; } public string Name { get; set; }
        public string CategoryId { get; set; } public double CostPrice { get; set; } public double CostUsd { get; set; }
        public double SalePrice { get; set; } public double Quantity { get; set; } public string WarehouseId { get; set; }
        public string Barcode { get; set; } public double MinQuantity { get; set; }
        public bool IsFavorite { get; set; } public bool Active { get; set; }
        public ProductRow() { Id = ""; Sku = ""; Name = ""; Active = true; MinQuantity = 5; }
    }

    public class SaleRow
    {
        public string Id { get; set; } public string No { get; set; } public string BranchId { get; set; }
        public string CustomerId { get; set; } public string CashierId { get; set; } public string Status { get; set; }
        public string PayMethod { get; set; } public double Subtotal { get; set; } public double Discount { get; set; }
        public double Total { get; set; } public double Paid { get; set; } public string PayRef { get; set; } public DateTime Date { get; set; }
        public SaleRow() { Id = ""; No = ""; Status = "COMPLETED"; PayMethod = "CASH"; PayRef = ""; Date = DateTime.Now; }
    }

    public class SaleItemRow
    {
        public string SaleId { get; set; } public string ProductId { get; set; } public double Qty { get; set; } public double Price { get; set; }
        public SaleItemRow() { SaleId = ""; ProductId = ""; }
    }

    public class PaymentRow
    {
        public string Id { get; set; } public string SaleId { get; set; } public string CustomerId { get; set; }
        public string SupplierId { get; set; } public double Amount { get; set; } public string Method { get; set; }
        public string Note { get; set; } public DateTime Date { get; set; }
        public PaymentRow() { Id = ""; Method = "CASH"; Note = ""; Date = DateTime.Now; }
    }

    public class CustomerRow
    {
        public string Id { get; set; } public string Name { get; set; } public string Phone { get; set; }
        public string Address { get; set; } public double CreditLimit { get; set; } public double Balance { get; set; }
        public CustomerRow() { Id = ""; Name = ""; Phone = ""; Address = ""; }
    }

    public class SupplierRow
    {
        public string Id { get; set; } public string Name { get; set; } public string Phone { get; set; }
        public string Address { get; set; } public double Balance { get; set; }
        public SupplierRow() { Id = ""; Name = ""; Phone = ""; Address = ""; }
    }

    public class PurchaseRow
    {
        public string Id { get; set; } public string No { get; set; } public string SupplierId { get; set; }
        public string BranchId { get; set; } public double Total { get; set; } public double Paid { get; set; }
        public string Status { get; set; } public DateTime Date { get; set; }
        public PurchaseRow() { Id = ""; No = ""; Status = "COMPLETED"; Date = DateTime.Now; }
    }

    public class PurchaseItemRow
    {
        public string PurchaseId { get; set; } public string ProductId { get; set; } public double Qty { get; set; } public double Price { get; set; }
        public PurchaseItemRow() { PurchaseId = ""; ProductId = ""; }
    }

    public class StockMoveRow
    {
        public string ProductId { get; set; } public double Qty { get; set; } public string Type { get; set; }
        public string Note { get; set; } public string UserId { get; set; } public DateTime Date { get; set; }
        public StockMoveRow() { ProductId = ""; Type = ""; Note = ""; Date = DateTime.Now; }
    }

    public class ExpenseRow
    {
        public string Id { get; set; } public string BranchId { get; set; } public string Title { get; set; }
        public double Amount { get; set; } public string Note { get; set; } public DateTime Date { get; set; }
        public ExpenseRow() { Id = ""; Title = ""; Note = ""; Date = DateTime.Now; }
    }

    public class CashShiftRow
    {
        public string Id { get; set; } public string BranchId { get; set; } public string UserId { get; set; }
        public double Opening { get; set; } public double Closing { get; set; } public bool HasClosing { get; set; }
        public DateTime OpenedAt { get; set; } public DateTime ClosedAt { get; set; } public string Status { get; set; }
        public CashShiftRow() { Id = ""; Status = "OPEN"; OpenedAt = DateTime.Now; }
    }

    public class StocktakeRow
    {
        public string Id { get; set; } public string No { get; set; } public string BranchId { get; set; }
        public string Note { get; set; } public string Status { get; set; } public DateTime CreatedAt { get; set; }
        public DateTime ClosedAt { get; set; } public bool HasClosedAt { get; set; }
        public StocktakeRow() { Id = ""; No = ""; Note = ""; Status = "OPEN"; CreatedAt = DateTime.Now; }
    }

    public class StocktakeItemRow
    {
        public string StocktakeId { get; set; } public string ProductId { get; set; }
        public double SystemQty { get; set; } public double CountedQty { get; set; } public bool HasCounted { get; set; }
        public StocktakeItemRow() { StocktakeId = ""; ProductId = ""; }
    }

    public class ReturnRow
    {
        public string Id { get; set; } public string SaleId { get; set; } public string ProductId { get; set; }
        public double Qty { get; set; } public string Reason { get; set; } public DateTime Date { get; set; }
        public ReturnRow() { Id = ""; Reason = ""; Date = DateTime.Now; }
    }

    public class DamageRow
    {
        public string Id { get; set; } public string ProductId { get; set; } public double Qty { get; set; }
        public string Reason { get; set; } public DateTime Date { get; set; }
        public DamageRow() { Id = ""; Reason = ""; Date = DateTime.Now; }
    }

    public class CourierTaskRow
    {
        public string Id { get; set; } public string SaleId { get; set; } public string CourierName { get; set; }
        public string Status { get; set; } public double CodAmount { get; set; } public double Collected { get; set; } public DateTime Date { get; set; }
        public CourierTaskRow() { Id = ""; SaleId = ""; CourierName = ""; Status = "PENDING"; Date = DateTime.Now; }
    }

    public class EmployeeRow
    {
        public string Id { get; set; } public string Name { get; set; } public string Phone { get; set; }
        public string Title { get; set; } public double Salary { get; set; } public double CommissionRate { get; set; } public bool Active { get; set; }
        public EmployeeRow() { Id = ""; Name = ""; Phone = ""; Title = ""; Active = true; }
    }

    public class AdvanceRow
    {
        public string Id { get; set; } public string EmployeeId { get; set; } public double Amount { get; set; }
        public string Note { get; set; } public bool Settled { get; set; } public DateTime Date { get; set; }
        public AdvanceRow() { Id = ""; EmployeeId = ""; Note = ""; Date = DateTime.Now; }
    }

    public class AttendanceRow
    {
        public string EmployeeId { get; set; } public DateTime Date { get; set; }
        public DateTime CheckIn { get; set; } public DateTime CheckOut { get; set; } public bool HasCheckOut { get; set; } public int Minutes { get; set; }
        public AttendanceRow() { EmployeeId = ""; Date = DateTime.Today; }
    }

    public class TicketRow
    {
        public string Id { get; set; } public string No { get; set; } public string CustomerName { get; set; }
        public string CustomerPhone { get; set; } public string Device { get; set; } public string Issue { get; set; }
        public string Technician { get; set; } public double Cost { get; set; } public string Status { get; set; } public DateTime ReceivedAt { get; set; }
        public TicketRow() { Id = ""; No = ""; CustomerName = ""; Device = ""; Status = "RECEIVED"; ReceivedAt = DateTime.Now; }
    }

    public class TicketPartRow
    {
        public string TicketId { get; set; } public string Name { get; set; } public double Cost { get; set; }
        public TicketPartRow() { TicketId = ""; Name = ""; }
    }

    public class NotificationRow
    {
        public string Id { get; set; } public string To { get; set; } public string Template { get; set; } public string Body { get; set; }
        public string RelatedType { get; set; } public string RelatedId { get; set; } public string Status { get; set; }
        public string Error { get; set; } public DateTime SentAt { get; set; } public bool HasSentAt { get; set; } public DateTime CreatedAt { get; set; }
        public NotificationRow() { Id = ""; To = ""; Status = "PENDING"; Error = ""; CreatedAt = DateTime.Now; }
    }

    public class AuditRow
    {
        public string Action { get; set; } public string Entity { get; set; } public string EntityId { get; set; }
        public string Details { get; set; } public string Username { get; set; } public string UserId { get; set; } public DateTime Date { get; set; }
        public AuditRow() { Action = ""; Entity = ""; EntityId = ""; Details = ""; Username = ""; Date = DateTime.Now; }
    }

    public class UserRow
    {
        public string Id { get; set; } public string Name { get; set; } public string Username { get; set; }
        public string PasswordHash { get; set; } public string Role { get; set; } public bool Active { get; set; } public string BranchId { get; set; }
        public UserRow() { Id = ""; Name = ""; Username = ""; PasswordHash = ""; Role = "CASHIER"; Active = true; }
    }

    // ---- Repository contracts (Data layer implements; Services only depend on these) ----

    public interface IUnitOfWork : IDisposable { void Begin(); void Commit(); void Rollback(); }
    public interface IProductRepository
    {
        ProductRow GetById(string id); IList<ProductRow> Search(string q, int take);
        void Add(ProductRow p); void Update(ProductRow p);
        void AdjustQuantity(string id, double delta); void SetQuantity(string id, double qty); void SetCost(string id, double cost);
        bool DecrementStockGuarded(string id, double qty);
        void SetWarehouse(string id, string warehouseId);
        void AddStockWithCost(string id, double qty, double cost);
    }
    public interface ISaleRepository
    {
        SaleRow GetById(string id); IList<SaleItemRow> GetItems(string saleId); IList<SaleRow> ListRecent(int take);
        void Create(SaleRow sale); void AddItem(SaleItemRow item); void AddPaid(string saleId, double amount); void SetStatus(string saleId, string status);
    }
    public interface IPaymentRepository { void Add(PaymentRow row); double SumCashSince(DateTime since); }
    public interface ICustomerRepository
    {
        CustomerRow GetById(string id); IList<CustomerRow> List(); void Add(CustomerRow c); void AdjustBalance(string id, double delta);
    }
    public interface ISupplierRepository
    {
        SupplierRow GetById(string id); IList<SupplierRow> List(); void Add(SupplierRow s); void AdjustBalance(string id, double delta);
    }
    public interface IPurchaseRepository { void Create(PurchaseRow p); void AddItem(PurchaseItemRow item); IList<PurchaseRow> ListRecent(int take); }
    public interface IStockMoveRepository { void Add(StockMoveRow move); }
    public interface IExpenseRepository { void Add(ExpenseRow e); void Delete(string id); IList<ExpenseRow> ListRecent(int take); }
    public interface IShiftRepository
    {
        CashShiftRow GetOpen(); void Add(CashShiftRow s); void Close(string id, double closing, DateTime closedAt); IList<CashShiftRow> ListRecent(int take);
    }
    public interface IStocktakeRepository
    {
        void Create(StocktakeRow st); StocktakeRow GetById(string id); IList<StocktakeRow> ListRecent(int take);
        void UpsertItem(StocktakeItemRow item); IList<StocktakeItemRow> GetItems(string stocktakeId); void UpdateStatus(string id, string status);
        void MarkClosed(string id, DateTime closedAt);
    }
    public interface IReturnRepository { void AddReturn(ReturnRow r); void AddDamage(DamageRow d); }
    public interface ICourierRepository
    {
        void Add(CourierTaskRow t); CourierTaskRow GetBySale(string saleId); void DeleteBySale(string saleId);
        void UpdateStatus(string saleId, string status, double collected); IList<CourierTaskRow> List(int take);
    }
    public interface IEmployeeRepository
    {
        EmployeeRow GetById(string id); IList<EmployeeRow> List(); void Add(EmployeeRow e);
        void AddAdvance(AdvanceRow a); AdvanceRow GetAdvance(string id); void SettleAdvance(string id); void RecordAttendance(AttendanceRow a);
    }
    public interface ITicketRepository
    {
        void Add(TicketRow t); TicketRow GetById(string id); IList<TicketRow> ListRecent(int take);
        void UpdateStatus(string id, string status); void AddPart(TicketPartRow part);
    }
    public interface INotificationRepository
    {
        NotificationRow Add(NotificationRow n); NotificationRow GetById(string id);
        void MarkSent(string id, DateTime sentAt); void MarkFailed(string id, string error);
        IList<NotificationRow> ListPending(int take); IList<NotificationRow> ListRecent(int take);
    }
    public interface IAuditRepository { void Add(AuditRow row); }
    public interface IUserRepository { UserRow GetById(string id); UserRow GetByUsername(string username); }
    public interface ISettingsStore
    {
        IDictionary<string, string> GetAll(); string Get(string key, string fallback); void Set(string key, string value);
    }
    public interface IBranchStore { string GetDefaultBranchId(); }
}
