using System;
using System.Collections.Generic;
using Dokkanek.Desktop.Data.Repositories;
using Dokkanek.Desktop.Services.Interfaces;

namespace Dokkanek.Desktop.Services
{
    // يقابل app/api/stocktake: فتح ST- + عد + إقفال بتسوية (stocktake.adjust).
    public class StocktakeService : IStocktakeService
    {
        private readonly IStocktakeRepository _repo;
        private readonly IProductRepository _products;
        private readonly IStockMoveRepository _moves;
        private readonly IAuditRepository _audit;
        private readonly IBranchStore _branches;
        private readonly IPermissionService _perms;
        private readonly IUnitOfWork _uow;

        public StocktakeService(IStocktakeRepository repo, IProductRepository products, IStockMoveRepository moves,
            IAuditRepository audit, IBranchStore branches, IPermissionService perms, IUnitOfWork uow)
        {
            _repo = repo; _products = products; _moves = moves;
            _audit = audit; _branches = branches; _perms = perms; _uow = uow;
        }

        public StocktakeRow OpenStocktake(string note, ActorContext actor)
        {
            string no = "ST-" + DocNo.Base36Now();
            var st = new StocktakeRow
            {
                Id = Guid.NewGuid().ToString(), No = no,
                BranchId = actor != null && !string.IsNullOrEmpty(actor.BranchId) ? actor.BranchId : _branches.GetDefaultBranchId(),
                Note = note ?? "", Status = "OPEN", CreatedAt = DateTime.Now
            };
            _repo.Create(st);
            Audit("CREATE", "Stocktake", st.Id, "فتح جرد " + no, actor);
            return st;
        }

        public void SetCount(string stocktakeId, string productId, double countedQty, ActorContext actor)
        {
            var st = _repo.GetById(stocktakeId);
            if (st == null) throw new InvalidOperationException("الجرد غير موجود");
            if (st.Status != "OPEN") throw new InvalidOperationException("الجرد مقفل");
            var p = _products.GetById(productId);
            if (p == null) throw new InvalidOperationException("الصنف غير موجود");
            _repo.UpsertItem(new StocktakeItemRow
            {
                StocktakeId = stocktakeId, ProductId = productId,
                SystemQty = p.Quantity, CountedQty = countedQty, HasCounted = true
            });
        }

        public void CloseStocktake(string stocktakeId, ActorContext actor)
        {
            if (actor == null || !_perms.HasPerm(actor.Role, "stocktake.adjust"))
                throw new InvalidOperationException("تسوية الجرد تحتاج صلاحية");
            var st = _repo.GetById(stocktakeId);
            if (st == null) throw new InvalidOperationException("الجرد غير موجود");
            if (st.Status != "OPEN") throw new InvalidOperationException("الجرد مقفل");
            _uow.Begin();
            try
            {
                int adjusted = 0;
                foreach (var it in _repo.GetItems(stocktakeId))
                {
                    if (!it.HasCounted) continue;
                    double diff = it.CountedQty - it.SystemQty;
                    if (Math.Abs(diff) < 0.0001) continue;
                    // Increment by diff (never absolute set: safe under concurrent moves).
                    _products.AdjustQuantity(it.ProductId, diff);
                    _moves.Add(new StockMoveRow
                    {
                        ProductId = it.ProductId, Qty = diff, Type = "ADJUST",
                        Note = "تسوية جرد " + st.No, UserId = actor.Id, Date = DateTime.Now
                    });
                    adjusted++;
                }
                _repo.MarkClosed(stocktakeId, DateTime.Now);
                Audit("UPDATE", "Stocktake", stocktakeId, "إقفال جرد " + st.No + " — سوّي " + adjusted + " صنف", actor);
                _uow.Commit();
            }
            catch { _uow.Rollback(); throw; }
        }

        public IList<StocktakeRow> Recent(int take) { return _repo.ListRecent(take); }

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
