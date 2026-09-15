using System;
using Dokkanek.Desktop.Data.Repositories;

namespace Dokkanek.Desktop.Services.Interfaces
{
    public interface INotificationService : IDisposable
    {
        // صف PENDING + محاولة فورية صامتة — لا ترمي أبدا داخل مسار البيع.
        NotificationRow Queue(string to, string template, string body, string relatedType, string relatedId);
        int RetryPending();
        void StartBackground(TimeSpan interval);
        void StopBackground();
    }
}
