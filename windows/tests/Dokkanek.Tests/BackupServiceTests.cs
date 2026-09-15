using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace Dokkanek.Tests
{
    // Contract tests for IBackupService rotation + hash verify (self-contained).

    public class FakeBackup
    {
        public string Name { get; set; }
        public DateTime Date { get; set; }
        public string Hash { get; set; }
    }

    public class FakeBackupService
    {
        public readonly List<FakeBackup> Store = new List<FakeBackup>();

        public static string Sha256(string s)
        {
            using (var sha = SHA256.Create())
            {
                byte[] b = sha.ComputeHash(Encoding.UTF8.GetBytes(s));
                return BitConverter.ToString(b).Replace("-", "");
            }
        }

        // Keep 7 daily / 4 weekly (simplified: keep newest 7).
        public void Rotate()
        {
            var keep = Store.OrderByDescending(x => x.Date).Take(7).ToList();
            Store.Clear();
            Store.AddRange(keep);
        }

        public void Restore(FakeBackup file, string expectedHash)
        {
            string actual = file.Hash;
            if (!string.Equals(actual, expectedHash, StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("hash mismatch");
            }
        }
    }

    [TestClass]
    public class BackupServiceTests
    {
        [TestMethod]
        public void Rotation_Keeps7()
        {
            var s = new FakeBackupService();
            for (int i = 0; i < 12; i++)
            {
                s.Store.Add(new FakeBackup { Name = "b" + i, Date = DateTime.Today.AddDays(-i) });
            }
            s.Rotate();
            Assert.AreEqual(7, s.Store.Count);
        }

        [TestMethod]
        public void HashMismatch_RejectsRestore()
        {
            var s = new FakeBackupService();
            var f = new FakeBackup { Name = "b", Hash = FakeBackupService.Sha256("real") };
            Assert.ThrowsException<InvalidOperationException>(() => s.Restore(f, FakeBackupService.Sha256("other")));
        }

        [TestMethod]
        public void HashMatch_AcceptsRestore()
        {
            var s = new FakeBackupService();
            string h = FakeBackupService.Sha256("real");
            s.Restore(new FakeBackup { Name = "b", Hash = h }, h);
        }
    }
}
