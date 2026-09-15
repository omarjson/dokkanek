using System.Collections.Generic;
using Dokkanek.Desktop.Data.Repositories;

namespace Dokkanek.Desktop.Services.Interfaces
{
    public interface IMaintenanceService
    {
        IList<TicketRow> ListRecent(int take);
        TicketRow Receive(string customerName, string customerPhone, string device, string issue, string technician, double cost, ActorContext actor);
        void SetStatus(string ticketId, string status, ActorContext actor);
        void AddPart(string ticketId, string partName, double partCost, ActorContext actor);
    }
}
