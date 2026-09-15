using System.Collections.Generic;
using Dokkanek.Desktop.Data.Repositories;

namespace Dokkanek.Desktop.Services.Interfaces
{
    public interface IExpenseService
    {
        IList<ExpenseRow> List();
        ExpenseRow Create(string title, double amount, string note, ActorContext actor);
        void Delete(string expenseId, ActorContext actor);
    }
}
