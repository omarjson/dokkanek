using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Security.Cryptography;
using Dokkanek.Desktop.Services.Interfaces;

namespace Dokkanek.Desktop.Services
{
    // نسخ محلية + USB فقط — بلا سحابة أبدا. gzip + sha256، تدوير 7/4، فحص قبل الاسترجاع.
    public class BackupService : IBackupService
    {
        private const int KeepLocal = 7;
        private const int KeepUsb = 4;

        public static string LocalDir()
        {
            return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "Dokkanek", "Backups");
        }

        private static IEnumerable<string> UsbDirs()
        {
            var dirs = new List<string>();
            try
            {
                foreach (var d in DriveInfo.GetDrives())
                {
                    if (d.DriveType == DriveType.Removable && d.IsReady)
                        try { dirs.Add(Path.Combine(d.RootDirectory.FullName, "DokkanekBackups")); }
                        catch { }
                }
            }
            catch { }
            return dirs;
        }

        public string CreateBackup(string trigger, string sourceDbPath)
        {
            if (string.IsNullOrEmpty(sourceDbPath) || !File.Exists(sourceDbPath))
                throw new InvalidOperationException("ملف القاعدة غير موجود");
            string stamp = DateTime.Now.ToString("yyyyMMdd-HHmmss");
            string name = "dokkanek-" + stamp + "-" + (trigger ?? "manual") + ".db.gz";
            var written = new List<string>();

            string local = Path.Combine(LocalDir(), name);
            WriteGzip(sourceDbPath, local);
            written.Add(local);
            foreach (var usb in UsbDirs())
            {
                try { WriteGzip(sourceDbPath, Path.Combine(usb, name)); written.Add(Path.Combine(usb, name)); }
                catch { }
            }
            try { Rotate(LocalDir(), KeepLocal); } catch { }
            foreach (var usb in UsbDirs()) { try { Rotate(usb, KeepUsb); } catch { } }
            return local;
        }

        private static void WriteGzip(string src, string dst)
        {
            Directory.CreateDirectory(Path.GetDirectoryName(dst));
            using (var fin = File.OpenRead(src))
            using (var fout = File.Create(dst))
            using (var gz = new GZipStream(fout, CompressionMode.Compress))
            {
                fin.CopyTo(gz);
            }
            File.WriteAllText(dst + ".sha256", Sha256Of(dst));
        }

        private static string Sha256Of(string path)
        {
            using (var sha = SHA256.Create())
            using (var f = File.OpenRead(path))
            {
                byte[] h = sha.ComputeHash(f);
                return BitConverter.ToString(h).Replace("-", "").ToLowerInvariant();
            }
        }

        private static void Rotate(string dir, int keep)
        {
            if (!Directory.Exists(dir)) return;
            var files = new DirectoryInfo(dir).GetFiles("dokkanek-*.db.gz")
                .OrderByDescending(f => f.Name).Skip(keep).ToList();
            foreach (var f in files)
            {
                try { File.Delete(f.FullName); } catch { }
                try { File.Delete(f.FullName + ".sha256"); } catch { }
            }
        }

        public IList<string> ListBackups()
        {
            var all = new List<string>();
            try
            {
                if (Directory.Exists(LocalDir()))
                    all.AddRange(Directory.GetFiles(LocalDir(), "dokkanek-*.db.gz"));
            }
            catch { }
            foreach (var usb in UsbDirs())
            {
                try { if (Directory.Exists(usb)) all.AddRange(Directory.GetFiles(usb, "dokkanek-*.db.gz")); }
                catch { }
            }
            all.Sort();
            all.Reverse();
            return all;
        }

        public bool IntegrityCheck(string backupPath)
        {
            try
            {
                if (string.IsNullOrEmpty(backupPath) || !File.Exists(backupPath)) return false;
                string sidecar = backupPath + ".sha256";
                if (File.Exists(sidecar))
                {
                    string expect = File.ReadAllText(sidecar).Trim().ToLowerInvariant();
                    if (!string.IsNullOrEmpty(expect) && Sha256Of(backupPath) != expect) return false;
                }
                string tmp = Path.GetTempFileName();
                try
                {
                    using (var fin = File.OpenRead(backupPath))
                    using (var gz = new GZipStream(fin, CompressionMode.Decompress))
                    using (var fout = File.Create(tmp)) gz.CopyTo(fout);
                    return new FileInfo(tmp).Length > 0;
                }
                finally { try { File.Delete(tmp); } catch { } }
            }
            catch { return false; }
        }

        public void RestoreBackup(string backupPath, string targetDbPath)
        {
            if (!IntegrityCheck(backupPath)) throw new InvalidOperationException("النسخة تالفة — تعذر الاسترجاع");
            if (File.Exists(targetDbPath))
            {
                string safe = targetDbPath + "." + DateTime.Now.ToString("yyyyMMdd-HHmmss") + ".pre-restore";
                File.Copy(targetDbPath, safe, true);
            }
            string tmp = Path.GetTempFileName();
            try
            {
                using (var fin = File.OpenRead(backupPath))
                using (var gz = new GZipStream(fin, CompressionMode.Decompress))
                using (var fout = File.Create(tmp)) gz.CopyTo(fout);
                Directory.CreateDirectory(Path.GetDirectoryName(targetDbPath));
                File.Copy(tmp, targetDbPath, true);
            }
            finally { try { File.Delete(tmp); } catch { } }
        }
    }
}
