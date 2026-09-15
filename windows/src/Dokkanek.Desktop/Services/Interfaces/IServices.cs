using System.Collections.Generic;

namespace Dokkanek.Desktop.Services.Interfaces
{
    // UI-owned session adapter (no name clash with backend interfaces).
    // Backend auth data comes from IAuthService; this tracks the active
    // desktop session (user + role + branch) for nav filtering + guards.

    public class SessionUser
    {
        public string Name { get; set; }
        public string Role { get; set; }
        public string Branch { get; set; }
        public SessionUser() { Name = ""; Role = ""; Branch = ""; }
    }

    public interface ISessionService
    {
        SessionUser Current { get; }
        bool IsAuthenticated { get; }
        bool HasPerm(string perm);
        bool HasRole(params string[] roles);
        bool IsModuleEnabled(string mod);
        ActorContext Actor { get; }
        void SignIn(string name, string role, string branch);
        void SignOut();
        void SetPermissions(ISet<string> perms);
        void SetModules(IDictionary<string, bool> enabled);
    }

    public interface ISyncService
    {
        int OutboxCount { get; }
    }

    public class SessionService : ISessionService
    {
        private readonly HashSet<string> _perms = new HashSet<string>();
        private readonly Dictionary<string, bool> _mods = new Dictionary<string, bool>();

        public SessionUser Current { get; private set; }
        public bool IsAuthenticated { get { return Current != null; } }

        public ActorContext Actor
        {
            get
            {
                if (Current == null) { return null; }
                return new ActorContext { Name = Current.Name, Role = Current.Role };
            }
        }

        public SessionService()
        {
            // Design-time default; real login replaces via SignIn.
            Current = new SessionUser { Name = "مستخدم", Role = "ADMIN", Branch = "الرئيسي" };
            _perms.Add("*");
        }

        public void SignIn(string name, string role, string branch)
        {
            Current = new SessionUser { Name = name, Role = role, Branch = branch };
        }

        public void SignOut() { Current = null; }

        public void SetPermissions(ISet<string> perms)
        {
            _perms.Clear();
            if (perms != null) { foreach (var p in perms) { _perms.Add(p); } }
        }

        public void SetModules(IDictionary<string, bool> enabled)
        {
            _mods.Clear();
            if (enabled != null) { foreach (var kv in enabled) { _mods[kv.Key] = kv.Value; } }
        }

        public bool HasPerm(string perm)
        {
            return _perms.Contains("*") || _perms.Contains(perm);
        }

        public bool HasRole(params string[] roles)
        {
            if (roles == null || roles.Length == 0 || Current == null) { return true; }
            foreach (var r in roles) { if (r == Current.Role) { return true; } }
            return false;
        }

        public bool IsModuleEnabled(string mod)
        {
            if (string.IsNullOrEmpty(mod)) { return true; }
            bool v;
            return _mods.TryGetValue(mod, out v) ? v : true;
        }
    }

    public class StubSyncService : ISyncService
    {
        // TODO: count rows in PendingSale outbox table.
        public int OutboxCount { get { return 0; } }
    }
}
