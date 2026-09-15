using System;
using Dokkanek.Desktop.Data.Repositories;
using Dokkanek.Desktop.Services.Interfaces;

namespace Dokkanek.Desktop.Services
{
    // يقابل lib/notify.ts: صف PENDING + إعادة خلفية، ولا ترمي أبدا.
    public class NotificationService : INotificationService
    {
        private readonly INotificationRepository _repo;
        private readonly ISettingsStore _settings;
        private System.Timers.Timer _timer;
        private bool _disposed;

        public NotificationService(INotificationRepository repo, ISettingsStore settings)
        {
            _repo = repo; _settings = settings;
        }

        public NotificationRow Queue(string to, string template, string body, string relatedType, string relatedId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(to)) return null;
                var n = _repo.Add(new NotificationRow
                {
                    Id = Guid.NewGuid().ToString(), To = to.Trim(), Template = template ?? "",
                    Body = body ?? "", RelatedType = relatedType ?? "", RelatedId = relatedId ?? "",
                    Status = "PENDING", CreatedAt = DateTime.Now
                });
                try { TrySend(n.Id); } catch { }
                return n;
            }
            catch { return null; }
        }

        public int RetryPending()
        {
            int done = 0;
            try
            {
                foreach (var n in _repo.ListPending(50))
                {
                    try { TrySend(n.Id); done++; } catch { }
                }
            }
            catch { }
            return done;
        }

        private void TrySend(string id)
        {
            var n = _repo.GetById(id);
            if (n == null || n.Status == "SENT") return;
            // بدون تفعيل ومزود: تبقى في قائمة الانتظار (لا ندعي الإرسال).
            string enabled = _settings.Get("wa_enabled", "");
            string endpoint = _settings.Get("wa_endpoint", "");
            if (enabled != "1" || string.IsNullOrWhiteSpace(endpoint)) return;
            try
            {
                string token = _settings.Get("wa_token", "");
                string sender = _settings.Get("wa_sender", "");
                string payload = "{\"to\":" + JsonStr(n.To) + ",\"body\":" + JsonStr(n.Body)
                    + (string.IsNullOrEmpty(sender) ? "" : ",\"sender\":" + JsonStr(sender)) + "}";
                var req = (System.Net.HttpWebRequest)System.Net.WebRequest.Create(endpoint);
                req.Method = "POST";
                req.ContentType = "application/json";
                if (!string.IsNullOrEmpty(token)) req.Headers["Authorization"] = "Bearer " + token;
                byte[] bytes = System.Text.Encoding.UTF8.GetBytes(payload);
                using (var s = req.GetRequestStream()) s.Write(bytes, 0, bytes.Length);
                using (var res = (System.Net.HttpWebResponse)req.GetResponse())
                {
                    if ((int)res.StatusCode < 200 || (int)res.StatusCode >= 300)
                        throw new InvalidOperationException("provider-" + (int)res.StatusCode);
                }
                _repo.MarkSent(id, DateTime.Now);
            }
            catch (Exception ex)
            {
                string msg = ex.Message ?? "";
                _repo.MarkFailed(id, msg.Length > 300 ? msg.Substring(0, 300) : msg);
            }
        }

        private static string JsonStr(string v)
        {
            if (v == null) return "\"\"";
            return "\"" + v.Replace("\\", "\\\\").Replace("\"", "\\\"")
                .Replace("\r", "\\r").Replace("\n", "\\n") + "\"";
        }

        public void StartBackground(TimeSpan interval)
        {
            StopBackground();
            _timer = new System.Timers.Timer(Math.Max(5000, interval.TotalMilliseconds));
            _timer.AutoReset = true;
            _timer.Elapsed += delegate { try { RetryPending(); } catch { } };
            _timer.Start();
        }

        public void StopBackground()
        {
            if (_timer != null) { try { _timer.Stop(); _timer.Dispose(); } catch { } _timer = null; }
        }

        public void Dispose()
        {
            if (_disposed) return;
            _disposed = true;
            StopBackground();
        }
    }
}
