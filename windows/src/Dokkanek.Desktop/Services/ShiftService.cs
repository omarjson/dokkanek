using System;
using System.Collections.Generic;
using Dokkanek.Desktop.Data.Repositories;
using Dokkanek.Desktop.Services.Interfaces;

namespace Dokkanek.Desktop.Services
{
    // يقابل app/api/shifts: فتح بعهدة + إقفال بجرد فعلي مقابل النقدية.
    public class ShiftService : IShiftService
    {
        private readonly IShiftRepository _shifts;
        private readonly IPaymentRepository _payments;
        private readonly IAuditRepository _audit;
        private readonly IBranchStore _branches;

        public ShiftService(IShiftRepository shifts, IPaymentRepository payments,
            IAuditRepository audit, IBranchStore branches)
        {
            _shifts = shifts; _payments = payments; _audit = audit; _branches = branches;
        }

        public CashShiftRow OpenShift(double opening, ActorContext actor)
        {
            if (_shifts.GetOpen() != null)
                throw new InvalidOperationException("توجد وردية مفتوحة");
            var s = new CashShiftRow
            {
                Id = Guid.NewGuid().ToString(),
                BranchId = actor != null && !string.IsNullOrEmpty(actor.BranchId) ? actor.BranchId : _branches.GetDefaultBranchId(),
                UserId = actor == null ? null : actor.Id, Opening = opening, Status = "OPEN", OpenedAt = DateTime.Now
            };
            _shifts.Add(s);
            Audit("CREATE", "CashShift", s.Id, "فتح وردية بعهدة " + opening, actor);
            return s;
        }

        public ShiftCloseResult CloseShift(double closing, ActorContext actor)
        {
            var open = _shifts.GetOpen();
            if (open == null) throw new InvalidOperationException("لا توجد وردية مفتوحة");
            double expected = open.Opening + _payments.SumCashSince(open.OpenedAt);
            // Web parity: closing defaults to expected when not provided.
            if (closing <= 0) closing = expected;
            _shifts.Close(open.Id, closing, DateTime.Now);
            Audit("UPDATE", "CashShift", open.Id,
                "إقفال وردية: متوقع " + expected + " / فعلي " + closing + " / فرق " + (closing - expected), actor);
            return new ShiftCloseResult { Expected = expected, Closing = closing, Diff = closing - expected };
        }

        public CashShiftRow GetOpen() { return _shifts.GetOpen(); }

        public double ExpectedForOpen()
        {
            var open = _shifts.GetOpen();
            if (open == null) return 0;
            return open.Opening + _payments.SumCashSince(open.OpenedAt);
        }

        public IList<CashShiftRow> History(int take) { return _shifts.ListRecent(take); }

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
