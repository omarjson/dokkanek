namespace Dokkanek.Desktop.Domain
{
    /// <summary>User roles. Mirrors the role strings used in prisma/schema.prisma and lib/permissions.ts.</summary>
    public static class Roles
    {
        public const string Admin = "ADMIN";
        public const string Manager = "MANAGER";
        public const string Cashier = "CASHIER";
        public const string Courier = "COURIER";
        public const string Technician = "TECHNICIAN";

        public static readonly string[] All = new string[]
        {
            Admin,
            Manager,
            Cashier,
            Courier,
            Technician
        };
    }

    /// <summary>Sale lifecycle statuses.</summary>
    public static class SaleStatuses
    {
        public const string Completed = "COMPLETED";
        public const string Pending = "PENDING";
        public const string Held = "HELD";
        public const string Courier = "COURIER";
        public const string Cancelled = "CANCELLED";

        public static readonly string[] All = new string[]
        {
            Completed,
            Pending,
            Held,
            Courier,
            Cancelled
        };
    }

    /// <summary>Payment methods. Mirrors Sale.payMethod and Payment.method in prisma/schema.prisma.</summary>
    public static class PayMethods
    {
        public const string Cash = "CASH";
        public const string Card = "CARD";
        public const string Transfer = "TRANSFER";
        public const string Credit = "CREDIT";

        public static readonly string[] All = new string[]
        {
            Cash,
            Card,
            Transfer,
            Credit
        };
    }

    /// <summary>
    /// Fine-grained permission keys. Mirrors PERMISSIONS in lib/permissions.ts (14 keys).
    /// </summary>
    public static class Permissions
    {
        public const string CostView = "cost.view";
        public const string PriceEdit = "price.edit";
        public const string PriceUsd = "price.usd";
        public const string ProductsDelete = "products.delete";
        public const string SalesDiscount = "sales.discount";
        public const string SalesVoid = "sales.void";
        public const string PurchasesManage = "purchases.manage";
        public const string ExpensesView = "expenses.view";
        public const string ReportsProfit = "reports.profit";
        public const string HrView = "hr.view";
        public const string HrAdvance = "hr.advance";
        public const string StocktakeAdjust = "stocktake.adjust";
        public const string UsersManage = "users.manage";
        public const string SettingsEdit = "settings.edit";

        public static readonly string[] All = new string[]
        {
            CostView,
            PriceEdit,
            PriceUsd,
            ProductsDelete,
            SalesDiscount,
            SalesVoid,
            PurchasesManage,
            ExpensesView,
            ReportsProfit,
            HrView,
            HrAdvance,
            StocktakeAdjust,
            UsersManage,
            SettingsEdit
        };
    }

    /// <summary>
    /// Store modules that can be enabled/disabled. Mirrors MODULES in lib/modules.ts (13 keys).
    /// </summary>
    public static class Modules
    {
        public const string Maintenance = "maintenance";
        public const string Delivery = "delivery";
        public const string Suppliers = "suppliers";
        public const string Employees = "employees";
        public const string Expenses = "expenses";
        public const string Returns = "returns";
        public const string Shifts = "shifts";
        public const string Reports = "reports";
        public const string Developers = "developers";
        public const string Notifications = "notifications";
        public const string Import = "import";
        public const string Stocktake = "stocktake";
        public const string Transfers = "transfers";

        public static readonly string[] All = new string[]
        {
            Maintenance,
            Delivery,
            Suppliers,
            Employees,
            Expenses,
            Returns,
            Shifts,
            Reports,
            Developers,
            Notifications,
            Import,
            Stocktake,
            Transfers
        };
    }

    /// <summary>Default permissions per role. Mirrors ROLE_DEFAULTS in lib/permissions.ts.</summary>
    public static class RoleDefaults
    {
        public static readonly string[] Admin = new string[] { "*" };

        public static readonly string[] Manager = new string[]
        {
            Permissions.PriceEdit,
            Permissions.SalesDiscount,
            Permissions.PurchasesManage,
            Permissions.ExpensesView,
            Permissions.ReportsProfit,
            Permissions.StocktakeAdjust
        };

        public static readonly string[] Cashier = new string[0];

        public static readonly string[] Courier = new string[0];

        public static readonly string[] Technician = new string[0];
    }

    /// <summary>Module presets per store type. Only the listed keys are OFF; the rest stay on. Mirrors PRESETS in lib/modules.ts.</summary>
    public static class ModulePresets
    {
        public static readonly string[] GeneralOff = new string[0];

        public static readonly string[] PhonesOff = new string[0];

        public static readonly string[] GroceryOff = new string[]
        {
            Modules.Maintenance,
            Modules.Developers
        };

        public static readonly string[] ClothingOff = new string[]
        {
            Modules.Maintenance
        };
    }
}
