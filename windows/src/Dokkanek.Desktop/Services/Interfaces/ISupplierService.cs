using System.Collections.Generic;
using Dokkanek.Desktop.Data.Repositories;

namespace Dokkanek.Desktop.Services.Interfaces
{
    public interface ISupplierService
    {
        IList<SupplierRow> List();
        SupplierRow Create(string name, string phone, string address, ActorContext actor);
    }
}
