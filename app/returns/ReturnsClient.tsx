"use client";
import { toast } from "@/components/toast";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputCls, btnCls, Field, Card } from "@/components/ui";
import { lyd, fmtDate } from "@/lib/format";

type Product = { id: string; name: string; quantity: number };
type Row = { id: string; qty: number; reason: string; date: string; product?: { name: string } | null; sale?: { no: string } | null };

export function ReturnsClient({ products, returns, damages }: { products: Product[]; returns: Row[]; damages: Row[] }) {
  const router = useRouter();
  const [kind, setKind] = useState<"return" | "damage">("return");
  const [form, setForm] = useState({ productId: "", qty: "1", reason: "" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/returns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, ...form, qty: Number(form.qty) }),
    });
    const j = await res.json().catch(() => ({}));
    if (res.ok) {
      setForm({ productId: "", qty: "1", reason: "" });
      router.refresh();
    } else toast(j.error || "تعذر الحفظ");
  }

  return (
    <div>
      <form onSubmit={submit} className="bg-white border rounded-xl p-4 mb-4 grid md:grid-cols-5 gap-2 items-end">
        <Field label="النوع">
          <select className={inputCls} value={kind} onChange={(e) => setKind(e.target.value as "return" | "damage")}>
            <option value="return">راجع (يرجع للمخزون)</option>
            <option value="damage">تالف / مستبعد (يخرج من المخزون)</option>
          </select>
        </Field>
        <Field label="الصنف *">
          <select className={inputCls} value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} required>
            <option value="">—</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name} (متاح {p.quantity})</option>)}
          </select>
        </Field>
        <Field label="الكمية *"><input type="number" min="0.01" step="0.01" className={inputCls} value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} required /></Field>
        <Field label="السبب"><input className={inputCls} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></Field>
        <button className={btnCls}>حفظ</button>
      </form>
      <div className="grid md:grid-cols-2 gap-3">
        <Card>
          <h2 className="font-bold mb-2">سجل الرواجع</h2>
          {returns.map((r) => (
            <div key={r.id} className="border-t py-1 text-sm flex justify-between">
              <span>{r.product?.name} × {r.qty} <span className="text-gray-500">• {r.reason} {r.sale ? `• ${r.sale.no}` : ""}</span></span>
              <span className="text-xs text-gray-500">{fmtDate(r.date)}</span>
            </div>
          ))}
          {returns.length === 0 && <p className="text-gray-400 text-sm">لا رواجع</p>}
        </Card>
        <Card>
          <h2 className="font-bold mb-2">سجل التالف والمستبعد</h2>
          {damages.map((r) => (
            <div key={r.id} className="border-t py-1 text-sm flex justify-between">
              <span>{r.product?.name} × {r.qty} <span className="text-gray-500">• {r.reason}</span></span>
              <span className="text-xs text-gray-500">{fmtDate(r.date)}</span>
            </div>
          ))}
          {damages.length === 0 && <p className="text-gray-400 text-sm">لا تالف — {lyd(0)}</p>}
        </Card>
      </div>
    </div>
  );
}
