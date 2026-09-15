namespace Dokkanek.Desktop.Services.Interfaces
{
    public interface IPaymentService
    {
        // تحصيل على فاتورة — يقابل app/api/payments (saleId).
        void CollectForSale(string saleId, double amount, string method, string note, ActorContext actor);
        // سداد دين زبون مباشر — يقابل app/api/payments (customerId).
        void CollectFromCustomer(string customerId, double amount, string method, string note, ActorContext actor);
        // سداد دين مورد — يقابل app/api/supplier-payments.
        void PaySupplier(string supplierId, double amount, string method, string note, ActorContext actor);
    }
}
