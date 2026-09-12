"use client";
import { toast } from "@/components/toast";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputCls, btnCls, Field } from "@/components/ui";

export function ProductForm({ categories, warehouses, canCost, showUsd, usdRate }: {
  categories: { id: string; name: string }[];
  warehouses: { id: string; name: string }[];
  canCost: boolean;
  showUsd: boolean;
  usdRate: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", sku: "", salePrice: "", costPrice: "", costUsd: "", quantity: "", barcode: "", minQuantity: "5", categoryId: "", warehouseId: "", legacyNo: "" });

  function set(k: string, v: string) {
    if (k === "costUsd" && showUsd && usdRate > 0) {
      const usd = Number(v || 0);
      setForm((f) => ({ ...f, costUsd: v, costPrice: String(Math.round(usd * usdRate * 100) / 100) }));
      return;
    }
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        salePrice: Number(form.salePrice || 0),
        costPrice: Number(form.costPrice || 0),
        costUsd: Number(form.costUsd || 0),
        quantity: Number(form.quantity || 0),
        minQuantity: Number(form.minQuantity || 5),
      }),
    });
    setLoading(false);
    if (res.ok) {
      setForm({ name: "", sku: "", salePrice: "", costPrice: "", costUsd: "", quantity: "", barcode: "", minQuantity: "5", categoryId: "", warehouseId: "", legacyNo: "" });
      setOpen(false);
      router.refresh();
    } else {
      toast("تعذر الحفظ — تأكد من الاسم والسعر");
    }
  }

  if (!open) return <button onClick={() => setOpen(true)} className={btnCls}>+ صنف جديد</button>;

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(16,24,40,0.08),0_4px_12px_rgba(16,24,40,0.06)] border border-slate-200/70 p-4 sm:p-5 mb-4 grid md:grid-cols-3 gap-2">
      <Field label="اسم الصنف *"><input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} required /></Field>
      <Field label="رمز SKU (اختياري — يتولد تلقائيا)"><input className={inputCls} value={form.sku} onChange={(e) => set("sku", e.target.value)} /></Field>
      <Field label="باركود"><input className={inputCls} value={form.barcode} onChange={(e) => set("barcode", e.target.value)} /></Field>
      <Field label="سعر البيع *"><input type="number" step="0.01" min="0" className={inputCls} value={form.salePrice} onChange={(e) => set("salePrice", e.target.value)} required /></Field>
      {canCost && <Field label="سعر التكلفة"><input type="number" step="0.01" min="0" className={inputCls} value={form.costPrice} onChange={(e) => set("costPrice", e.target.value)} /></Field>}
      {showUsd && <Field label={`التكلفة بالدولار (× ${usdRate})`}><input type="number" step="0.01" min="0" className={inputCls} value={form.costUsd} onChange={(e) => set("costUsd", e.target.value)} /></Field>}
      <Field label="الكمية الافتتاحية"><input type="number" step="0.01" className={inputCls} value={form.quantity} onChange={(e) => set("quantity", e.target.value)} /></Field>
      <Field label="حد التنبيه"><input type="number" step="0.01" className={inputCls} value={form.minQuantity} onChange={(e) => set("minQuantity", e.target.value)} /></Field>
      <Field label="التصنيف">
        <select className={inputCls} value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
          <option value="">—</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      <Field label="المخزن">
        <select className={inputCls} value={form.warehouseId} onChange={(e) => set("warehouseId", e.target.value)}>
          <option value="">—</option>
          {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </Field>
      <Field label="الرقم القديم (للترحيل من دفتر سابق)"><input className={inputCls} value={form.legacyNo} onChange={(e) => set("legacyNo", e.target.value)} /></Field>
      <div className="md:col-span-3 flex gap-2">
        <button className={btnCls} disabled={loading}>{loading ? "جاري الحفظ..." : "حفظ"}</button>
        <button type="button" className="border rounded-lg px-4 py-2" onClick={() => setOpen(false)}>إلغاء</button>
      </div>
    </form>
  );
}
