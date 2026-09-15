using System.Collections.Generic;

namespace Dokkanek.Desktop.Services.Interfaces
{
    public class ReceiptLine
    {
        public string Name { get; set; } public double Qty { get; set; } public double Price { get; set; }
        public ReceiptLine() { Name = ""; }
    }

    public interface IPrintService
    {
        string BuildReceipt(string saleNo, string saleDate, IList<ReceiptLine> lines,
            double subtotal, double discount, double total, double paid,
            string storeName, string payMethodAr, string footer);
        // stub حراري — يحفظ معاينة نصية؛ تُربط ESC/POS لاحقا.
        string PrintText(string text, string printerName);
    }
}
