namespace Dokkanek.Desktop.Services.Interfaces
{
    public interface IAuditService
    {
        // لا يكسر العملية الأساسية لو فشل — يقابل lib/audit.ts.
        void Log(string action, string entity, string entityId, string details, string username, string userId);
    }
}
