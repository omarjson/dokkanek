using System.Collections.Generic;
using Dokkanek.Desktop.Data.Repositories;

namespace Dokkanek.Desktop.Services.Interfaces
{
    public interface IDeliveryService
    {
        IList<CourierTaskRow> ListTasks(int take);
        void SetStatus(string saleId, string status, ActorContext actor);
        void MarkDelivered(string saleId, double collected, ActorContext actor);
    }
}
