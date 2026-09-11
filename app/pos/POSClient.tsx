"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, PageTitle, inputCls, btnCls, btnGhostCls, chipCls, chipActiveCls, Badge } from "@/components/ui";
import { toast } from "@/components/toast";
import { IconStar, IconSearch, IconBell, IconX, IconCheck } from "@/components/icons";
import { lyd, PAY_METHODS } from "@/lib/format";

type P = { id: string; name: string; salePrice: number; quantity: number; sku: string; barcode: string; isFavorite: boolean; categoryId: string | null; categoryName: string | null };
type CartItem = { id: string; name: string; price: number; qty: number; max: number };

export function POSClient({ products, customers, categories }: { products: P[]; customers: { id: string; name: string }[]; categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
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
    if (failed.length === 0) toast(`تمت مزامنة ${okCount} فاتورة بنجاح`, "success");
    else toast(`زُامن ${okCount} — تعذر ${failed.length}`, "error");
  }

  const list = products
    .filter((p) => !cat || p.categoryId === cat)
    .filter((p) => !q || p.name.includes(q) || p.sku.includes(q) || (p.barcode || "").includes(q))
    .slice(0, 40);

  function add(p: P) {
    setCart((c) => {
      const f = c.find((x) => x.id === p.id);
      if (f) {
        if (f.qty + 1 > p.quantity) { toast(`المتاح فقط ${p.quantity}`, "error"); return c; }
        return c.map((x) => (x.id === p.id ? { ...x, qty: x.qty + 1 } : x));
      }
      if (p.quantity < 1) { toast("نفدت الكمية", "error"); return c; }
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
        toast(`تم حفظ الفاتورة ${j.no}`, "success");
        router.refresh();
      } else {
        toast(j.error || "تعذر إتمام البيع", "error");
      }
    } catch {
      // بلا نت: حفظ محلي للمزامنة لاحقا
      saveOutbox([...outbox, payload]);
      setCart([]);
      setDiscount("0");
      toast("لا يوجد اتصال — حُفظت في قائمة الانتظار", "info");
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
            <p className="font-bold text-amber-700 flex items-center gap-2"><Badge tone="amber">بلا نت</Badge> {outbox.length} فاتورة محفوظة — بانتظار المزامنة</p>
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
      <div className="grid lg:grid-cols-5 gap-4 items-start">
        <div className="lg:col-span-3 min-w-0">
        <Card>
          <div className="relative mb-2">
            <span className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400"><IconSearch /></span>
            <input className={inputCls + " !ps-10"} placeholder="بحث: اسم / SKU / باركود" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {categories.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-1">
              <button onClick={() => setCat("")} className={cat === "" ? chipActiveCls : chipCls}>الكل</button>
              {categories.map((c) => (
                <button key={c.id} onClick={() => setCat(cat === c.id ? "" : c.id)} className={(cat === c.id ? chipActiveCls : chipCls) + " whitespace-nowrap"}>
                  {c.name}
                </button>
              ))}
            </div>
          )}
          <div dir="ltr" className="mt-1 max-h-[440px] overflow-auto">
          <div dir="rtl" className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {list.map((p) => (
              <button
                key={p.id}
                onClick={() => add(p)}
                disabled={p.quantity < 1}
                className="text-start rounded-2xl border border-slate-200 bg-slate-50/60 hover:border-[var(--brand)] hover:bg-white hover:shadow-md active:scale-[0.98] transition p-3 flex justify-between gap-2 disabled:opacity-50"
              >
                <span className="min-w-0">
                  <span className="font-bold text-sm flex items-center gap-1">
                    {p.isFavorite && <span className="text-amber-500"><IconStar width={14} height={14} /></span>}
                    <span className="truncate">{p.name}</span>
                  </span>
                  <span className="text-xs text-slate-400 block mt-0.5">{p.sku} • متاح {p.quantity}</span>
                </span>
                <span className="text-end shrink-0">
                  <b className="block">{lyd(p.salePrice)}</b>
                  {p.quantity <= 0 ? <Badge tone="red">نافد</Badge> : p.quantity <= 5 ? <Badge tone="amber">أخير</Badge> : null}
                </span>
              </button>
            ))}
            {list.length === 0 && <p className="text-slate-400 text-sm py-4 text-center col-span-full">لا نتائج مطابقة</p>}
          </div>
          </div>
        </Card>
        </div>
        <div className="lg:col-span-2 lg:sticky lg:top-4 min-w-0">
        <Card>
          <h2 className="font-bold mb-2">السلة ({cart.length})</h2>
          {cart.length === 0 && <p className="text-slate-400 text-sm">السلة فارغة — اضغط على صنف لإضافته</p>}
          {cart.map((x) => (
            <div key={x.id} className="flex items-center gap-2 border-t border-slate-100 py-2 text-sm">
              <span className="flex-1 min-w-0 truncate">{x.name}</span>
              <input
                type="number" min="1" max={x.max} value={x.qty}
                onChange={(e) => setCart((c) => c.map((y) => (y.id === x.id ? { ...y, qty: Math.max(1, Math.min(x.max, Number(e.target.value || 1))) } : y)))}
                className="w-16 border rounded px-1 py-1"
              />
              <b>{lyd(x.price * x.qty)}</b>
              <button aria-label="إزالة من السلة" className="text-rose-500 hover:bg-rose-50 rounded-lg p-2 -m-1 min-w-[40px] min-h-[40px] flex items-center justify-center" onClick={() => setCart((c) => c.filter((y) => y.id !== x.id))}><IconX /></button>
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
          <div className="flex justify-between items-center mt-3 rounded-2xl bg-slate-950 text-white px-4 py-3">
            <span className="text-sm text-slate-300">الإجمالي</span>
            <span className="font-extrabold text-xl">{lyd(total)}</span>
          </div>
            <button className={btnCls + " w-full mt-2 !py-3.5 text-lg"} disabled={loading || cart.length === 0} onClick={checkout}>
              {loading ? "جاري الحفظ..." : <span className="inline-flex items-center gap-2">إتمام البيع <IconCheck /></span>}
            </button>
        </Card>
        </div>
      </div>
    </div>
  );
}
