using System;
using System.Collections.Generic;
using Dokkanek.Desktop.Data.Repositories;
using Dokkanek.Desktop.Services.Interfaces;

namespace Dokkanek.Desktop.Services
{
    // يقابل app/api/products: إنشاء يحتاج price.edit + رصيد افتتاحي IN.
    public class ProductService : IProductService
    {
        private readonly IProductRepository _products;
        private readonly IStockMoveRepository _moves;
        private readonly IAuditRepository _audit;
        private readonly IPermissionService _perms;

        public ProductService(IProductRepository products, IStockMoveRepository moves,
            IAuditRepository audit, IPermissionService perms)
        {
            _products = products; _moves = moves; _audit = audit; _perms = perms;
        }

        public IList<ProductRow> Search(string q, int take) { return _products.Search(q ?? "", take <= 0 ? 200 : take); }

        public ProductRow Create(string name, double salePrice, double costPrice, double costUsd,
            double quantity, string sku, string barcode, string categoryId, string warehouseId,
            double minQuantity, bool isFavorite, ActorContext actor)
        {
            if (actor == null || !_perms.HasPerm(actor.Role, "price.edit"))
                throw new InvalidOperationException("إضافة الأصناف تحتاج صلاحية");
            if (string.IsNullOrWhiteSpace(name))
                throw new InvalidOperationException("الاسم وسعر البيع مطلوبان");
            var p = new ProductRow
            {
                Id = Guid.NewGuid().ToString(),
                Sku = string.IsNullOrEmpty(sku) ? "SKU-" + DocNo.Base36Now() : sku,
                Name = name, CategoryId = categoryId, CostPrice = costPrice, CostUsd = costUsd,
                SalePrice = salePrice, Quantity = quantity, WarehouseId = warehouseId,
                Barcode = barcode ?? "", MinQuantity = minQuantity, IsFavorite = isFavorite, Active = true
            };
            _products.Add(p);
            try
            {
                _moves.Add(new StockMoveRow
                {
                    ProductId = p.Id, Qty = p.Quantity, Type = "IN",
                    Note = "رصيد افتتاحي", UserId = actor.Id, Date = DateTime.Now
                });
            }
            catch { }
            Audit("CREATE", "Product", p.Id, "إضافة صنف " + p.Name, actor);
            return p;
        }

        public void Update(ProductRow product, ActorContext actor)
        {
            if (actor == null || !_perms.HasPerm(actor.Role, "price.edit"))
                throw new InvalidOperationException("إضافة الأصناف تحتاج صلاحية");
            if (product == null || string.IsNullOrWhiteSpace(product.Name))
                throw new InvalidOperationException("الاسم وسعر البيع مطلوبان");
            _products.Update(product);
            Audit("UPDATE", "Product", product.Id, "تعديل صنف " + product.Name, actor);
        }

        public void Deactivate(string productId, ActorContext actor)
        {
            if (actor == null || !_perms.HasPerm(actor.Role, "products.delete"))
                throw new InvalidOperationException("حذف الأصناف يحتاج صلاحية");
            var p = _products.GetById(productId);
            if (p == null) throw new InvalidOperationException("الصنف غير موجود");
            p.Active = false;
            _products.Update(p);
            Audit("DELETE", "Product", p.Id, "حذف صنف " + p.Name, actor);
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
