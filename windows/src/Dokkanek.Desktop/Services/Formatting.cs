using System;
using System.Collections.Generic;
using System.Globalization;
using Dokkanek.Desktop.Services.Interfaces;

namespace Dokkanek.Desktop.Services
{
    // يقابل lib/format.ts: د.ل، تاريخ عربي ليبي بأرقام لاتينية، وقواميس الحالات.
    public class Formatting : IFormatting
    {
        private static readonly IDictionary<string, string> Roles = new Dictionary<string, string>
        {
            { "ADMIN", "مدير النظام" }, { "MANAGER", "مدير فرع" }, { "CASHIER", "كاشير" },
            { "COURIER", "مندوب توصيل" }, { "TECHNICIAN", "فني صيانة" },
        };

        private static readonly IDictionary<string, string> SaleStatus = new Dictionary<string, string>
        {
            { "COMPLETED", "مكتملة" }, { "PENDING", "انتظار" }, { "HELD", "معلقة" },
            { "COURIER", "بحوزة مندوب" }, { "RETURNED", "مرتجعة" }, { "CANCELLED", "ملغاة" },
        };

        private static readonly IDictionary<string, string> PayMethods = new Dictionary<string, string>
        {
            { "CASH", "نقدي" }, { "CARD", "بطاقة" }, { "TRANSFER", "تحويل" }, { "CREDIT", "آجل" },
        };

        private static readonly IDictionary<string, string> TicketStatus = new Dictionary<string, string>
        {
            { "RECEIVED", "مستلم" }, { "DIAGNOSIS", "قيد الفحص" }, { "WAITING_PARTS", "بانتظار قطعة" },
            { "READY", "جاهز" }, { "DELIVERED", "تم التسليم" },
        };

        private static readonly IDictionary<string, string> TaskStatus = new Dictionary<string, string>
        {
            { "PENDING", "بانتظار المندوب" }, { "WITH_COURIER", "بحوزة المندوب" },
            { "DELIVERED", "تم التسليم" }, { "FAILED", "تعذر التسليم" },
        };

        public string Lyd(double? value) { return string.Format("{0:F2} د.ل", value ?? 0); }

        public string FmtDate(DateTime? value)
        {
            if (!value.HasValue) return "—";
            try
            {
                var c = (CultureInfo)CultureInfo.GetCultureInfo("ar-LY").Clone();
                c.NumberFormat.DigitSubstitution = DigitShapes.None;
                return ToLatinDigits(value.Value.ToString("g", c));
            }
            catch { }
            try
            {
                var c2 = (CultureInfo)CultureInfo.GetCultureInfo("ar").Clone();
                c2.NumberFormat.DigitSubstitution = DigitShapes.None;
                return ToLatinDigits(value.Value.ToString("g", c2));
            }
            catch { return value.Value.ToString(); }
        }

        private static string ToLatinDigits(string s)
        {
            if (string.IsNullOrEmpty(s)) return s;
            char[] ar = { '٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩' };
            for (int i = 0; i < ar.Length; i++) s = s.Replace(ar[i], (char)('0' + i));
            return s;
        }

        private static string Ar(IDictionary<string, string> d, string k, string fb)
        {
            string v;
            return d.TryGetValue(k ?? "", out v) ? v : fb;
        }

        public string SaleStatusAr(string status) { return Ar(SaleStatus, status, status ?? ""); }
        public string PayMethodAr(string method) { return Ar(PayMethods, method, method ?? ""); }
        public string TicketStatusAr(string status) { return Ar(TicketStatus, status, status ?? ""); }
        public string TaskStatusAr(string status) { return Ar(TaskStatus, status, status ?? ""); }
        public string RoleAr(string role) { return Ar(Roles, role, role ?? ""); }
        public IDictionary<string, string> SaleStatuses { get { return SaleStatus; } }
        public IDictionary<string, string> PayMethods { get { return PayMethods; } }
    }
}
