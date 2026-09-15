using System.Collections.Generic;
using Dokkanek.Desktop.Data.Repositories;

namespace Dokkanek.Desktop.Services.Interfaces
{
    public class ShiftCloseResult
    {
        public double Expected { get; set; } public double Closing { get; set; } public double Diff { get; set; }
    }

    public interface IShiftService
    {
        CashShiftRow OpenShift(double opening, ActorContext actor);
        ShiftCloseResult CloseShift(double closing, ActorContext actor);
        CashShiftRow GetOpen();
        double ExpectedForOpen();
        IList<CashShiftRow> History(int take);
    }
}
