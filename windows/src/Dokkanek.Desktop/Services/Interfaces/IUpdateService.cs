namespace Dokkanek.Desktop.Services.Interfaces
{
    public class UpdateInfo
    {
        public bool Available { get; set; } public string Version { get; set; } public string Notes { get; set; }
        public UpdateInfo() { Version = ""; Notes = ""; }
    }

    // غلاف Velopack — no-op آمن إن لم يُثبَّت.
    public interface IUpdateService
    {
        bool IsAvailable { get; }
        UpdateInfo CheckForUpdates();
        void ApplyAndRestart();
    }
}
