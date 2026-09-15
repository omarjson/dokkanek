using System;
using System.Globalization;
using System.Threading;
using System.Windows;
using Dokkanek.Desktop.Services.Interfaces;
using Dokkanek.Desktop.UI;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Dokkanek.Desktop
{
    public partial class App : Application
    {
        private static Mutex _mutex;
        private IHost _host;

        public static IServiceProvider Services { get; private set; }

        protected override void OnStartup(StartupEventArgs e)
        {
            // Single-instance guard stub (TODO: focus existing window via named pipe).
            bool created;
            _mutex = new Mutex(true, "DokkanekDesktopSingleInstance", out created);
            if (!created)
            {
                MessageBox.Show("البرنامج يعمل بالفعل.", "دكّانك",
                    MessageBoxButton.OK, MessageBoxImage.Information);
                Shutdown();
                return;
            }

            var ci = new CultureInfo("ar-LY");
            Thread.CurrentThread.CurrentCulture = ci;
            Thread.CurrentThread.CurrentUICulture = ci;
            FrameworkElement.LanguageProperty.OverrideMetadata(
                typeof(FrameworkElement),
                new FrameworkPropertyMetadata(System.Windows.Markup.XmlLanguage.GetLanguage("ar-LY")));

            DispatcherUnhandledException += OnUnhandled;

            _host = Host.CreateDefaultBuilder()
                .ConfigureServices(ConfigureServices)
                .Build();
            Services = _host.Services;

            ApplyBrandColor();
            base.OnStartup(e);
        }

        private static T Back<T>(IServiceProvider sp) where T : class
        {
            // Backend services are composed by the backend module;
            // null until wired — ViewModels must null-check (TODO).
            return (T)sp.GetService(typeof(T));
        }

        private void ConfigureServices(HostBuilderContext ctx, IServiceCollection s)
        {
            // UI-owned adapters. Backend (repos + domain services) is
            // composed in Data/Services by the backend module (TODO: wire
            // ISettingsStore/IAuditRepository/... + services here).
            s.AddSingleton<ISessionService, SessionService>();
            s.AddSingleton<ISyncService, StubSyncService>();
            s.AddTransient<MainWindowViewModel>();
            s.AddTransient<UI.Views.Dashboard.DashboardViewModel>(sp =>
                new UI.Views.Dashboard.DashboardViewModel(Back<ISaleService>(sp), sp.GetRequiredService<ISessionService>()));
            s.AddTransient<UI.Views.Pos.PosViewModel>(sp =>
                new UI.Views.Pos.PosViewModel(
                    Back<ISaleService>(sp), Back<IProductService>(sp), Back<IAuthService>(sp),
                    Back<IPermissionService>(sp), sp.GetRequiredService<ISessionService>(), sp.GetRequiredService<ISyncService>()));
            s.AddTransient<UI.Views.Sales.SalesViewModel>(sp =>
                new UI.Views.Sales.SalesViewModel(Back<ISaleService>(sp), sp.GetRequiredService<ISessionService>()));
            s.AddTransient<UI.Views.Customers.CustomersViewModel>(sp =>
                new UI.Views.Customers.CustomersViewModel(Back<ISaleService>(sp), sp.GetRequiredService<ISessionService>()));
            s.AddTransient<UI.Views.Products.ProductsViewModel>(sp =>
                new UI.Views.Products.ProductsViewModel(Back<ISaleService>(sp), sp.GetRequiredService<ISessionService>()));
            s.AddTransient<UI.Views.Settings.SettingsViewModel>(sp =>
                new UI.Views.Settings.SettingsViewModel(Back<ISettingsService>(sp), Back<IAuthService>(sp), sp.GetRequiredService<ISessionService>()));
            s.AddTransient<UI.Views.Login.LoginViewModel>(sp =>
                new UI.Views.Login.LoginViewModel(Back<IAuthService>(sp), sp.GetRequiredService<ISessionService>()));
            s.AddTransient<UI.Views.Setup.SetupViewModel>(sp =>
                new UI.Views.Setup.SetupViewModel(Back<ISettingsService>(sp), Back<IBackupService>(sp)));
            s.AddTransient<UI.Views.Terms.TermsViewModel>(sp =>
                new UI.Views.Terms.TermsViewModel(Back<ISettingsService>(sp), Back<IAuditService>(sp)));
            s.AddTransient<UI.Views.Privacy.PrivacyViewModel>(sp =>
                new UI.Views.Privacy.PrivacyViewModel(Back<ISettingsService>(sp), Back<IAuditService>(sp)));
        }

        private void ApplyBrandColor()
        {
            try
            {
                var settings = (ISettingsService)Services.GetService(typeof(ISettingsService));
                string hex = settings != null ? settings.Get("primary_color", "#0d6efd") : "#0d6efd";
                var brush = new System.Windows.Media.SolidColorBrush(
                    (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString(hex));
                Resources["BrandBrush"] = brush;
            }
            catch { /* keep Theme.xaml default; backend not wired yet */ }
        }

        private void OnUnhandled(object sender, System.Windows.Threading.DispatcherUnhandledExceptionEventArgs e)
        {
            try
            {
                var audit = Services != null
                    ? (IAuditService)Services.GetService(typeof(IAuditService)) : null;
                if (audit != null)
                {
                    audit.Log("APP_CRASH", "App", "", e.Exception != null ? e.Exception.Message : "unknown", "", null);
                }
            }
            catch { }
            MessageBox.Show("حدث خطأ غير متوقع. تم تسجيله في سجل الأمن.\n" + e.Exception.Message,
                "دكّانك — خطأ", MessageBoxButton.OK, MessageBoxImage.Error);
            e.Handled = true;
        }
    }
}
