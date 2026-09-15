using System;
using Dokkanek.Desktop.Data.Repositories;
using Dokkanek.Desktop.Services.Interfaces;

namespace Dokkanek.Desktop.Services
{
    // يقابل lib/audit.ts — لا يكسر العملية الأساسية لو فشل السجل.
    public class AuditService : IAuditService
    {
        private readonly IAuditRepository _repo;

        public AuditService(IAuditRepository repo) { _repo = repo; }

        public void Log(string action, string entity, string entityId, string details, string username, string userId)
        {
            try
            {
                _repo.Add(new AuditRow
                {
                    Action = action ?? "", Entity = entity ?? "", EntityId = entityId ?? "",
                    Details = details ?? "", Username = username ?? "", UserId = userId, Date = DateTime.Now
                });
            }
            catch { }
        }
    }
}
