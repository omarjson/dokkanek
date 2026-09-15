using System;
using System.Windows;
using Dokkanek.Desktop.Services.Interfaces;
using Microsoft.Extensions.DependencyInjection;

namespace Dokkanek.Desktop.UI
{
    public partial class MainWindow : Window
    {
        public MainWindow()
        {
            InitializeComponent();
            // Resolve VM via DI when available; fallback to a default
            // session so the shell renders before backend wiring lands.
            try
            {
                if (App.Services != null)
                {
                    var vm = App.Services.GetService<MainWindowViewModel>();
                    if (vm != null) { DataContext = vm; return; }
                }
            }
            catch { }
            DataContext = new MainWindowViewModel(new SessionService());
        }
    }
}
