"use client";
import { toast } from "@/components/toast";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputCls, btnCls, btnGhostCls, Field, Card, Badge } from "@/components/ui";
import { lyd, fmtDate } from "@/lib/format";

type Product = { id: string; name: string; salePrice: number };
type Supplier = { id: string; name: string; phone: string; balance: number };
type Purchase = {
  id: string; no: string; total: number; paid: number; status: string; date: string;
  supplier?: { name: string } | null;
  items: { id: string; qty: number; price: number; product: { name: string } }[];
};

export function SuppliersClient({ suppliers, products, purchases }: { suppliers: Supplier[]; products: Product[]; purchases: Purchase[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [showBuy, setShowBuy] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [paid, setPaid] = useState("0");
  const [rows, setRows] = useState<{ productId: string; qty: string; price: string }[]>([{ productId: "", qty: "1", price: "" }]);

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
    const items = rows.filter((r) => r.productId && Number(r.qty) > 0).map((r) => ({ productId: r.productId, qty: Number(r.qty), price: Number(r.price || 0) }));
    if (!supplierId || items.length === 0) { toast("اختر المورد وصنفا واحدا على الأقل"); return; }
    const res = await fetch("/api/purchases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ supplierId, paid: Number(paid || 0), items }),
    });
    const j = await res.json().catch(() => ({}));
    if (res.ok) {
      setShowBuy(false);
      setRows([{ productId: "", qty: "1", price: "" }]);
      setPaid("0");
      router.refresh();
    } else toast(j.error || "تعذر الحفظ");
  }

  return (
    <div>
      <form onSubmit={addSupplier} className="bg-white border rounded-xl p-4 mb-4 flex flex-wrap gap-2 items-end">
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
            <div key={i} className="grid grid-cols-4 gap-2 mb-2">
              <select className={inputCls} value={r.productId} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, productId: e.target.value } : x)))}>
                <option value="">اختر الصنف</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input type="number" min="0.01" step="0.01" placeholder="الكمية" className={inputCls} value={r.qty} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, qty: e.target.value } : x)))} />
              <input type="number" min="0" step="0.01" placeholder="سعر الشراء" className={inputCls} value={r.price} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))} />
              <button type="button" className={btnGhostCls} onClick={() => setRows([...rows, { productId: "", qty: "1", price: "" }])}>+ سطر</button>
            </div>
          ))}
          <button className={btnCls} onClick={buy}>حفظ فاتورة الشراء</button>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-3">
        <Card>
          <h2 className="font-bold mb-2">الموردون</h2>
          <table className="w-full text-sm">
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="py-1 font-bold">{s.name}<span className="block text-xs text-gray-500 font-normal">{s.phone}</span></td>
                  <td className="text-center">{s.balance > 0 ? <Badge tone="red">{lyd(s.balance)}</Badge> : "لا ديون"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card>
          <h2 className="font-bold mb-2">أحدث فواتير الشراء</h2>
          {purchases.map((p) => (
            <div key={p.id} className="border-t py-2 text-sm">
              <div className="flex justify-between"><b>{p.no}</b><span>{lyd(p.total)}</span></div>
              <div className="text-xs text-gray-500">{p.supplier?.name} • {fmtDate(p.date)} • مدفوع {lyd(p.paid)}</div>
              <div className="text-xs">{p.items.map((i) => `${i.product.name} × ${i.qty}`).join("، ")}</div>
            </div>
          ))}
          {purchases.length === 0 && <p className="text-gray-400 text-sm">لا مشتريات بعد</p>}
        </Card>
      </div>
    </div>
  );
}
