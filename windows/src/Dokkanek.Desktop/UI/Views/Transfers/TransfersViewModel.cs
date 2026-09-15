using System.Collections.ObjectModel;
using System.Windows.Input;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Dokkanek.Desktop.Services.Interfaces;

namespace Dokkanek.Desktop.UI.Views.Transfers
{{
    // TODO: swap to the dedicated domain service for this module.
    public class TransfersViewModel : ObservableObject
    {{
        private readonly IProductService _svc;
        private readonly ISessionService _session;

        private string _searchText;
        public string SearchText
        {{
            get {{ return _searchText; }}
            set {{ SetProperty(ref _searchText, value); }}
        }}

        private ObservableCollection<object> _items = new ObservableCollection<object>();
        public ObservableCollection<object> Items
        {{
            get {{ return _items; }}
            set {{ SetProperty(ref _items, value); }}
        }}

        public ICommand RefreshCommand {{ get; private set; }}

        public TransfersViewModel(IProductService svc, ISessionService session)
        {{
            _svc = svc;
            _session = session;
            RefreshCommand = new RelayCommand(Refresh);
        }}

        private void Refresh()
        {{
            var list = new ObservableCollection<object>();
            try
            {{
                var rows = _svc != null ? _svc.Search(SearchText ?? "", 50) : null;
                if (rows != null)
                {
                    foreach (var r in rows) { list.Add(new { Name = r.Name, Note = r.SalePrice.ToString() }); }
                }
            }}
            catch {{ }}
            Items = list;
        }}
    }}
}}
