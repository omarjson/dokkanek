using System;
using System.Collections.Generic;
using Dokkanek.Desktop.Data.Repositories;
using Dokkanek.Desktop.Services.Interfaces;

namespace Dokkanek.Desktop.Services
{
    // يقابل lib/sales.ts حرفيا: نفس القوائم البيضاء والرسائل.
    // السلامة: خصم المخزون يتم عبر DecrementStockGuarded الذري
    // (UPDATE ... WHERE Quantity >= qty) لأن IUnitOfWork هنا تجميع
    // منطقي فقط — انظر ADR-007.
    public class SaleService : ISaleService
    {
        private static readonly HashSet<string> Statuses = new HashSet<string> { "COMPLETED", "PENDING", "HELD", "COURIER" };
        private static readonly HashSet<string> Methods = new HashSet<string> { "CASH", "CARD", "TRANSFER", "CREDIT" };

        private readonly ISaleRepository _sales;
        private readonly IProductRepository _products;
        private readonly IPaymentRepository _payments;
        private readonly ICustomerRepository _customers;
        private readonly ICourierRepository _courier;
        private readonly IStockMoveRepository _moves;
        private readonly IAuditRepository _audit;
        private readonly ISettingsStore _settings;
        private readonly IBranchStore _branches;
        private readonly IPermissionService _perms;
        private readonly INotificationService _notify;
        private readonly IUnitOfWork _uow;

        public SaleService(ISaleRepository sales, IProductRepository products, IPaymentRepository payments,
            ICustomerRepository customers, ICourierRepository courier, IStockMoveRepository moves,
            IAuditRepository audit, ISettingsStore settings, IBranchStore branches,
            IPermissionService perms, INotificationService notify, IUnitOfWork uow)
        {
            _sales = sales; _products = products; _payments = payments; _customers = customers;
            _courier = courier; _moves = moves; _audit = audit; _settings = settings;
            _branches = branches; _perms = perms; _notify = notify; _uow = uow;
        }

        public SaleResult CreateSale(SaleRequest b, ActorContext me)
        {
            if (b == null || b.Items == null || b.Items.Count == 0) throw new InvalidOperationException("السلة فارغة");
            string status = Statuses.Contains(b.Status) ? b.Status : "COMPLETED";
            string payMethod = Methods.Contains(b.PayMethod) ? b.PayMethod : "CASH";
            double discount = b.Discount;
            if (discount > 0 && !_perms.HasPerm(me == null ? null : me.Role, "sales.discount"))
                throw new InvalidOperationException("الخصم يحتاج صلاحية");

            bool canPrice = _perms.HasPerm(me == null ? null : me.Role, "price.edit");
            double subtotal = 0;
            var prods = new Dictionary<string, ProductRow>();
            foreach (var it in b.Items)
            {
                var p = _products.GetById(it.ProductId);
                if (p == null || !p.Active) throw new InvalidOperationException("صنف غير صالح");
                if (!canPrice && Math.Abs(it.Price - p.SalePrice) > 0.001)
                    throw new InvalidOperationException("سعر " + p.Name + " معتمد ولا يمكن تغييره");
                if ((status == "COMPLETED" || status == "COURIER") && p.Quantity < it.Qty)
                    throw new InvalidOperationException("الكمية غير كافية: " + p.Name);
                prods[it.ProductId] = p;
                subtotal += it.Price * it.Qty;
            }
            double total = Math.Max(0, subtotal - discount);
            double paid = (payMethod == "CREDIT" || status == "PENDING" || status == "HELD") ? 0 : total;
            string no = "S-" + DocNo.Base36Now();
            string branchId = (me != null && !string.IsNullOrEmpty(me.BranchId)) ? me.BranchId : _branches.GetDefaultBranchId();
            string saleId = Guid.NewGuid().ToString();

            _uow.Begin();
            try
            {
                _sales.Create(new SaleRow
                {
                    Id = saleId, No = no, BranchId = branchId,
                    CustomerId = string.IsNullOrEmpty(b.CustomerId) ? null : b.CustomerId,
                    CashierId = me == null ? null : me.Id, Status = status, PayMethod = payMethod,
                    Subtotal = subtotal, Discount = discount, Total = total, Paid = paid, PayRef = b.PayRef ?? ""
                });
                foreach (var it in b.Items)
                {
                    _sales.AddItem(new SaleItemRow { SaleId = saleId, ProductId = it.ProductId, Qty = it.Qty, Price = it.Price });
                    if (status == "COMPLETED" || status == "COURIER")
                    {
                        // Atomic guarded decrement: the UPDATE itself enforces
                        // Quantity >= qty, so concurrent sales cannot oversell.
                        if (!_products.DecrementStockGuarded(it.ProductId, it.Qty))
                            throw new InvalidOperationException("الكمية غير كافية: " + prods[it.ProductId].Name);
                        _moves.Add(new StockMoveRow
                        {
                            ProductId = it.ProductId, Qty = -it.Qty, Type = "OUT",
                            Note = "فاتورة " + no, UserId = me == null ? null : me.Id, Date = DateTime.Now
                        });
                    }
                }
                if (paid > 0)
                    _payments.Add(new PaymentRow
                    {
                        Id = Guid.NewGuid().ToString(), SaleId = saleId,
                        CustomerId = string.IsNullOrEmpty(b.CustomerId) ? null : b.CustomerId,
                        Amount = paid, Method = payMethod, Note = "", Date = DateTime.Now
                    });
                if (!string.IsNullOrEmpty(b.CustomerId) && total - paid > 0)
                    _customers.AdjustBalance(b.CustomerId, total - paid);
                if (status == "COURIER")
                    _courier.Add(new CourierTaskRow
                    {
                        Id = Guid.NewGuid().ToString(), SaleId = saleId,
                        CourierName = b.CourierName ?? "", Status = "PENDING", CodAmount = total - paid, Date = DateTime.Now
                    });
                _audit.Add(new AuditRow
                {
                    Action = "CREATE", Entity = "Sale", EntityId = saleId,
                    Details = "فاتورة " + no + " بقيمة " + total,
                    Username = me == null ? "" : (me.Name ?? ""), UserId = me == null ? null : me.Id, Date = DateTime.Now
                });
                _uow.Commit();
            }
            catch { _uow.Rollback(); throw; }

            // إشعار البيع — خارج المعاملة ولا يكسر البيع أبدا.
            try
            {
                if (_settings.Get("notify_sale", "") == "1" && !string.IsNullOrEmpty(b.CustomerId))
                {
                    var cust = _customers.GetById(b.CustomerId);
                    if (cust != null && !string.IsNullOrWhiteSpace(cust.Phone))
                    {
                        string store = _settings.Get("store_name", "دكّانك");
                        _notify.Queue(cust.Phone, "invoice",
                            store + ": فاتورتك " + no + " بقيمة " + total + " — شكرا لك", "Sale", saleId);
                    }
                }
            }
            catch { }
            return new SaleResult { Id = saleId, No = no, Total = total };
        }

        public void VoidSale(string saleId, ActorContext me)
        {
            if (!_perms.HasPerm(me == null ? null : me.Role, "sales.void"))
                throw new InvalidOperationException("إلغاء الفواتير يحتاج صلاحية");
            var sale = _sales.GetById(saleId);
            if (sale == null) throw new InvalidOperationException("الفاتورة غير موجودة");
            if (sale.Status == "CANCELLED") throw new InvalidOperationException("الفاتورة ملغاة مسبقا");
            var items = _sales.GetItems(saleId);

            _uow.Begin();
            try
            {
                if (sale.Status == "COMPLETED" || sale.Status == "COURIER")
                {
                    foreach (var it in items)
                    {
                        _products.AdjustQuantity(it.ProductId, it.Qty);
                        _moves.Add(new StockMoveRow
                        {
                            ProductId = it.ProductId, Qty = it.Qty, Type = "IN",
                            Note = "إلغاء " + sale.No, UserId = me == null ? null : me.Id, Date = DateTime.Now
                        });
                    }
                    _courier.DeleteBySale(saleId);
                }
                if (!string.IsNullOrEmpty(sale.CustomerId) && sale.Total - sale.Paid > 0)
                    _customers.AdjustBalance(sale.CustomerId, -(sale.Total - sale.Paid));
                _sales.SetStatus(saleId, "CANCELLED");
                _audit.Add(new AuditRow
                {
                    Action = "UPDATE", Entity = "Sale", EntityId = saleId,
                    Details = "إلغاء فاتورة " + sale.No + " بقيمة " + sale.Total,
                    Username = me == null ? "" : (me.Name ?? ""), UserId = me == null ? null : me.Id, Date = DateTime.Now
                });
                _uow.Commit();
            }
            catch { _uow.Rollback(); throw; }
        }

        public IList<SaleRow> Recent(int take) { return _sales.ListRecent(take); }
    }
}
