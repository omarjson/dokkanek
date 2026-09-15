using System.Collections.Generic;

namespace Dokkanek.Desktop.Services.Interfaces
{
    // سياق الفاعل — يقابل me في lib/*.ts (الدور والفرع من الجلسة).
    public class ActorContext
    {
        public string Id { get; set; } public string Name { get; set; }
        public string BranchId { get; set; } public string Role { get; set; }
        public ActorContext() { Id = ""; Name = ""; Role = ""; }
    }

    public class SaleItemInput
    {
        public string ProductId { get; set; } public double Qty { get; set; } public double Price { get; set; }
        public SaleItemInput() { ProductId = ""; }
    }

    public class SaleRequest
    {
        public IList<SaleItemInput> Items { get; set; }
        public string Status { get; set; } public string PayMethod { get; set; }
        public double Discount { get; set; } public string CustomerId { get; set; }
        public string CourierName { get; set; } public string PayRef { get; set; }
        public SaleRequest()
        {
            Items = new List<SaleItemInput>();
            Status = "COMPLETED"; PayMethod = "CASH"; PayRef = "";
        }
    }

    public class SaleResult
    {
        public string Id { get; set; } public string No { get; set; } public double Total { get; set; }
        public SaleResult() { Id = ""; No = ""; }
    }

    public class PurchaseItemInput
    {
        public string ProductId { get; set; } public double Qty { get; set; } public double Price { get; set; }
        public PurchaseItemInput() { ProductId = ""; }
    }

    public static class DocNo
    {
        // يقابل Date.now().toString(36).toUpperCase() في الويب.
        public static string Base36Now()
        {
            long ms = (long)(System.DateTime.UtcNow - new System.DateTime(1970, 1, 1)).TotalMilliseconds;
            const string digits = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            if (ms == 0) return "0";
            string s = "";
            while (ms > 0) { s = digits[(int)(ms % 36)] + s; ms /= 36; }
            return s;
        }
    }
}
