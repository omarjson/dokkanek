using Dokkanek.Desktop.Data.Repositories;

namespace Dokkanek.Desktop.Services.Interfaces
{
    public interface IAuthService
    {
        UserRow Login(string username, string password);
        void Logout();
        UserRow CurrentUser { get; }
        // تجزئة PBKDF2 للكلمات الجديدة (التوافق SHA256 عند التحقق فقط).
        string HashNewPassword(string password);
    }
}
