using System.Collections.Generic;

namespace Dokkanek.Desktop.Services.Interfaces
{
    public interface IPurchaseService
    {
        SaleResult CreatePurchase(string supplierId, IList<PurchaseItemInput> items, double paid, ActorContext actor);
    }
}
