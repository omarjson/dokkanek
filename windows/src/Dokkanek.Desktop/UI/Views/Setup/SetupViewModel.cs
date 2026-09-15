using System.Collections.Generic;
using System.Windows.Input;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Dokkanek.Desktop.Services.Interfaces;

namespace Dokkanek.Desktop.UI.Views.Setup
{
    public class SetupViewModel : ObservableObject
    {
        private readonly ISettingsService _settings;
        private readonly IBackupService _backup;

        private string _shopName = "";
        public string ShopName
        {
            get { return _shopName; }
            set { SetProperty(ref _shopName, value); }
        }

        private string _phone = "";
        public string Phone
        {
            get { return _phone; }
            set { SetProperty(ref _phone, value); }
        }

        private string _address = "";
        public string Address
        {
            get { return _address; }
            set { SetProperty(ref _address, value); }
        }

        private string _adminName = "";
        public string AdminName
        {
            get { return _adminName; }
            set { SetProperty(ref _adminName, value); }
        }

        private bool _termsAccepted;
        public bool TermsAccepted
        {
            get { return _termsAccepted; }
            set { SetProperty(ref _termsAccepted, value); }
        }

        private bool _privacyAccepted;
        public bool PrivacyAccepted
        {
            get { return _privacyAccepted; }
            set { SetProperty(ref _privacyAccepted, value); }
        }

        private string _backupLocation = "";
        public string BackupLocation
        {
            get { return _backupLocation; }
            set { SetProperty(ref _backupLocation, value); }
        }

        private string _restoreFile = "";
        public string RestoreFile
        {
            get { return _restoreFile; }
            set { SetProperty(ref _restoreFile, value); }
        }

        public ICommand PickBackupCommand { get; private set; }
        public ICommand PickRestoreCommand { get; private set; }
        public ICommand FinishCommand { get; private set; }

        public SetupViewModel(ISettingsService settings, IBackupService backup)
        {
            _settings = settings;
            _backup = backup;
            PickBackupCommand = new RelayCommand(PickBackup);
            PickRestoreCommand = new RelayCommand(PickRestore);
            FinishCommand = new RelayCommand(Finish);
        }

        private void PickBackup()
        {
            // TODO: FolderBrowserDialog in code-behind; store path via IBackupService.
        }

        private void PickRestore()
        {
            // TODO: OpenFileDialog (*.db) + IntegrityCheck before RestoreBackup.
        }

        private void Finish()
        {
            if (!TermsAccepted || !PrivacyAccepted) { return; }
            if (_settings == null) { return; }
            // TODO: create ADMIN via UserRepository + HashNewPassword, then save.
            _settings.Save(new Dictionary<string, string>
            {
                { "store_name", ShopName ?? "" },
                { "phone", Phone ?? "" },
                { "address", Address ?? "" },
                { "backup_location", BackupLocation ?? "" }
            }, new ActorContext { Name = AdminName ?? "setup", Role = "ADMIN" });
        }
    }
}
