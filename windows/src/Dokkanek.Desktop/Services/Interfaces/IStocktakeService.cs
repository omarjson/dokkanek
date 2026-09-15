using System.Collections.Generic;
using Dokkanek.Desktop.Data.Repositories;

namespace Dokkanek.Desktop.Services.Interfaces
{
    public interface IStocktakeService
    {
        StocktakeRow OpenStocktake(string note, ActorContext actor);
        void SetCount(string stocktakeId, string productId, double countedQty, ActorContext actor);
        void CloseStocktake(string stocktakeId, ActorContext actor);
        IList<StocktakeRow> Recent(int take);
    }
}
