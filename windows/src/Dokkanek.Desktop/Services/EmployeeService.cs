using System;
using System.Collections.Generic;
using Dokkanek.Desktop.Data.Repositories;
using Dokkanek.Desktop.Services.Interfaces;

namespace Dokkanek.Desktop.Services
{
    // يقابل app/api/employees + app/api/advances: عرض hr.view، سلف hr.advance.
    public class EmployeeService : IEmployeeService
    {
        private readonly IEmployeeRepository _repo;
        private readonly IAuditRepository _audit;
        private readonly IPermissionService _perms;

        public EmployeeService(IEmployeeRepository repo, IAuditRepository audit, IPermissionService perms)
        {
            _repo = repo; _audit = audit; _perms = perms;
        }

        public IList<EmployeeRow> List(ActorContext actor)
        {
            if (actor == null || !_perms.HasPerm(actor.Role, "hr.view"))
                throw new InvalidOperationException("غير مصرح");
            return _repo.List();
        }

        public EmployeeRow Create(string name, string phone, string title, double salary, double commissionRate, ActorContext actor)
        {
            if (actor == null || !_perms.HasPerm(actor.Role, "hr.view"))
                throw new InvalidOperationException("غير مصرح");
            if (string.IsNullOrWhiteSpace(name)) throw new InvalidOperationException("الاسم مطلوب");
            var e = new EmployeeRow
            {
                Id = Guid.NewGuid().ToString(), Name = name,
                Phone = phone ?? "", Title = title ?? "", Salary = salary, CommissionRate = commissionRate
            };
            _repo.Add(e);
            Audit("CREATE", "Employee", e.Id, "إضافة موظف " + e.Name, actor);
            return e;
        }

        public void GrantAdvance(string employeeId, double amount, string note, ActorContext actor)
        {
            if (actor == null || !_perms.HasPerm(actor.Role, "hr.advance"))
                throw new InvalidOperationException("السلف تحتاج صلاحية");
            if (string.IsNullOrEmpty(employeeId) || amount <= 0)
                throw new InvalidOperationException("الموظف والمبلغ مطلوبان");
            var a = new AdvanceRow
            {
                Id = Guid.NewGuid().ToString(), EmployeeId = employeeId,
                Amount = amount, Note = string.IsNullOrEmpty(note) ? "سلفة" : note, Date = DateTime.Now
            };
            _repo.AddAdvance(a);
            Audit("CREATE", "Advance", a.Id, "سلفة " + amount + " لموظف", actor);
        }

        public void SettleAdvance(string advanceId, ActorContext actor)
        {
            if (actor == null || !_perms.HasPerm(actor.Role, "hr.advance"))
                throw new InvalidOperationException("السلف تحتاج صلاحية");
            if (string.IsNullOrEmpty(advanceId)) throw new InvalidOperationException("مطلوب");
            _repo.SettleAdvance(advanceId);
            Audit("UPDATE", "Advance", advanceId, "تسوية سلفة", actor);
        }

        public void RecordAttendance(string employeeId, DateTime checkIn, DateTime checkOut, bool hasCheckOut, ActorContext actor)
        {
            if (actor == null || !_perms.HasPerm(actor.Role, "hr.view"))
                throw new InvalidOperationException("غير مصرح");
            if (string.IsNullOrEmpty(employeeId)) throw new InvalidOperationException("الموظف مطلوب");
            int minutes = hasCheckOut && checkOut > checkIn ? (int)(checkOut - checkIn).TotalMinutes : 0;
            _repo.RecordAttendance(new AttendanceRow
            {
                EmployeeId = employeeId, Date = checkIn.Date,
                CheckIn = checkIn, CheckOut = checkOut, HasCheckOut = hasCheckOut, Minutes = minutes
            });
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
