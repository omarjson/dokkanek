using System.Collections.Generic;
using Dokkanek.Desktop.Data.Repositories;

namespace Dokkanek.Desktop.Services.Interfaces
{
    public interface IProductService
    {
        IList<ProductRow> Search(string q, int take);
        ProductRow Create(string name, double salePrice, double costPrice, double costUsd,
            double quantity, string sku, string barcode, string categoryId, string warehouseId,
            double minQuantity, bool isFavorite, ActorContext actor);
        void Update(ProductRow product, ActorContext actor);
        void Deactivate(string productId, ActorContext actor);
    }
}
