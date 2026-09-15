using System.Collections.Generic;
using System.Windows.Input;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Dokkanek.Desktop.Services.Interfaces;

namespace Dokkanek.Desktop.UI.Views.Settings
{
    public class SettingsViewModel : ObservableObject
    {
        private readonly ISettingsService _settings;
        private readonly IAuthService _auth;

        private string _storeName = "";
        public string StoreName
        {
            get { return _storeName; }
            set { SetProperty(ref _storeName, value); }
        }

        private string _primaryColor = "#0d6efd";
        public string PrimaryColor
        {
            get { return _primaryColor; }
            set { SetProperty(ref _primaryColor, value); }
        }

        public ICommand SaveCommand { get; private set; }

        public SettingsViewModel(ISettingsService settings, IAuthService auth, ISessionService session)
        {
            _settings = settings;
            _auth = auth;
            SaveCommand = new RelayCommand(Save);
            Load();
        }

        private void Load()
        {
            try
            {
                if (_settings == null) { return; }
                StoreName = _settings.Get("store_name", "دكّانك");
                PrimaryColor = _settings.Get("primary_color", "#0d6efd");
            }
            catch { }
        }

        private ActorContext Actor()
        {
            var u = _auth != null ? _auth.CurrentUser : null;
            if (u == null) { return new ActorContext(); }
            return new ActorContext { Id = u.Id, Name = u.Name, Role = u.Role, BranchId = u.BranchId };
        }

        private void Save()
        {
            if (_settings == null) { return; }
            _settings.Save(new Dictionary<string, string>
            {
                { "store_name", StoreName ?? "" },
                { "primary_color", PrimaryColor ?? "#0d6efd" }
            }, Actor());
        }
    }
}
