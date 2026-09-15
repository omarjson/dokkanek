using System.Collections.Generic;
using Dokkanek.Desktop.Data.Repositories;
using Dokkanek.Desktop.Services.Interfaces;

namespace Dokkanek.Desktop.Services
{
    // يقابل app/api/settings — POST بديل PUT مدمج (Save واحدة).
    public class SettingsService : ISettingsService
    {
        private readonly ISettingsStore _store;
        private readonly IPermissionService _perms;
        private readonly IAuditRepository _audit;

        public SettingsService(ISettingsStore store, IPermissionService perms, IAuditRepository audit)
        {
            _store = store; _perms = perms; _audit = audit;
        }

        public IDictionary<string, string> GetAll() { return _store.GetAll(); }

        public string Get(string key, string fallback) { return _store.Get(key, fallback); }

        public void Save(IDictionary<string, string> values, ActorContext actor)
        {
            if (actor == null || !_perms.HasPerm(actor.Role, "settings.edit"))
                throw new System.InvalidOperationException("الإعدادات للمالك فقط");
            if (values == null) return;
            foreach (var kv in values) _store.Set(kv.Key, kv.Value ?? "");
            try
            {
                _audit.Add(new AuditRow
                {
                    Action = "UPDATE", Entity = "Setting", EntityId = "",
                    Details = "تحديث الإعدادات", Username = actor.Name ?? "",
                    UserId = actor.Id, Date = System.DateTime.Now
                });
            }
            catch { }
        }
    }
}
