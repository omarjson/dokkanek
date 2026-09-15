using System.Windows.Input;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Dokkanek.Desktop.Services.Interfaces;

namespace Dokkanek.Desktop.UI
{
    public class MainWindowViewModel : ObservableObject
    {
        private readonly ISessionService _session;

        private string _storeName = "دكّانك";
        public string StoreName
        {
            get { return _storeName; }
            set { SetProperty(ref _storeName, value); }
        }

        private string _userName = "—";
        public string UserName
        {
            get { return _userName; }
            set { SetProperty(ref _userName, value); }
        }

        private string _roleLabel = "—";
        public string RoleLabel
        {
            get { return _roleLabel; }
            set { SetProperty(ref _roleLabel, value); }
        }

        private string _branchName = "الرئيسي";
        public string BranchName
        {
            get { return _branchName; }
            set { SetProperty(ref _branchName, value); }
        }

        private string _shiftInfo = "لا وردية مفتوحة";
        public string ShiftInfo
        {
            get { return _shiftInfo; }
            set { SetProperty(ref _shiftInfo, value); }
        }

        private string _backupState = "النسخ: سليم";
        public string BackupState
        {
            get { return _backupState; }
            set { SetProperty(ref _backupState, value); }
        }

        private string _updateState = "محدّث";
        public string UpdateState
        {
            get { return _updateState; }
            set { SetProperty(ref _updateState, value); }
        }

        private object _selectedView;
        public object SelectedView
        {
            get { return _selectedView; }
            set { SetProperty(ref _selectedView, value); }
        }

        public ICommand NavigateCommand { get; private set; }
        public ICommand ToggleNavCommand { get; private set; }
        public ICommand LogoutCommand { get; private set; }

        public MainWindowViewModel(ISessionService session)
        {
            _session = session;
            if (session != null && session.Current != null)
            {
                UserName = session.Current.Name;
                RoleLabel = session.Current.Role;
                BranchName = session.Current.Branch;
            }
            // Backend settings (store name) when wired; keep default otherwise.
            try
            {
                var settings = App.Services != null
                    ? (ISettingsService)App.Services.GetService(typeof(ISettingsService)) : null;
                if (settings != null) { StoreName = settings.Get("store_name", StoreName); }
            }
            catch { }
            NavigateCommand = new RelayCommand<string>(Navigate);
            ToggleNavCommand = new RelayCommand(ToggleNav);
            LogoutCommand = new RelayCommand(Logout);
        }

        private void Navigate(string key)
        {
            // TODO: resolve view via DI + RequireAuth guard.
            SelectedView = key;
        }

        private void ToggleNav() { }

        private void Logout()
        {
            // TODO: IAuthService.Logout + session.SignOut + navigate to Login.
        }

        // Visibility filters by role/perm/module (bind in XAML).
        public bool CanViewPos { get { return Vis(null, null, null); } }
        public bool CanViewSales { get { return Vis(null, null, null); } }
        public bool CanViewCustomers { get { return Vis(null, null, null); } }
        public bool CanViewProducts { get { return Vis(null, null, null); } }
        public bool CanViewStickers { get { return Vis(null, null, null); } }
        public bool CanViewStocktake { get { return Vis("stocktake", null, null); } }
        public bool CanViewTransfers { get { return Vis("transfers", null, null); } }
        public bool CanViewSuppliers { get { return Vis("suppliers", "purchases.manage", null); } }
        public bool CanViewExpenses { get { return Vis("expenses", "expenses.view", null); } }
        public bool CanViewReturns { get { return Vis("returns", null, null); } }
        public bool CanViewShifts { get { return Vis("shifts", null, null); } }
        public bool CanViewDelivery { get { return Vis("delivery", null, null); } }
        public bool CanViewMaintenance { get { return Vis("maintenance", null, null); } }
        public bool CanViewReports { get { return Vis("reports", "reports.profit", null); } }
        public bool CanViewEmployees { get { return Vis("employees", "hr.view", null); } }
        public bool CanViewUsers { get { return Vis(null, "users.manage", null); } }
        public bool CanViewSettings { get { return Vis(null, "settings.edit", null); } }

        private bool Vis(string mod, string perm, string[] roles)
        {
            return Navigation.RequireAuth.CanView(_session, perm, mod, roles);
        }
    }
}
