using System;
using Dokkanek.Desktop.Data.Repositories;
using Dokkanek.Desktop.Services.Interfaces;

namespace Dokkanek.Desktop.Services
{
    // يقابل app/api/payments + app/api/supplier-payments بنفس الحراس.
    public class PaymentService : IPaymentService
    {
        private readonly ISaleRepository _sales;
        private readonly IPaymentRepository _payments;
        private readonly ICustomerRepository _customers;
        private readonly ISupplierRepository _suppliers;
        private readonly IAuditRepository _audit;
        private readonly IUnitOfWork _uow;

        public PaymentService(ISaleRepository sales, IPaymentRepository payments, ICustomerRepository customers,
            ISupplierRepository suppliers, IAuditRepository audit, IUnitOfWork uow)
        {
            _sales = sales; _payments = payments; _customers = customers;
            _suppliers = suppliers; _audit = audit; _uow = uow;
        }

        public void CollectForSale(string saleId, double amount, string method, string note, ActorContext actor)
        {
            if (amount <= 0) throw new InvalidOperationException("المبلغ غير صالح");
            var sale = _sales.GetById(saleId);
            if (sale == null) throw new InvalidOperationException("الفاتورة غير موجودة");
            double rest = sale.Total - sale.Paid;
            if (amount > rest + 0.001) throw new InvalidOperationException("المبلغ أكبر من المتبقي (" + rest + ")");
            _uow.Begin();
            try
            {
                _sales.AddPaid(sale.Id, amount);
                if (!string.IsNullOrEmpty(sale.CustomerId))
                    _customers.AdjustBalance(sale.CustomerId, -amount);
                var p = new PaymentRow
                {
                    Id = Guid.NewGuid().ToString(), SaleId = sale.Id, CustomerId = sale.CustomerId,
                    Amount = amount, Method = string.IsNullOrEmpty(method) ? "CASH" : method,
                    Note = note ?? "سداد دين", Date = DateTime.Now
                };
                _payments.Add(p);
                Audit("CREATE", "Payment", p.Id, "سداد " + amount, actor);
                _uow.Commit();
            }
            catch { _uow.Rollback(); throw; }
        }

        public void CollectFromCustomer(string customerId, double amount, string method, string note, ActorContext actor)
        {
            if (amount <= 0) throw new InvalidOperationException("المبلغ غير صالح");
            if (string.IsNullOrEmpty(customerId)) throw new InvalidOperationException("حدد زبونا أو فاتورة");
            _uow.Begin();
            try
            {
                _customers.AdjustBalance(customerId, -amount);
                var p = new PaymentRow
                {
                    Id = Guid.NewGuid().ToString(), CustomerId = customerId,
                    Amount = amount, Method = string.IsNullOrEmpty(method) ? "CASH" : method,
                    Note = note ?? "سداد دين", Date = DateTime.Now
                };
                _payments.Add(p);
                Audit("CREATE", "Payment", p.Id, "سداد " + amount, actor);
                _uow.Commit();
            }
            catch { _uow.Rollback(); throw; }
        }

        public void PaySupplier(string supplierId, double amount, string method, string note, ActorContext actor)
        {
            if (actor == null || string.IsNullOrEmpty(actor.Id)) throw new InvalidOperationException("غير مصرح");
            if (string.IsNullOrEmpty(supplierId) || amount <= 0)
                throw new InvalidOperationException("المورد والمبلغ مطلوبان");
            var s = _suppliers.GetById(supplierId);
            if (s == null) throw new InvalidOperationException("المورد غير موجود");
            if (amount > s.Balance + 0.001)
                throw new InvalidOperationException("المبلغ أكبر من المستحق (" + s.Balance + ")");
            _uow.Begin();
            try
            {
                _suppliers.AdjustBalance(s.Id, -amount);
                var p = new PaymentRow
                {
                    Id = Guid.NewGuid().ToString(), SupplierId = s.Id,
                    Amount = amount, Method = string.IsNullOrEmpty(method) ? "CASH" : method,
                    Note = note ?? "سداد مورد", Date = DateTime.Now
                };
                _payments.Add(p);
                Audit("CREATE", "Payment", p.Id, "سداد مورد " + s.Name + ": " + amount, actor);
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
