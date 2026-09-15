using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Windows.Input;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Dokkanek.Desktop.Services.Interfaces;

namespace Dokkanek.Desktop.UI.Views.Pos
{
    public class PosItem
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public decimal Price { get; set; }
        public int Qty { get; set; }
        public int Max { get; set; }
    }

    public class PosViewModel : ObservableObject
    {
        private readonly ISaleService _sales;
        private readonly IProductService _products;
        private readonly IAuthService _auth;
        private readonly IPermissionService _perms;
        private readonly ISessionService _session;

        private string _searchText = "";
        public string SearchText
        {
            get { return _searchText; }
            set { SetProperty(ref _searchText, value); Search(); }
        }

        public ObservableCollection<object> Categories { get; private set; }
        public ObservableCollection<PosItem> Products { get; private set; }
        public ObservableCollection<PosItem> Cart { get; private set; }

        private string _discount = "0";
        public string Discount
        {
            get { return _discount; }
            set { SetProperty(ref _discount, value); UpdateTotal(); }
        }

        public bool CanDiscount { get; private set; }
        public IList<KeyValuePair<string, string>> PayMethods { get; private set; }
        public IList<KeyValuePair<string, string>> InvoiceTypes { get; private set; }

        private KeyValuePair<string, string> _pay;
        public KeyValuePair<string, string> SelectedPayMethod
        {
            get { return _pay; }
            set { SetProperty(ref _pay, value); }
        }

        private KeyValuePair<string, string> _inv;
        public KeyValuePair<string, string> SelectedInvoiceType
        {
            get { return _inv; }
            set { SetProperty(ref _inv, value); }
        }

        private string _payRef = "";
        public string PayRef
        {
            get { return _payRef; }
            set { SetProperty(ref _payRef, value); }
        }

        private decimal _total;
        public decimal Total
        {
            get { return _total; }
            set { SetProperty(ref _total, value); }
        }

        private int _outboxCount;
        public int OutboxCount
        {
            get { return _outboxCount; }
            set { SetProperty(ref _outboxCount, value); SetProperty(ref _showBanner, value > 0, "ShowOutboxBanner"); }
        }

        private bool _showBanner;
        public bool ShowOutboxBanner
        {
            get { return _showBanner; }
            set { SetProperty(ref _showBanner, value); }
        }

        public ICommand AddCommand { get; private set; }
        public ICommand CheckoutCommand { get; private set; }
        public ICommand SyncCommand { get; private set; }

        public PosViewModel(ISaleService sales, IProductService products, IAuthService auth,
            IPermissionService perms, ISessionService session, ISyncService sync)
        {
            _sales = sales;
            _products = products;
            _auth = auth;
            _perms = perms;
            _session = session;
            Categories = new ObservableCollection<object>();
            Products = new ObservableCollection<PosItem>();
            Cart = new ObservableCollection<PosItem>();
            string role = auth != null && auth.CurrentUser != null ? auth.CurrentUser.Role
                : (session != null && session.Current != null ? session.Current.Role : "");
            CanDiscount = perms != null && perms.HasPerm(role, "sales.discount");
            PayMethods = new List<KeyValuePair<string, string>> {
                new KeyValuePair<string, string>("CASH", "نقدي"),
                new KeyValuePair<string, string>("CARD", "بطاقة"),
                new KeyValuePair<string, string>("TRANSFER", "تحويل"),
                new KeyValuePair<string, string>("CREDIT", "آجل")
            };
            InvoiceTypes = new List<KeyValuePair<string, string>> {
                new KeyValuePair<string, string>("COMPLETED", "مكتملة"),
                new KeyValuePair<string, string>("PENDING", "انتظار"),
                new KeyValuePair<string, string>("HELD", "معلقة")
            };
            _pay = PayMethods[0];
            _inv = InvoiceTypes[0];
            OutboxCount = sync != null ? sync.OutboxCount : 0;
            AddCommand = new RelayCommand<PosItem>(Add);
            CheckoutCommand = new RelayCommand(Checkout);
            SyncCommand = new RelayCommand(Sync);
            Search();
        }

        private void Search()
        {
            Products.Clear();
            if (_products == null) { return; }
            try
            {
                var rows = _products.Search(_searchText ?? "", 40);
                if (rows == null) { return; }
                foreach (var r in rows)
                {
                    Products.Add(new PosItem
                    {
                        Id = r.Id, Name = r.Name,
                        Price = (decimal)r.SalePrice, Qty = 1, Max = (int)r.Quantity
                    });
                }
            }
            catch { }
        }

        private void Add(PosItem p)
        {
            if (p == null) { return; }
            foreach (var c in Cart)
            {
                if (c.Id == p.Id)
                {
                    if (c.Qty + 1 > p.Max) { return; }
                    c.Qty++;
                    UpdateTotal();
                    return;
                }
            }
            if (p.Max < 1) { return; }
            Cart.Add(new PosItem { Id = p.Id, Name = p.Name, Price = p.Price, Qty = 1, Max = p.Max });
            UpdateTotal();
        }

        private void UpdateTotal()
        {
            decimal sub = 0;
            foreach (var i in Cart) { sub += i.Price * i.Qty; }
            decimal d = 0;
            decimal.TryParse(Discount, out d);
            Total = sub - d < 0 ? 0 : sub - d;
        }

        private ActorContext Actor()
        {
            var u = _auth != null ? _auth.CurrentUser : null;
            if (u == null && _session != null) { return _session.Actor; }
            if (u == null) { return new ActorContext(); }
            return new ActorContext { Id = u.Id, Name = u.Name, Role = u.Role, BranchId = u.BranchId };
        }

        private void Checkout()
        {
            if (_sales == null || Cart.Count == 0) { return; }
            var req = new SaleRequest();
            req.Status = _inv.Key;
            req.PayMethod = _pay.Key;
            double d = 0;
            double.TryParse(Discount, out d);
            req.Discount = d;
            req.PayRef = _payRef ?? "";
            foreach (var c in Cart)
            {
                req.Items.Add(new SaleItemInput { ProductId = c.Id, Qty = c.Qty, Price = (double)c.Price });
            }
            _sales.CreateSale(req, Actor());
            Cart.Clear();
            UpdateTotal();
            Search();
        }

        private void Sync()
        {
            // TODO: flush PendingSale outbox via backend, then refresh OutboxCount.
        }
    }
}
