using System.Windows.Controls;
using Dokkanek.Desktop.Services.Interfaces;

namespace Dokkanek.Desktop.UI.Navigation
{
    // Navigation guard: redirect to Login when no session.
    public static class RequireAuth
    {
        public static bool Check(ISessionService session)
        {
            return session != null && session.IsAuthenticated;
        }

        public static bool Ensure(Frame frame, ISessionService session)
        {
            if (Check(session))
            {
                return true;
            }
            if (frame != null)
            {
                frame.Navigate(new Views.Login.LoginView());
            }
            return false;
        }

        public static bool CanView(ISessionService s, string perm, string mod, string[] roles)
        {
            if (s == null || !s.IsAuthenticated)
            {
                return false;
            }
            if (roles != null && roles.Length > 0 && !s.HasRole(roles))
            {
                return false;
            }
            if (!string.IsNullOrEmpty(perm) && !s.HasPerm(perm) && !s.HasPerm("*"))
            {
                return false;
            }
            if (!string.IsNullOrEmpty(mod) && !s.IsModuleEnabled(mod))
            {
                return false;
            }
            return true;
        }
    }
}
