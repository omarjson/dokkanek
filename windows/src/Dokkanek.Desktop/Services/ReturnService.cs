using System;
using Dokkanek.Desktop.Data.Repositories;
using Dokkanek.Desktop.Services.Interfaces;

namespace Dokkanek.Desktop.Services
{
    // يقابل app/api/returns: راجع يزيد المخزون، تالف ينقصه.
    public class ReturnService : IReturnService
    {
        private readonly IProductRepository _products;
        private readonly IReturnRepository _returns;
        private readonly IStockMoveRepository _moves;
        private readonly IAuditRepository _audit;
        private readonly IUnitOfWork _uow;

        public ReturnService(IProductRepository products, IReturnRepository returns,
            IStockMoveRepository moves, IAuditRepository audit, IUnitOfWork uow)
        {
            _products = products; _returns = returns; _moves = moves; _audit = audit; _uow = uow;
        }

        public void RecordReturn(string productId, string saleId, double qty, string reason, ActorContext actor)
        {
            if (string.IsNullOrEmpty(productId) || qty <= 0)
                throw new InvalidOperationException("الصنف والكمية مطلوبان");
            var p = _products.GetById(productId);
            if (p == null) throw new InvalidOperationException("الصنف غير موجود");
            _uow.Begin();
            try
            {
                _products.AdjustQuantity(p.Id, qty);
                var r = new ReturnRow
                {
                    Id = Guid.NewGuid().ToString(), ProductId = p.Id, SaleId = saleId,
                    Qty = qty, Reason = reason ?? "", Date = DateTime.Now
                };
                _returns.AddReturn(r);
                _moves.Add(new StockMoveRow
                {
                    ProductId = p.Id, Qty = qty, Type = "RETURN",
                    Note = string.IsNullOrEmpty(reason) ? "راجع" : reason,
                    UserId = actor == null ? null : actor.Id, Date = DateTime.Now
                });
                Audit("CREATE", "Return", p.Id, "راجع " + p.Name + " × " + qty, actor);
                _uow.Commit();
            }
            catch { _uow.Rollback(); throw; }
        }

        public void RecordDamage(string productId, double qty, string reason, ActorContext actor)
        {
            if (string.IsNullOrEmpty(productId) || qty <= 0)
                throw new InvalidOperationException("الصنف والكمية مطلوبان");
            var p = _products.GetById(productId);
            if (p == null) throw new InvalidOperationException("الصنف غير موجود");
            _uow.Begin();
            try
            {
                // Atomic guarded decrement (message mirrors the web check).
                if (!_products.DecrementStockGuarded(p.Id, qty))
                    throw new InvalidOperationException("المتاح فقط " + p.Quantity);
                _returns.AddDamage(new DamageRow
                {
                    Id = Guid.NewGuid().ToString(), ProductId = p.Id, Qty = qty,
                    Reason = reason ?? "", Date = DateTime.Now
                });
                _moves.Add(new StockMoveRow
                {
                    ProductId = p.Id, Qty = -qty, Type = "DAMAGE",
                    Note = string.IsNullOrEmpty(reason) ? "تالف" : reason,
                    UserId = actor == null ? null : actor.Id, Date = DateTime.Now
                });
                Audit("CREATE", "Damage", p.Id, "تالف " + p.Name + " × " + qty, actor);
                _uow.Commit();
            }
            catch { _uow.Rollback(); throw; }
        }

        private void Audit(string action, string entity, string id, string details, ActorContext actor)
        {
            try
            {
                _audit.Add(new AuditRow
                {
                    Action = action, Entity = entity, EntityId = id, Details = details,
                    Username = actor == null ? "" : (actor.Name ?? ""), UserId = actor == null ? null : actor.Id, Date = DateTime.Now
                });
            }
            catch { }
        }
    }
}
