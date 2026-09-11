"use client";
import { toast } from "@/components/toast";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputCls, btnCls, btnGhostCls, Field, Card, Badge , btnXsCls } from "@/components/ui";
import { IconArrowLeft } from "@/components/icons";
import { lyd, fmtDate, TICKET_STATUS } from "@/lib/format";

type Part = { id: string; name: string; price: number };
type T = {
  id: string; no: string; customerName: string; customerPhone: string; device: string;
  issue: string; status: string; technician: string; cost: number; paid: number;
  receivedAt: string; parts: Part[];
};

const TONE: Record<string, "green" | "red" | "amber" | "blue" | "gray"> = {
  RECEIVED: "blue", DIAGNOSIS: "amber", WAITING_PARTS: "amber", READY: "green", DELIVERED: "gray",
};

export function MaintenanceClient({ tickets }: { tickets: T[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ customerName: "", customerPhone: "", device: "", issue: "", technician: "", cost: "" });
  const [part, setPart] = useState<Record<string, { name: string; price: string }>>({});
  const [pay, setPay] = useState<Record<string, string>>({});

  async function act(id: string, body: object) {
    const res = await fetch(`/api/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await res.json().catch(() => ({}));
    if (res.ok) router.refresh();
    else toast(j.error || "تعذر التنفيذ");
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, cost: Number(form.cost || 0) }),
    });
    if (res.ok) {
      setForm({ customerName: "", customerPhone: "", device: "", issue: "", technician: "", cost: "" });
      setOpen(false);
      router.refresh();
    } else toast("تعذر الحفظ");
  }

  return (
    <div>
      <button className={btnCls + " mb-3"} onClick={() => setOpen(!open)}>+ استلام جهاز</button>
      {open && (
        <form onSubmit={create} className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(16,24,40,0.08),0_4px_12px_rgba(16,24,40,0.06)] border border-slate-200/70 p-4 sm:p-5 mb-4 grid md:grid-cols-3 gap-2">
          <Field label="اسم الزبون *"><input className={inputCls} value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} required /></Field>
          <Field label="هاتف الزبون"><input className={inputCls} value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} /></Field>
          <Field label="الجهاز *"><input className={inputCls} placeholder="هاتف — كسر شاشة" value={form.device} onChange={(e) => setForm({ ...form, device: e.target.value })} required /></Field>
          <Field label="وصف العطل"><input className={inputCls} value={form.issue} onChange={(e) => setForm({ ...form, issue: e.target.value })} /></Field>
          <Field label="الفني"><input className={inputCls} value={form.technician} onChange={(e) => setForm({ ...form, technician: e.target.value })} /></Field>
          <Field label="التكلفة التقديرية"><input type="number" min="0" className={inputCls} value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></Field>
          <div className="md:col-span-3"><button className={btnCls}>حفظ الاستلام</button></div>
        </form>
      )}
      {tickets.map((t) => (
        <Card key={t.id}>
          <div className="flex flex-wrap justify-between gap-2 items-center">
            <div>
              <b>{t.no}</b> — {t.device} <Badge tone={TONE[t.status] ?? "gray"}>{TICKET_STATUS[t.status] ?? t.status}</Badge>{" "}
              <a href={`/track/${t.no}`} target="_blank" className="text-[var(--brand)] text-xs hover:underline">تتبع / QR</a>
              <div className="text-xs text-slate-500">{t.customerName} • {t.customerPhone} • استلم {fmtDate(t.receivedAt)} • الفني: {t.technician || "—"}</div>
              {t.issue && <div className="text-sm">العطل: {t.issue}</div>}
              {t.parts.length > 0 && <div className="text-xs">القطع: {t.parts.map((p) => `${p.name} (${lyd(p.price)})`).join("، ")}</div>}
            </div>
            <div className="text-sm text-end">
              <div>التكلفة: <b>{lyd(t.cost)}</b> • المدفوع: <b>{lyd(t.paid)}</b> • المتبقي: <b>{lyd(t.cost - t.paid)}</b></div>
              <div className="flex flex-wrap gap-1 mt-1">
                {t.status !== "DELIVERED" && (
                  <button className={btnXsCls} onClick={() => act(t.id, { action: "advance" })}><span className="inline-flex items-center gap-1">المرحلة التالية <IconArrowLeft width={14} height={14} /></span></button>
                )}
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                <input placeholder="قطعة + سعر" className={inputCls + " !py-2 text-sm min-w-0 flex-1"} value={part[t.id]?.name || ""} onChange={(e) => setPart({ ...part, [t.id]: { name: e.target.value, price: part[t.id]?.price || "" } })} />
                <input type="number" min="0" placeholder="السعر" className={inputCls + " !py-2 text-sm !w-24"} value={part[t.id]?.price || ""} onChange={(e) => setPart({ ...part, [t.id]: { name: part[t.id]?.name || "", price: e.target.value } })} />
                <button className={btnXsCls} onClick={() => act(t.id, { action: "part", name: part[t.id]?.name, price: Number(part[t.id]?.price || 0) })}>+ قطعة</button>
              </div>
              {t.cost - t.paid > 0.001 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  <input type="number" min="0" placeholder="تحصيل مبلغ" className={inputCls + " !py-2 text-sm min-w-0 flex-1"} value={pay[t.id] || ""} onChange={(e) => setPay({ ...pay, [t.id]: e.target.value })} />
                  <button className={btnXsCls} onClick={() => act(t.id, { action: "pay", amount: Number(pay[t.id] || 0) })}>تحصيل</button>
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
      {tickets.length === 0 && <Card><p className="text-center text-slate-400 py-6">لا تذاكر صيانة</p></Card>}
    </div>
  );
}
