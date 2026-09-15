using System.Collections.Generic;
using Dokkanek.Desktop.Data.Repositories;

namespace Dokkanek.Desktop.Services.Interfaces
{
    public interface ICustomerService
    {
        IList<CustomerRow> List();
        CustomerRow Create(string name, string phone, string address, double creditLimit, ActorContext actor);
    }
}
