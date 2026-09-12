"use client";
import { toast } from "@/components/toast";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputCls, btnCls, btnGhostCls, btnXsCls, Field, Card, Badge, SectionTitle } from "@/components/ui";
import { IconTruck, IconReceipt } from "@/components/icons";
import { lyd, fmtDate } from "@/lib/format";

type Product = { id: string; name: string; salePrice: number };
type Supplier = { id: string; name: string; phone: string; balance: number };
type Purchase = {
  id: string; no: string; total: number; paid: number; status: string; date: string;
  supplier?: { name: string } | null;
  items: { id: string; qty: number; price: number; product: { name: string } }[];
};

export function SuppliersClient({ suppliers, products, purchases, showUsd = false, usdRate = 0 }: {
  suppliers: Supplier[]; products: Product[]; purchases: Purchase[]; showUsd?: boolean; usdRate?: number;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [showBuy, setShowBuy] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [paid, setPaid] = useState("0");
  const [rows, setRows] = useState<{ productId: string; qty: string; price: string; usd: string }[]>([{ productId: "", qty: "1", price: "", usd: "" }]);
  const [payFor, setPayFor] = useState<string | null>(null);
  const [payAmt, setPayAmt] = useState("");
  const [paying, setPaying] = useState(false);
  const [editing, setEditing] = useState<null | { id: string; name: string; phone: string }>(null);

  async function saveEdit() {
    if (!editing || !editing.name.trim()) {
      toast("اسم المورد مطلوب", "error");
      return;
    }
    const res = await fetch(`/api/suppliers/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editing.name.trim(), phone: editing.phone }),
    });
    if (res.ok) {
      setEditing(null);
      toast("تم حفظ التعديل", "success");
      router.refresh();
    } else toast("تعذر الحفظ", "error");
  }

  async function paySupplier(id: string) {
    if (paying) return;
    setPaying(true);
    const res = await fetch("/api/supplier-payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ supplierId: id, amount: Number(payAmt), method: "CASH" }),
    });
    const j = await res.json().catch(() => ({}));
    setPaying(false);
    if (res.ok) {
      setPayFor(null);
      setPayAmt("");
      toast("تم سداد المورد", "success");
      router.refresh();
    } else toast(j.error || "تعذر السداد", "error");
  }

  async function addSupplier(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone }),
    });
    if (res.ok) { setName(""); setPhone(""); router.refresh(); } else toast("تعذر الحفظ");
  }

  async function buy() {
    const items = rows
      .filter((r) => r.productId && Number(r.qty) > 0)
      .map((r) => {
        const usd = Number(r.usd || 0);
        const price = showUsd && usd > 0 && usdRate > 0 ? Math.round(usd * usdRate * 100) / 100 : Number(r.price || 0);
        return { productId: r.productId, qty: Number(r.qty), price };
      });
    if (!supplierId || items.length === 0) { toast("اختر المورد وصنفا واحدا على الأقل"); return; }
    if (paying) return;
    setPaying(true);
    const res = await fetch("/api/purchases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ supplierId, paid: Number(paid || 0), items }),
    });
    const j = await res.json().catch(() => ({}));
    setPaying(false);
    if (res.ok) {
      setShowBuy(false);
      setRows([{ productId: "", qty: "1", price: "", usd: "" }]);
      setPaid("0");
      router.refresh();
    } else toast(j.error || "تعذر الحفظ");
  }

  return (
    <div>
      <form onSubmit={addSupplier} className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(16,24,40,0.08),0_4px_12px_rgba(16,24,40,0.06)] border border-slate-200/70 p-4 sm:p-5 mb-4 flex flex-wrap gap-2 items-end">
        <Field label="اسم المورد *"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required /></Field>
        <Field label="الهاتف"><input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
        <button className={btnCls}>+ مورد</button>
        <button type="button" className={btnGhostCls} onClick={() => setShowBuy(!showBuy)}>+ فاتورة شراء</button>
      </form>

      {showBuy && (
        <Card>
          <h2 className="font-bold mb-2">فاتورة شراء جديدة (تزيد المخزون تلقائيا)</h2>
          <div className="grid md:grid-cols-3 gap-2 mb-2">
            <Field label="المورد *">
              <select className={inputCls} value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                <option value="">—</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="المدفوع الآن"><input type="number" min="0" className={inputCls} value={paid} onChange={(e) => setPaid(e.target.value)} /></Field>
          </div>
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 mb-2">
              <select className={inputCls} value={r.productId} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, productId: e.target.value } : x)))}>
                <option value="">اختر الصنف</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input type="number" min="0.01" step="0.01" placeholder="الكمية" className={inputCls} value={r.qty} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, qty: e.target.value } : x)))} />
              {showUsd && (
              <input type="number" min="0" step="0.01" placeholder={`$ بالدولار (× ${usdRate})`} className={inputCls} value={r.usd} onChange={(e) => {
                const usd = e.target.value;
                const price = usdRate > 0 ? String(Math.round(Number(usd || 0) * usdRate * 100) / 100) : r.price;
                setRows(rows.map((x, j) => (j === i ? { ...x, usd, price } : x)));
              }} />
              )}
              <input type="number" min="0" step="0.01" placeholder="سعر الشراء" className={inputCls} value={r.price} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))} />
              <button type="button" className={btnGhostCls} onClick={() => setRows([...rows, { productId: "", qty: "1", price: "", usd: "" }])}>+ سطر</button>
            </div>
          ))}
          <button className={btnCls} onClick={buy}>حفظ فاتورة الشراء</button>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-3">
        <div className="min-w-0">
        <Card>
          <SectionTitle icon={IconTruck} title="الموردون" />
          {suppliers.length === 0 ? (
            <p className="text-center text-slate-400 py-4 text-sm">لا موردين بعد</p>
          ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[420px]">
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="py-1 font-bold"><Link href={`/suppliers/${s.id}`} className="hover:text-[var(--brand)] hover:underline">{s.name}</Link><span className="block text-xs text-slate-500 font-normal">{s.phone}</span></td>
                  <td className="text-center">{s.balance > 0 ? <Badge tone="red">{lyd(s.balance)}</Badge> : "لا ديون"}</td>
                  <td className="p-1">
                    <div className="flex flex-wrap gap-1">
                      {s.balance > 0 && (
                        <button className={btnXsCls} onClick={() => setPayFor(payFor === s.id ? null : s.id)}>سداد</button>
                      )}
                      <button className={btnXsCls} onClick={() => setEditing({ id: s.id, name: s.name, phone: s.phone })}>تعديل</button>
                    </div>
                    {s.balance > 0 && payFor === s.id && (
                      <div className="flex gap-1 mt-1">
                        <input type="number" min="0.01" step="0.01" placeholder="المبلغ" className={inputCls + " !py-1.5 text-sm min-w-0 flex-1"} value={payAmt} onChange={(e) => setPayAmt(e.target.value)} />
                        <button className={btnXsCls} disabled={paying} onClick={() => paySupplier(s.id)}>{paying ? "جاري..." : "تأكيد"}</button>
                      </div>
                    )}
                    {editing?.id === s.id && (
                      <div className="mt-1 border rounded-lg p-2 bg-amber-50/60 grid gap-1.5">
                        <input className={inputCls + " !py-1.5 text-sm"} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="الاسم" />
                        <input className={inputCls + " !py-1.5 text-sm"} value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} placeholder="الهاتف" />
                        <div className="flex gap-1.5">
                          <button className={btnXsCls} onClick={saveEdit}>حفظ</button>
                          <button className={btnXsCls} onClick={() => setEditing(null)}>إلغاء</button>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          )}
        </Card>
        </div>
        <div className="min-w-0">
        <Card>
          <SectionTitle icon={IconReceipt} title="أحدث فواتير الشراء" />
          {purchases.map((p) => (
            <div key={p.id} className="border-t py-2 text-sm">
              <div className="flex justify-between"><b>{p.no}</b><span>{lyd(p.total)}</span></div>
              <div className="text-xs text-slate-500">{p.supplier?.name} • {fmtDate(p.date)} • مدفوع {lyd(p.paid)}</div>
              <div className="text-xs">{p.items.map((i) => `${i.product.name} × ${i.qty}`).join("، ")}</div>
            </div>
          ))}
          {purchases.length === 0 && <p className="text-slate-400 text-sm">لا مشتريات بعد</p>}
        </Card>
        </div>
      </div>
    </div>
  );
}
