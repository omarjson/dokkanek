using System.Collections.Generic;
using Dokkanek.Desktop.Data.Repositories;
using Dokkanek.Desktop.Services.Interfaces;

namespace Dokkanek.Desktop.Services
{
    // مرآة lib/modules.ts بالضبط: نفس الوحدات والـ presets (القيم المذكورة فقط تُطفأ).
    public class ModuleService : IModuleService
    {
        private static readonly ModuleDef[] Mods = {
            M("maintenance", "الصيانة", "استلام أجهزة وتذاكر وفنيون — لمحلات الهواتف والإلكترونيات"),
            M("delivery", "التوصيل والمناديب", "مهام التوصيل والتحصيل عند التسليم"),
            M("suppliers", "الموردون والمشتريات", "فواتير الشراء وديون الموردين"),
            M("employees", "الموظفون والحضور", "رواتب تلقائية من الدقائق وعمولات"),
            M("expenses", "المصروفات", "سجل مصروفات المحل"),
            M("returns", "الرواجع والتالف", "مرتجعات الزبائن والأصناف التالفة"),
            M("shifts", "ورديات الخزينة", "فتح بعهدة وإقفال بجرد فعلي"),
            M("reports", "التقارير", "أرباح وهامش والأعلى مبيعا"),
            M("developers", "الربط API/MCP", "مفتاح الربط الخارجي والذكاء الاصطناعي"),
            M("notifications", "التنبيهات", "طابور رسائل الزبائن"),
            M("import", "الاستيراد", "استيراد الأصناف من Excel"),
            M("stocktake", "الجرد المخزني", "جرد فعلي وتسوية الفروقات"),
            M("transfers", "التحويل بين المخازن", "سجل تحويلات موثق بمرجع"),
        };

        private static readonly IDictionary<string, string[]> Presets = new Dictionary<string, string[]>
        {
            { "general", new string[0] },
            { "phones", new string[0] },
            { "grocery", new[] { "maintenance", "developers" } },
            { "clothing", new[] { "maintenance" } },
        };

        private readonly ISettingsStore _settings;

        public ModuleService(ISettingsStore settings) { _settings = settings; }

        private static ModuleDef M(string k, string l, string d) { return new ModuleDef { Key = k, Label = l, Desc = d }; }

        public IList<ModuleDef> All() { return new List<ModuleDef>(Mods); }

        public ModuleState GetModuleState()
        {
            var st = new ModuleState();
            foreach (var m in Mods) st.Enabled[m.Key] = _settings.Get("mod_" + m.Key, "") != "0";
            st.Preset = _settings.Get("store_type", "general");
            if (string.IsNullOrEmpty(st.Preset)) st.Preset = "general";
            return st;
        }

        public bool IsModuleEnabled(string key) { return GetModuleState().Enabled.TryGetValue(key, out bool v) ? v : true; }

        public static string[] OffForPreset(string preset)
        {
            string[] off;
            return Presets.TryGetValue(preset ?? "general", out off) ? off : new string[0];
        }
    }
}
