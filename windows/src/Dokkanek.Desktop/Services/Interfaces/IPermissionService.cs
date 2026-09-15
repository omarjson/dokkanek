using System.Collections.Generic;

namespace Dokkanek.Desktop.Services.Interfaces
{
    public class PermDef
    {
        public string Key { get; set; } public string Label { get; set; } public string Desc { get; set; }
        public PermDef() { Key = ""; Label = ""; Desc = ""; }
    }

    public interface IPermissionService
    {
        IList<PermDef> All();
        IList<string> Roles();
        ISet<string> GetRolePerms(string role);
        bool HasPerm(string role, string key);
    }
}
