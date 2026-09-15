using System;
using Dokkanek.Desktop.Data.Repositories;
using Dokkanek.Desktop.Services.Interfaces;

namespace Dokkanek.Desktop.Services
{
    // يقابل app/api/transfers: حركتا OUT/IN بنفس المرجع + نقل تبعية الصنف.
    public class TransferService : ITransferService
    {
        private readonly IProductRepository _products;
        private readonly IStockMoveRepository _moves;
        private readonly IAuditRepository _audit;
        private readonly IWarehouseStore _warehouses;
        private readonly IUnitOfWork _uow;

        public TransferService(IProductRepository products, IStockMoveRepository moves,
            IAuditRepository audit, IWarehouseStore warehouses, IUnitOfWork uow)
        {
            _products = products; _moves = moves; _audit = audit; _warehouses = warehouses; _uow = uow;
        }

        public string Transfer(string productId, string fromId, string toId, double qty, ActorContext actor)
        {
            if (actor == null || string.IsNullOrEmpty(actor.Id)) throw new InvalidOperationException("غير مصرح");
            if (string.IsNullOrEmpty(productId) || string.IsNullOrEmpty(fromId) || string.IsNullOrEmpty(toId) || qty <= 0)
                throw new InvalidOperationException("الصنف والمخزنان والكمية مطلوبة");
            if (fromId == toId) throw new InvalidOperationException("المخزنان متطابقان");
            var p = _products.GetById(productId);
            string fromName = _warehouses.GetName(fromId);
            string toName = _warehouses.GetName(toId);
            if (p == null || fromName == null || toName == null)
                throw new InvalidOperationException("بيانات غير صالحة");
            if (p.Quantity < qty) throw new InvalidOperationException("المتاح فقط " + p.Quantity);

            string r = "TRF-" + DocNo.Base36Now();
            _uow.Begin();
            try
            {
                _moves.Add(new StockMoveRow
                {
                    ProductId = p.Id, Qty = -qty, Type = "TRANSFER",
                    Note = r + ": من " + fromName + " إلى " + toName, UserId = actor.Id, Date = DateTime.Now
                });
                _moves.Add(new StockMoveRow
                {
                    ProductId = p.Id, Qty = qty, Type = "TRANSFER",
                    Note = r + ": استلام في " + toName, UserId = actor.Id, Date = DateTime.Now
                });
                // Warehouse-only update: never rewrite Quantity from a stale read.
                _products.SetWarehouse(p.Id, toId);
                try
                {
                    _audit.Add(new AuditRow
                    {
                        Action = "CREATE", Entity = "Transfer", EntityId = r,
                        Details = "تحويل " + p.Name + " × " + qty + " من " + fromName + " إلى " + toName,
                        Username = actor.Name ?? "", UserId = actor.Id, Date = DateTime.Now
                    });
                }
                catch { }
                _uow.Commit();
            }
            catch { _uow.Rollback(); throw; }
            return r;
        }
    }
}
