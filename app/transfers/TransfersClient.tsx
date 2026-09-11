"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputCls, btnCls, Field, Card, Badge, SectionTitle } from "@/components/ui";
import { IconTruck } from "@/components/icons";
import { toast } from "@/components/toast";
import { fmtDate } from "@/lib/format";

type W = { id: string; name: string; branch?: { name: string } | null };
type P = { id: string; name: string; quantity: number };
type M = { id: string; qty: number; note: string; date: string; product: { name: string } | null };

export function TransfersClient({ products, warehouses, history }: { products: P[]; warehouses: W[]; history: M[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ productId: "", fromId: "", toId: "", qty: "1" });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const res = await fetch("/api/transfers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, qty: Number(form.qty) }),
    });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setForm({ productId: "", fromId: "", toId: "", qty: "1" });
      toast(`تم التحويل ${j.ref}`, "success");
      router.refresh();
    } else toast(j.error || "تعذر التحويل", "error");
  }

  return (
    <div>
      <form onSubmit={submit}>
        <Card>
          <div className="grid sm:grid-cols-4 gap-2 items-end">
            <Field label="الصنف *">
              <select className={inputCls} value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} required>
                <option value="">—</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} (متاح {p.quantity})</option>)}
              </select>
            </Field>
            <Field label="من مخزن *">
              <select className={inputCls} value={form.fromId} onChange={(e) => setForm({ ...form, fromId: e.target.value })} required>
                <option value="">—</option>
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}{w.branch ? ` — ${w.branch.name}` : ""}</option>)}
              </select>
            </Field>
            <Field label="إلى مخزن *">
              <select className={inputCls} value={form.toId} onChange={(e) => setForm({ ...form, toId: e.target.value })} required>
                <option value="">—</option>
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}{w.branch ? ` — ${w.branch.name}` : ""}</option>)}
              </select>
            </Field>
            <Field label="الكمية *">
              <input type="number" min="0.01" step="0.01" className={inputCls} value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} required />
            </Field>
          </div>
          <button className={btnCls} disabled={busy}>{busy ? "جاري..." : "تنفيذ التحويل"}</button>
        </Card>
      </form>
      <Card>
        <SectionTitle icon={IconTruck} title="سجل التحويلات" />
        {history.map((m) => (
          <div key={m.id} className="border-t border-slate-100 py-1.5 text-sm flex justify-between gap-2">
            <span>{m.product?.name} <Badge tone={m.qty > 0 ? "green" : "blue"}>{m.qty > 0 ? `+${m.qty}` : m.qty}</Badge> <span className="text-slate-500 text-xs">{m.note}</span></span>
            <span className="text-xs text-slate-400 shrink-0">{fmtDate(m.date)}</span>
          </div>
        ))}
        {history.length === 0 && <p className="text-slate-400 text-sm">لا تحويلات بعد</p>}
      </Card>
    </div>
  );
}
