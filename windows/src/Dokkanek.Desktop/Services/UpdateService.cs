using Dokkanek.Desktop.Services.Interfaces;

namespace Dokkanek.Desktop.Services
{
    // غلاف Velopack عبر الانعكاس حتى لا نكسر البناء بدونه — no-op آمن إن لم يُثبَّت.
    public class UpdateService : IUpdateService
    {
        public bool IsAvailable { get { return VelopackType() != null; } }

        public UpdateInfo CheckForUpdates()
        {
            // تُربط بـ Velopack UpdateManager.CheckForUpdatesAsync هنا عند التثبيت.
            return new UpdateInfo { Available = false, Version = "", Notes = IsAvailable ? "" : "Velopack غير مثبت" };
        }

        public void ApplyAndRestart()
        {
            // تُربط بـ UpdateManager.ApplyUpdatesAndRestart هنا عند التثبيت.
            if (!IsAvailable) return;
        }

        private static System.Type VelopackType()
        {
            try
            {
                foreach (var a in System.AppDomain.CurrentDomain.GetAssemblies())
                {
                    if (a.GetName().Name == "Velopack")
                    {
                        var t = a.GetType("Velopack.UpdateManager");
                        if (t != null) return t;
                    }
                }
                var loaded = System.Reflection.Assembly.Load("Velopack");
                return loaded.GetType("Velopack.UpdateManager");
            }
            catch { return null; }
        }
    }
}
