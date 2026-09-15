using System;
using System.Security.Cryptography;
using System.Text;
using Dokkanek.Desktop.Data.Repositories;
using Dokkanek.Desktop.Services.Interfaces;

namespace Dokkanek.Desktop.Services
{
    // يقابل app/api/auth/route.ts: حد 5 محاولات/5 دقائق — مخزّن في Settings ليدوم بعد إعادة التشغيل.
    public class AuthService : IAuthService
    {
        private const int MaxFails = 5;
        private static readonly TimeSpan LockWindow = TimeSpan.FromMinutes(5);
        private const int Pbkdf2Iter = 10000;

        private readonly IUserRepository _users;
        private readonly ISettingsStore _settings;
        private readonly IAuditRepository _audit;

        public AuthService(IUserRepository users, ISettingsStore settings, IAuditRepository audit)
        {
            _users = users; _settings = settings; _audit = audit;
        }

        public UserRow CurrentUser { get; private set; }

        public UserRow Login(string username, string password)
        {
            string key = (username ?? "").Trim().ToLowerInvariant();
            string lockKey = "lock_" + key;
            int fails = 0;
            long untilTicks = 0;
            ParseLock(_settings.Get(lockKey, ""), out fails, out untilTicks);
            if (fails >= MaxFails && new DateTime(untilTicks) > DateTime.UtcNow)
                throw new InvalidOperationException("محاولات كثيرة — انتظر 5 دقائق");

            var user = _users.GetByUsername((username ?? "").Trim());
            bool ok = user != null && user.Active && Verify(password ?? "", user.PasswordHash);
            if (!ok)
            {
                DateTime until = DateTime.UtcNow + LockWindow;
                int n = (new DateTime(untilTicks) > DateTime.UtcNow) ? fails + 1 : 1;
                _settings.Set(lockKey, n + "|" + until.Ticks);
                throw new InvalidOperationException("بيانات الدخول غير صحيحة");
            }
            _settings.Set(lockKey, "");
            CurrentUser = user;
            try
            {
                _audit.Add(new AuditRow
                {
                    Action = "LOGIN", Entity = "User", EntityId = user.Id,
                    Details = "دخول " + user.Name, Username = user.Name, UserId = user.Id, Date = DateTime.Now
                });
            }
            catch { }
            return user;
        }

        public void Logout() { CurrentUser = null; }

        public string HashNewPassword(string password)
        {
            byte[] salt = new byte[16];
            using (var rng = RandomNumberGenerator.Create()) rng.GetBytes(salt);
            byte[] hash;
            using (var k = new Rfc2898DeriveBytes(password ?? "", salt, Pbkdf2Iter)) hash = k.GetBytes(32);
            return "pbkdf2:" + Pbkdf2Iter + ":" + Convert.ToBase64String(salt) + ":" + Convert.ToBase64String(hash);
        }

        private static void ParseLock(string v, out int fails, out long ticks)
        {
            fails = 0; ticks = 0;
            if (string.IsNullOrEmpty(v)) return;
            string[] p = v.Split('|');
            if (p.Length == 2) { int.TryParse(p[0], out fails); long.TryParse(p[1], out ticks); }
        }

        // توافق الويب: SHA256("dokkanek:password") hex — يقابل lib/auth.ts.
        public static string LegacyHash(string password)
        {
            using (var sha = SHA256.Create())
            {
                byte[] b = sha.ComputeHash(Encoding.UTF8.GetBytes("dokkanek:" + (password ?? "")));
                var sb = new StringBuilder(b.Length * 2);
                foreach (byte x in b) sb.Append(x.ToString("x2"));
                return sb.ToString();
            }
        }

        private static bool Verify(string password, string stored)
        {
            if (string.IsNullOrEmpty(stored)) return false;
            if (stored.StartsWith("pbkdf2:", StringComparison.Ordinal))
            {
                try
                {
                    string[] p = stored.Split(':');
                    int iter = int.Parse(p[1]);
                    byte[] salt = Convert.FromBase64String(p[2]);
                    byte[] expect = Convert.FromBase64String(p[3]);
                    byte[] actual;
                    using (var k = new Rfc2898DeriveBytes(password, salt, iter)) actual = k.GetBytes(expect.Length);
                    if (actual.Length != expect.Length) return false;
                    int d = 0;
                    for (int i = 0; i < actual.Length; i++) d |= actual[i] ^ expect[i];
                    return d == 0;
                }
                catch { return false; }
            }
            string a = LegacyHash(password);
            if (a.Length != stored.Length) return false;
            int diff = 0;
            for (int i = 0; i < a.Length; i++) diff |= a[i] ^ stored[i];
            return diff == 0;
        }
    }
}
