"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, PageTitle, inputCls, btnCls, btnGhostCls } from "@/components/ui";
import { lyd, PAY_METHODS } from "@/lib/format";

type P = { id: string; name: string; salePrice: number; quantity: number; sku: string; barcode: string };
type CartItem = { id: string; name: string; price: number; qty: number; max: number };

export function POSClient({ products, customers }: { products: P[]; customers: { id: string; name: string }[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payMethod, setPayMethod] = useState("CASH");
  const [status, setStatus] = useState("COMPLETED");
  const [customerId, setCustomerId] = useState("");
  const [discount, setDiscount] = useState("0");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<{ no: string; id: string } | null>(null);
  // طابور الأوفلاين: فواتير محفوظة في المتصفح تُزامَن عند عودة النت
  const [outbox, setOutbox] = useState<unknown[]>([]);
  useEffect(() => {
    try {
      const raw = typeof window === "undefined" ? null : localStorage.getItem("dk_outbox");
      if (raw) setOutbox(JSON.parse(raw));
    } catch {}
  }, []);
  function saveOutbox(list: unknown[]) {
    setOutbox(list);
    try {
      localStorage.setItem("dk_outbox", JSON.stringify(list));
    } catch {}
  }
  async function syncOutbox() {
    const failed: unknown[] = [];
    let okCount = 0;
    for (const payload of outbox) {
      try {
        const res = await fetch("/api/sales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) okCount++;
        else failed.push(payload);
      } catch {
        failed.push(payload);
      }
    }
    saveOutbox(failed);
    router.refresh();
    alert(failed.length === 0 ? `تمت مزامنة ${okCount} فاتورة بنجاح` : `زُامن ${okCount} — تعذر ${failed.length}`);
  }

  const list = q
    ? products.filter((p) => p.name.includes(q) || p.sku.includes(q) || (p.barcode || "").includes(q)).slice(0, 30)
    : products.slice(0, 30);

  function add(p: P) {
    setCart((c) => {
      const f = c.find((x) => x.id === p.id);
      if (f) {
        if (f.qty + 1 > p.quantity) { alert(`المتاح فقط ${p.quantity}`); return c; }
        return c.map((x) => (x.id === p.id ? { ...x, qty: x.qty + 1 } : x));
      }
      if (p.quantity < 1) { alert("نفدت الكمية"); return c; }
      return [...c, { id: p.id, name: p.name, price: p.salePrice, qty: 1, max: p.quantity }];
    });
  }

  const subtotal = cart.reduce((s, x) => s + x.price * x.qty, 0);
  const total = Math.max(0, subtotal - Number(discount || 0));

  async function checkout() {
    if (cart.length === 0) return;
    setLoading(true);
    const payload = {
      items: cart.map((x) => ({ productId: x.id, qty: x.qty, price: x.price })),
      payMethod, status,
      customerId: customerId || null,
      discount: Number(discount || 0),
    };
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setDone({ no: j.no, id: j.id });
        setCart([]);
        setDiscount("0");
        router.refresh();
      } else {
        alert(j.error || "تعذر إتمام البيع");
      }
    } catch {
      // بلا نت: حفظ محلي للمزامنة لاحقا
      saveOutbox([...outbox, payload]);
      setCart([]);
      setDiscount("0");
      alert("لا يوجد اتصال — حُفظت الفاتورة في قائمة الانتظار وستُرسل عند عودة النت");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageTitle title="نقطة البيع" sub="نقدي • بطاقة • آجل • توصيل • انتظار" />
      {outbox.length > 0 && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-bold text-amber-700">⚠ {outbox.length} فاتورة محفوظة بدون نت — بانتظار المزامنة</p>
            <button className={btnCls} onClick={syncOutbox}>مزامنة الآن</button>
          </div>
        </Card>
      )}
      {done && (
        <Card>
          <p className="font-bold text-green-700">تم حفظ الفاتورة {done.no} بنجاح</p>
          <div className="flex gap-2 mt-2">
            <a href={`/sales/${done.id}`} className={btnCls}>فتح الفاتورة / طباعة</a>
            <button className={btnGhostCls} onClick={() => setDone(null)}>بيع جديد</button>
          </div>
        </Card>
      )}
      <div className="grid md:grid-cols-2 gap-3">
        <Card>
          <input className={inputCls} placeholder="بحث: اسم / SKU / باركود" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="mt-2 max-h-[420px] overflow-auto divide-y">
            {list.map((p) => (
              <button key={p.id} onClick={() => add(p)} className="w-full text-right py-2 hover:bg-gray-50 flex justify-between gap-2">
                <span>{p.name}<span className="text-xs text-gray-400 block">{p.sku} • متاح {p.quantity}</span></span>
                <b>{lyd(p.salePrice)}</b>
              </button>
            ))}
            {list.length === 0 && <p className="text-gray-400 text-sm py-4 text-center">لا نتائج</p>}
          </div>
        </Card>
        <Card>
          <h2 className="font-bold mb-2">السلة ({cart.length})</h2>
          {cart.length === 0 && <p className="text-gray-400 text-sm">السلة فارغة — اضغط على صنف لإضافته</p>}
          {cart.map((x) => (
            <div key={x.id} className="flex items-center gap-2 border-t py-2 text-sm">
              <span className="flex-1">{x.name}</span>
              <input
                type="number" min="1" max={x.max} value={x.qty}
                onChange={(e) => setCart((c) => c.map((y) => (y.id === x.id ? { ...y, qty: Math.max(1, Math.min(x.max, Number(e.target.value || 1))) } : y)))}
                className="w-16 border rounded px-1 py-1"
              />
              <b>{lyd(x.price * x.qty)}</b>
              <button className="text-red-500" onClick={() => setCart((c) => c.filter((y) => y.id !== x.id))}>✕</button>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <label className="text-sm">الزبون (اختياري)
              <select className={inputCls} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">بدون زبون</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="text-sm">طريقة الدفع
              <select className={inputCls} value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                {Object.entries(PAY_METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label className="text-sm">نوع الفاتورة
              <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="COMPLETED">بيع فوري</option>
                <option value="PENDING">انتظار</option>
                <option value="HELD">معلقة</option>
                <option value="COURIER">توصيل (بحوزة مندوب)</option>
              </select>
            </label>
            <label className="text-sm">خصم
              <input type="number" min="0" className={inputCls} value={discount} onChange={(e) => setDiscount(e.target.value)} />
            </label>
          </div>
          <div className="flex justify-between items-center mt-3 font-bold text-lg">
            <span>الإجمالي: {lyd(total)}</span>
            <button className={btnCls} disabled={loading || cart.length === 0} onClick={checkout}>
              {loading ? "جاري الحفظ..." : "إتمام البيع"}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
