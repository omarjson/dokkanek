using System;
using System.Collections.Generic;
using Dokkanek.Desktop.Data.Repositories;
using Dokkanek.Desktop.Services.Interfaces;

namespace Dokkanek.Desktop.Services
{
    // يقابل app/api/customers.
    public class CustomerService : ICustomerService
    {
        private readonly ICustomerRepository _repo;
        private readonly IAuditRepository _audit;

        public CustomerService(ICustomerRepository repo, IAuditRepository audit) { _repo = repo; _audit = audit; }

        public IList<CustomerRow> List() { return _repo.List(); }

        public CustomerRow Create(string name, string phone, string address, double creditLimit, ActorContext actor)
        {
            if (string.IsNullOrWhiteSpace(name)) throw new InvalidOperationException("الاسم مطلوب");
            var c = new CustomerRow
            {
                Id = Guid.NewGuid().ToString(), Name = name,
                Phone = phone ?? "", Address = address ?? "", CreditLimit = creditLimit
            };
            _repo.Add(c);
            try
            {
                _audit.Add(new AuditRow
                {
                    Action = "CREATE", Entity = "Customer", EntityId = c.Id, Details = "إضافة زبون " + c.Name,
                    Username = actor == null ? "" : (actor.Name ?? ""), UserId = actor == null ? null : actor.Id, Date = DateTime.Now
                });
            }
            catch { }
            return c;
        }
    }
}
