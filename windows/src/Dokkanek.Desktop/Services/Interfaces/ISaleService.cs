using System.Collections.Generic;
using Dokkanek.Desktop.Data.Repositories;

namespace Dokkanek.Desktop.Services.Interfaces
{
    public interface ISaleService
    {
        SaleResult CreateSale(SaleRequest request, ActorContext actor);
        void VoidSale(string saleId, ActorContext actor);
        IList<SaleRow> Recent(int take);
    }
}
