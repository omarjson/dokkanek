using System;
using System.Collections.Generic;
using Dokkanek.Desktop.Data.Repositories;
using Dokkanek.Desktop.Services.Interfaces;

namespace Dokkanek.Desktop.Services
{
    // يقابل app/api/expenses: العرض والتسجيل والحذف تحتاج expenses.view.
    public class ExpenseService : IExpenseService
    {
        private readonly IExpenseRepository _repo;
        private readonly IAuditRepository _audit;
        private readonly IBranchStore _branches;
        private readonly IPermissionService _perms;

        public ExpenseService(IExpenseRepository repo, IAuditRepository audit,
            IBranchStore branches, IPermissionService perms)
        {
            _repo = repo; _audit = audit; _branches = branches; _perms = perms;
        }

        public IList<ExpenseRow> List() { return _repo.ListRecent(200); }

        public ExpenseRow Create(string title, double amount, string note, ActorContext actor)
        {
            if (actor == null || !_perms.HasPerm(actor.Role, "expenses.view"))
                throw new InvalidOperationException("المصروفات تحتاج صلاحية");
            if (string.IsNullOrWhiteSpace(title))
                throw new InvalidOperationException("البيان والمبلغ مطلوبان");
            var e = new ExpenseRow
            {
                Id = Guid.NewGuid().ToString(),
                BranchId = !string.IsNullOrEmpty(actor.BranchId) ? actor.BranchId : _branches.GetDefaultBranchId(),
                Title = title, Amount = amount, Note = note ?? "", Date = DateTime.Now
            };
            _repo.Add(e);
            Audit("CREATE", "Expense", e.Id, "مصروف " + e.Title + ": " + e.Amount, actor);
            return e;
        }

        public void Delete(string expenseId, ActorContext actor)
        {
            if (actor == null || !_perms.HasPerm(actor.Role, "expenses.view"))
                throw new InvalidOperationException("المصروفات تحتاج صلاحية");
            if (string.IsNullOrEmpty(expenseId)) throw new InvalidOperationException("مطلوب");
            _repo.Delete(expenseId);
            Audit("DELETE", "Expense", expenseId, "حذف مصروف", actor);
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
