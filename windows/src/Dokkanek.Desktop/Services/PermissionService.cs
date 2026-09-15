using System.Collections.Generic;
using Dokkanek.Desktop.Data.Repositories;
using Dokkanek.Desktop.Services.Interfaces;

namespace Dokkanek.Desktop.Services
{
    // مرآة lib/permissions.ts بالضبط: نفس القائمة والافتراضيات والتجاوزات.
    public class PermissionService : IPermissionService
    {
        private static readonly PermDef[] Perms = {
            P("cost.view", "رؤية التكلفة", "أسعار التكلفة وهوامش الربح التفصيلية"),
            P("price.edit", "تعديل الأسعار والأصناف", "إضافة وتعديل الأصناف وأسعار البيع"),
            P("price.usd", "التكلفة بالدولار", "رؤية وتعديل التكلفة الدولارية"),
            P("products.delete", "حذف الأصناف", ""),
            P("sales.discount", "الخصومات", "خصم في نقطة البيع"),
            P("sales.void", "إلغاء الفواتير", ""),
            P("purchases.manage", "المشتريات والموردون", "فواتير الشراء وإضافة الموردين والسداد"),
            P("expenses.view", "المصروفات", "عرض وتسجيل المصروفات (إيجارات وغيرها)"),
            P("reports.profit", "الأرباح والتقارير", ""),
            P("hr.view", "الموظفون والرواتب", "كشوف الرواتب والحضور"),
            P("hr.advance", "السلف", "منح وتسوية سلف الموظفين"),
            P("stocktake.adjust", "تسوية الجرد", "إقفال الجرد وتعديل المخزون"),
            P("users.manage", "المستخدمون", "الحسابات والأدوار"),
            P("settings.edit", "الإعدادات", "الهوية والوحدات والصلاحيات"),
        };

        private static readonly string[] RolesList = { "MANAGER", "CASHIER", "COURIER", "TECHNICIAN" };

        private static readonly IDictionary<string, string[]> Defaults = new Dictionary<string, string[]>
        {
            { "ADMIN", new[] { "*" } },
            { "MANAGER", new[] { "price.edit", "sales.discount", "purchases.manage", "expenses.view", "reports.profit", "stocktake.adjust" } },
            { "CASHIER", new string[0] },
            { "COURIER", new string[0] },
            { "TECHNICIAN", new string[0] },
        };

        private readonly ISettingsStore _settings;

        public PermissionService(ISettingsStore settings) { _settings = settings; }

        private static PermDef P(string k, string l, string d) { return new PermDef { Key = k, Label = l, Desc = d }; }

        public IList<PermDef> All() { return new List<PermDef>(Perms); }

        public IList<string> Roles() { return new List<string>(RolesList); }

        public ISet<string> GetRolePerms(string role)
        {
            var set = new HashSet<string>();
            string[] def;
            // يقابل lib: (ROLE_DEFAULTS[role] || []) ثم حلقة التجاوزات دائما — حتى لدور غير معروف.
            if (Defaults.TryGetValue(role ?? "", out def))
            {
                if (def.Length == 1 && def[0] == "*")
                {
                    foreach (var p in Perms) set.Add(p.Key);
                    return set;
                }
                foreach (var k in def) set.Add(k);
            }
            foreach (var p in Perms)
            {
                string v = _settings.Get("perm_" + role + "_" + p.Key, "");
                if (v == "1") set.Add(p.Key);
                else if (v == "0") set.Remove(p.Key);
            }
            return set;
        }

        public bool HasPerm(string role, string key)
        {
            if (string.IsNullOrEmpty(role)) return false;
            return GetRolePerms(role).Contains(key);
        }
    }
}
