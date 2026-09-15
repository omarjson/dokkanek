using System;
using System.Collections.Generic;
using System.Windows.Input;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Dokkanek.Desktop.Services.Interfaces;

namespace Dokkanek.Desktop.UI.Views.Terms
{
    public class TermsViewModel : ObservableObject
    {
        private readonly ISettingsService _settings;
        private readonly IAuditService _audit;

        private bool _isAccepted;
        public bool IsAccepted
        {
            get { return _isAccepted; }
            set { SetProperty(ref _isAccepted, value); }
        }

        private string _acceptedAt = "";
        public string AcceptedAt
        {
            get { return _acceptedAt; }
            set { SetProperty(ref _acceptedAt, value); }
        }

        public ICommand AcceptCommand { get; private set; }

        public TermsViewModel(ISettingsService settings, IAuditService audit)
        {
            _settings = settings;
            _audit = audit;
            AcceptCommand = new RelayCommand(Accept);
            try
            {
                if (settings != null) { AcceptedAt = settings.Get("terms_accepted_at", ""); }
            }
            catch { }
        }

        private void Accept()
        {
            if (!IsAccepted) { return; }
            AcceptedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm");
            try
            {
                if (_settings != null)
                {
                    // TODO: use real session actor instead of bootstrap actor.
                    _settings.Save(new Dictionary<string, string> { { "terms_accepted_at", AcceptedAt } },
                        new ActorContext { Role = "ADMIN" });
                }
                if (_audit != null) { _audit.Log("TERMS_ACCEPT", "Setting", "terms", AcceptedAt, "", null); }
            }
            catch { }
        }
    }
}
