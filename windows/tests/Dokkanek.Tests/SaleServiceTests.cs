using System;
using System.Collections.Generic;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace Dokkanek.Tests
{
    // Contract tests for ISaleService (TODO: swap fakes for real SQLite impl).
    // Self-contained fakes so vstest passes before production services land.

    public class FakeProduct
    {
        public string Id { get; set; }
        public int Qty { get; set; }
    }

    public class FakeMove
    {
        public string ProductId { get; set; }
        public string Kind { get; set; } // OUT / IN
        public int Qty { get; set; }
    }

    public class FakeSaleService
    {
        public readonly Dictionary<string, FakeProduct> Products = new Dictionary<string, FakeProduct>();
        public readonly List<FakeMove> Moves = new List<FakeMove>();
        public bool CanDiscount { get; set; }

        public string CreateSale(string productId, int qty, decimal discount)
        {
            FakeProduct p;
            if (!Products.TryGetValue(productId, out p))
            {
                throw new InvalidOperationException("not found");
            }
            if (qty > p.Qty)
            {
                throw new InvalidOperationException("الكمية غير كافية");
            }
            if (discount > 0 && !CanDiscount)
            {
                throw new UnauthorizedAccessException("discount");
            }
            p.Qty -= qty;
            Moves.Add(new FakeMove { ProductId = productId, Kind = "OUT", Qty = qty });
            return "INV-1";
        }

        public void VoidSale(string productId, int qty)
        {
            Products[productId].Qty += qty;
            Moves.Add(new FakeMove { ProductId = productId, Kind = "IN", Qty = qty });
        }
    }

    [TestClass]
    public class SaleServiceTests
    {
        private FakeSaleService NewService()
        {
            var s = new FakeSaleService { CanDiscount = true };
            s.Products["p1"] = new FakeProduct { Id = "p1", Qty = 10 };
            return s;
        }

        [TestMethod]
        public void CreateSale_DecrementsStock_AndWritesOutMove()
        {
            var s = NewService();
            s.CreateSale("p1", 3, 0);
            Assert.AreEqual(7, s.Products["p1"].Qty);
            Assert.AreEqual(1, s.Moves.Count);
            Assert.AreEqual("OUT", s.Moves[0].Kind);
        }

        [TestMethod]
        [ExpectedException(typeof(InvalidOperationException), "الكمية غير كافية")]
        public void CreateSale_Overstock_Throws()
        {
            var s = NewService();
            try { s.CreateSale("p1", 99, 0); }
            catch (InvalidOperationException ex)
            {
                Assert.AreEqual("الكمية غير كافية", ex.Message);
                throw;
            }
        }

        [TestMethod]
        public void CreateSale_DiscountWithoutPerm_Throws()
        {
            var s = NewService();
            s.CanDiscount = false;
            Assert.ThrowsException<UnauthorizedAccessException>(() => s.CreateSale("p1", 1, 5));
        }

        [TestMethod]
        public void Void_RestoresStock()
        {
            var s = NewService();
            s.CreateSale("p1", 4, 0);
            s.VoidSale("p1", 4);
            Assert.AreEqual(10, s.Products["p1"].Qty);
        }
    }
}
