using System.Collections.Generic;

namespace Dokkanek.Desktop.Services.Interfaces
{
    public class ModuleDef
    {
        public string Key { get; set; } public string Label { get; set; } public string Desc { get; set; }
        public ModuleDef() { Key = ""; Label = ""; Desc = ""; }
    }

    public class ModuleState
    {
        public IDictionary<string, bool> Enabled { get; set; } public string Preset { get; set; }
        public ModuleState() { Enabled = new Dictionary<string, bool>(); Preset = "general"; }
    }

    public interface IModuleService
    {
        IList<ModuleDef> All();
        ModuleState GetModuleState();
        bool IsModuleEnabled(string key);
    }
}
