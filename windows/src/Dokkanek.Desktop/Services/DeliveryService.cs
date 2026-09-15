using System;
using System.Collections.Generic;
using Dokkanek.Desktop.Data.Repositories;
using Dokkanek.Desktop.Services.Interfaces;

namespace Dokkanek.Desktop.Services
{
    // مهام التوصيل (CourierTask من البيع): حالات PENDING/WITH_COURIER/DELIVERED/FAILED.
    public class DeliveryService : IDeliveryService
    {
        private static readonly HashSet<string> Valid = new HashSet<string>
            { "PENDING", "WITH_COURIER", "DELIVERED", "FAILED" };

        private readonly ICourierRepository _repo;
        private readonly IAuditRepository _audit;

        public DeliveryService(ICourierRepository repo, IAuditRepository audit) { _repo = repo; _audit = audit; }

        public IList<CourierTaskRow> ListTasks(int take) { return _repo.List(take <= 0 ? 100 : take); }

        public void SetStatus(string saleId, string status, ActorContext actor)
        {
            if (!Valid.Contains(status)) throw new InvalidOperationException("إجراء غير معروف");
            var t = _repo.GetBySale(saleId);
            if (t == null) throw new InvalidOperationException("المهمة غير موجودة");
            _repo.UpdateStatus(saleId, status, t.Collected);
            Audit("UPDATE", "CourierTask", t.Id, "حالة التوصيل → " + status, actor);
        }

        public void MarkDelivered(string saleId, double collected, ActorContext actor)
        {
            var t = _repo.GetBySale(saleId);
            if (t == null) throw new InvalidOperationException("المهمة غير موجودة");
            _repo.UpdateStatus(saleId, "DELIVERED", collected);
            Audit("UPDATE", "CourierTask", t.Id, "تم التسليم وتحصيل " + collected, actor);
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
