using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using Dokkanek.Desktop.Services.Interfaces;

namespace Dokkanek.Desktop.Services
{
    // نص إيصال 42 عمودا للطابعات الحرارية. الطباعة الفعلية (PrintDocument/ESC/POS) تُربط لاحقا.
    public class PrintService : IPrintService
    {
        private const int Width = 42;

        public string BuildReceipt(string saleNo, string saleDate, IList<ReceiptLine> lines,
            double subtotal, double discount, double total, double paid,
            string storeName, string payMethodAr, string footer)
        {
            var sb = new StringBuilder();
            sb.AppendLine(Center(storeName ?? "دكّانك"));
            sb.AppendLine(Center("فاتورة " + (saleNo ?? "")));
            sb.AppendLine(Center(saleDate ?? ""));
            sb.AppendLine(new string('-', Width));
            if (lines != null)
                foreach (var l in lines)
                    sb.AppendLine(Row(l.Name, l.Qty, l.Price));
            sb.AppendLine(new string('-', Width));
            sb.AppendLine(Kv("المجموع", subtotal));
            if (discount > 0) sb.AppendLine(Kv("الخصم", -discount));
            sb.AppendLine(Kv("الإجمالي", total));
            sb.AppendLine(Kv("المدفوع", paid));
            sb.AppendLine(Kv("المتبقي", Math.Max(0, total - paid)));
            sb.AppendLine("الدفع: " + (payMethodAr ?? ""));
            sb.AppendLine(new string('-', Width));
            if (!string.IsNullOrEmpty(footer)) sb.AppendLine(Center(footer));
            sb.AppendLine(Center("شكرا لكم"));
            return sb.ToString();
        }

        // stub: يحفظ معاينة نصية ويعيد مسارها. اربط PrintDocument هنا لاحقا.
        public string PrintText(string text, string printerName)
        {
            string dir = Path.Combine(Path.GetTempPath(), "Dokkanek", "PrintPreview");
            Directory.CreateDirectory(dir);
            string path = Path.Combine(dir, "receipt-" + DateTime.Now.ToString("yyyyMMdd-HHmmss") + ".txt");
            File.WriteAllText(path, text ?? "", Encoding.UTF8);
            // TODO(thermal): new PrintDocument { PrinterSettings = { PrinterName = printerName } }
            // مع ESC/POS (قص + درج) عند توفر تعريف الطابعة.
            return path;
        }

        private static string Kv(string k, double v) { return k + ": " + v.ToString("F2"); }

        private static string Row(string name, double qty, double price)
        {
            string right = qty + "x" + price.ToString("F2");
            string left = name ?? "";
            int pad = Math.Max(1, Width - right.Length - PrintableLen(left));
            return left + new string(' ', pad) + right;
        }

        private static string Center(string s)
        {
            s = s ?? "";
            int pad = Math.Max(0, (Width - PrintableLen(s)) / 2);
            return new string(' ', pad) + s;
        }

        private static int PrintableLen(string s) { return s == null ? 0 : s.Length; }
    }
}
