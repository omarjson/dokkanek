using System.Collections.Generic;
using Dokkanek.Desktop.Data.Repositories;

namespace Dokkanek.Desktop.Services.Interfaces
{
    public interface IEmployeeService
    {
        IList<EmployeeRow> List(ActorContext actor);
        EmployeeRow Create(string name, string phone, string title, double salary, double commissionRate, ActorContext actor);
        void GrantAdvance(string employeeId, double amount, string note, ActorContext actor);
        void SettleAdvance(string advanceId, ActorContext actor);
        void RecordAttendance(string employeeId, System.DateTime checkIn, System.DateTime checkOut, bool hasCheckOut, ActorContext actor);
    }
}
