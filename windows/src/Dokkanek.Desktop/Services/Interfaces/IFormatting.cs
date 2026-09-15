using System;
using System.Collections.Generic;

namespace Dokkanek.Desktop.Services.Interfaces
{
    public interface IFormatting
    {
        string Lyd(double? value);
        string FmtDate(DateTime? value);
        string SaleStatusAr(string status);
        string PayMethodAr(string method);
        string TicketStatusAr(string status);
        string TaskStatusAr(string status);
        string RoleAr(string role);
        IDictionary<string, string> SaleStatuses { get; }
        IDictionary<string, string> PayMethods { get; }
    }
}
