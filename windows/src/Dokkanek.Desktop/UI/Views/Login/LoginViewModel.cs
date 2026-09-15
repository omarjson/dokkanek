using System.Windows.Input;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Dokkanek.Desktop.Services.Interfaces;

namespace Dokkanek.Desktop.UI.Views.Login
{
    public class LoginViewModel : ObservableObject
    {
        private readonly IAuthService _auth;
        private readonly ISessionService _session;

        private string _username = "";
        public string Username
        {
            get { return _username; }
            set { SetProperty(ref _username, value); }
        }

        private string _error = "";
        public string Error
        {
            get { return _error; }
            set { SetProperty(ref _error, value); }
        }

        public ICommand LoginCommand { get; private set; }

        public LoginViewModel(IAuthService auth, ISessionService session)
        {
            _auth = auth;
            _session = session;
            LoginCommand = new RelayCommand<object>(Login);
        }

        private void Login(object passwordObj)
        {
            Error = "";
            if (_auth == null) { Error = "خدمة الدخول غير جاهزة بعد."; return; }
            try
            {
                var user = _auth.Login(Username, passwordObj != null ? passwordObj.ToString() : "");
                if (user == null) { Error = "بيانات الدخول غير صحيحة"; return; }
                _session.SignIn(user.Name, user.Role, user.BranchId);
                // TODO: session.SetPermissions(perms.GetRolePerms(user.Role)) +
                // SetModules(moduleState.Enabled) then navigate to Dashboard.
            }
            catch (System.Exception ex) { Error = ex.Message; }
        }
    }
}
