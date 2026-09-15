using System;
using System.Collections.Generic;
using Dokkanek.Desktop.Data.Repositories;
using Dokkanek.Desktop.Services.Interfaces;

namespace Dokkanek.Desktop.Services
{
    // يقابل app/api/tickets: استلام T- بحالة RECEIVED + تحديث حالة + قطع.
    public class MaintenanceService : IMaintenanceService
    {
        private static readonly HashSet<string> Valid = new HashSet<string>
            { "RECEIVED", "DIAGNOSIS", "WAITING_PARTS", "READY", "DELIVERED" };

        private readonly ITicketRepository _repo;
        private readonly IAuditRepository _audit;

        public MaintenanceService(ITicketRepository repo, IAuditRepository audit) { _repo = repo; _audit = audit; }

        public IList<TicketRow> ListRecent(int take) { return _repo.ListRecent(take <= 0 ? 200 : take); }

        public TicketRow Receive(string customerName, string customerPhone, string device,
            string issue, string technician, double cost, ActorContext actor)
        {
            if (string.IsNullOrWhiteSpace(customerName) || string.IsNullOrWhiteSpace(device))
                throw new InvalidOperationException("اسم الزبون والجهاز مطلوبان");
            var t = new TicketRow
            {
                Id = Guid.NewGuid().ToString(), No = "T-" + DocNo.Base36Now(),
                CustomerName = customerName, CustomerPhone = customerPhone ?? "",
                Device = device, Issue = issue ?? "", Technician = technician ?? "",
                Cost = cost, Status = "RECEIVED", ReceivedAt = DateTime.Now
            };
            _repo.Add(t);
            Audit("CREATE", "Ticket", t.Id, "استلام جهاز " + t.No, actor);
            return t;
        }

        public void SetStatus(string ticketId, string status, ActorContext actor)
        {
            if (!Valid.Contains(status)) throw new InvalidOperationException("إجراء غير معروف");
            var t = _repo.GetById(ticketId);
            if (t == null) throw new InvalidOperationException("التذكرة غير موجودة");
            _repo.UpdateStatus(ticketId, status);
            Audit("UPDATE", "Ticket", ticketId, "حالة " + t.No + " → " + status, actor);
        }

        public void AddPart(string ticketId, string partName, double partCost, ActorContext actor)
        {
            var t = _repo.GetById(ticketId);
            if (t == null) throw new InvalidOperationException("التذكرة غير موجودة");
            if (string.IsNullOrWhiteSpace(partName)) throw new InvalidOperationException("اسم القطعة مطلوب");
            _repo.AddPart(new TicketPartRow { TicketId = ticketId, Name = partName, Cost = partCost });
            Audit("CREATE", "TicketPart", ticketId, "قطعة " + partName + " لـ " + t.No, actor);
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
