using System.Collections.Generic;

namespace Dokkanek.Desktop.Services.Interfaces
{
    public interface IBackupService
    {
        // trigger: close/hourly/manual — محلي + USB فقط، بلا سحابة.
        string CreateBackup(string trigger, string sourceDbPath);
        IList<string> ListBackups();
        bool IntegrityCheck(string backupPath);
        void RestoreBackup(string backupPath, string targetDbPath);
    }
}
