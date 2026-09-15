using System.Collections.Generic;

namespace Dokkanek.Desktop.Services.Interfaces
{
    public interface ISettingsService
    {
        IDictionary<string, string> GetAll();
        string Get(string key, string fallback);
        void Save(IDictionary<string, string> values, ActorContext actor);
    }
}
