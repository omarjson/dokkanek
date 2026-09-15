using System;
using System.Collections.Generic;
using Dokkanek.Desktop.Data.Repositories;
using Dokkanek.Desktop.Services.Interfaces;

namespace Dokkanek.Desktop.Services
{
    // يقابل app/api/suppliers: الإضافة تحتاج purchases.manage.
    public class SupplierService : ISupplierService
    {
        private readonly ISupplierRepository _repo;
        private readonly IAuditRepository _audit;
        private readonly IPermissionService _perms;

        public SupplierService(ISupplierRepository repo, IAuditRepository audit, IPermissionService perms)
        {
            _repo = repo; _audit = audit; _perms = perms;
        }

        public IList<SupplierRow> List() { return _repo.List(); }

        public SupplierRow Create(string name, string phone, string address, ActorContext actor)
        {
            if (actor == null || !_perms.HasPerm(actor.Role, "purchases.manage"))
                throw new InvalidOperationException("المشتريات تحتاج صلاحية");
            if (string.IsNullOrWhiteSpace(name)) throw new InvalidOperationException("الاسم مطلوب");
            var s = new SupplierRow
            {
                Id = Guid.NewGuid().ToString(), Name = name, Phone = phone ?? "", Address = address ?? ""
            };
            _repo.Add(s);
            try
            {
                _audit.Add(new AuditRow
                {
                    Action = "CREATE", Entity = "Supplier", EntityId = s.Id, Details = "إضافة مورد " + s.Name,
                    Username = actor.Name ?? "", UserId = actor.Id, Date = DateTime.Now
                });
            }
            catch { }
            return s;
        }
    }
}
