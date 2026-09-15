using System;
using System.Collections.Generic;
using Dokkanek.Desktop.Data.Repositories;
using Dokkanek.Desktop.Services.Interfaces;

namespace Dokkanek.Desktop.Services
{
    // يقابل app/api/purchases: متوسط تكلفة مرجح + IN + دين مورد.
    public class PurchaseService : IPurchaseService
    {
        private readonly IPurchaseRepository _purchases;
        private readonly IProductRepository _products;
        private readonly ISupplierRepository _suppliers;
        private readonly IStockMoveRepository _moves;
        private readonly IAuditRepository _audit;
        private readonly IBranchStore _branches;
        private readonly IPermissionService _perms;
        private readonly IUnitOfWork _uow;

        public PurchaseService(IPurchaseRepository purchases, IProductRepository products, ISupplierRepository suppliers,
            IStockMoveRepository moves, IAuditRepository audit, IBranchStore branches,
            IPermissionService perms, IUnitOfWork uow)
        {
            _purchases = purchases; _products = products; _suppliers = suppliers;
            _moves = moves; _audit = audit; _branches = branches; _perms = perms; _uow = uow;
        }

        public SaleResult CreatePurchase(string supplierId, IList<PurchaseItemInput> items, double paid, ActorContext actor)
        {
            if (actor == null || !_perms.HasPerm(actor.Role, "purchases.manage"))
                throw new InvalidOperationException("المشتريات تحتاج صلاحية");
            if (string.IsNullOrEmpty(supplierId) || items == null || items.Count == 0)
                throw new InvalidOperationException("المورد والأصناف مطلوبة");
            double total = 0;
            foreach (var it in items)
            {
                if (it.Qty <= 0 || it.Price < 0)
                    throw new InvalidOperationException("كمية أو سعر غير صالح");
                if (_products.GetById(it.ProductId) == null)
                    throw new InvalidOperationException("الصنف غير موجود");
                total += it.Qty * it.Price;
            }
            string no = "P-" + DocNo.Base36Now();
            string branchId = !string.IsNullOrEmpty(actor.BranchId) ? actor.BranchId : _branches.GetDefaultBranchId();
            string id = Guid.NewGuid().ToString();

            _uow.Begin();
            try
            {
                _purchases.Create(new PurchaseRow
                {
                    Id = id, No = no, SupplierId = supplierId, BranchId = branchId,
                    Total = total, Paid = paid, Status = total - paid > 0 ? "CREDIT" : "COMPLETED", Date = DateTime.Now
                });
                foreach (var it in items)
                {
                    _purchases.AddItem(new PurchaseItemRow { PurchaseId = id, ProductId = it.ProductId, Qty = it.Qty, Price = it.Price });
                    var old = _products.GetById(it.ProductId);
                    if (old == null) throw new InvalidOperationException("الصنف غير موجود");
                    double newQty = old.Quantity + it.Qty;
                    double newCost = (it.Price > 0 && newQty > 0)
                        ? (old.Quantity * old.CostPrice + it.Qty * it.Price) / newQty : old.CostPrice;
                    // Single-statement receipt + half-up rounding (JS Math.round parity).
                    _products.AddStockWithCost(it.ProductId, it.Qty, Math.Round(newCost, 2, MidpointRounding.AwayFromZero));
                    _moves.Add(new StockMoveRow
                    {
                        ProductId = it.ProductId, Qty = it.Qty, Type = "IN",
                        Note = "شراء " + no, UserId = actor.Id, Date = DateTime.Now
                    });
                }
                if (total - paid > 0) _suppliers.AdjustBalance(supplierId, total - paid);
                _audit.Add(new AuditRow
                {
                    Action = "CREATE", Entity = "Purchase", EntityId = id,
                    Details = "فاتورة شراء " + no + " بقيمة " + total,
                    Username = actor.Name ?? "", UserId = actor.Id, Date = DateTime.Now
                });
                _uow.Commit();
            }
            catch { _uow.Rollback(); throw; }
            return new SaleResult { Id = id, No = no, Total = total };
        }
    }
}
