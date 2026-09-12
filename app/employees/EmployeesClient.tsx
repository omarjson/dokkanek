"use client";
import { toast } from "@/components/toast";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputCls, btnCls, btnGhostCls, Field, Card, btnXsCls, Badge } from "@/components/ui";
import { lyd, fmtDate } from "@/lib/format";

type A = { id: string; date: string; checkIn: string | null; checkOut: string | null; minutes: number };
type Adv = { id: string; amount: number; note: string; settled: boolean; date: string };
type E = { id: string; name: string; phone: string; title: string; salary: number; commissionRate: number; attendances: A[]; advances: Adv[] };

export function EmployeesClient({ employees, canAdvance }: { employees: E[]; canAdvance: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", title: "", salary: "", commissionRate: "" });
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<null | { id: string; title: string; salary: string; phone: string }>(null);
  const [adv, setAdv] = useState<Record<string, { amount: string; note: string }>>({});

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, salary: Number(form.salary || 0), commissionRate: Number(form.commissionRate || 0) }),
    });
    setBusy(false);
    if (res.ok) {
      setForm({ name: "", phone: "", title: "", salary: "", commissionRate: "" });
      setOpen(false);
      router.refresh();
    } else toast("تعذر الحفظ");
  }

  async function att(id: string, action: string) {
    if (busy) return;
    setBusy(true);
    const res = await fetch(`/api/employees/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) router.refresh();
    else toast(j.error || "تعذر التسجيل");
  }

  return (
    <div>
      <button className={btnCls + " mb-3"} onClick={() => setOpen(!open)}>+ موظف جديد</button>
      {open && (
        <form onSubmit={add} className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(16,24,40,0.08),0_4px_12px_rgba(16,24,40,0.06)] border border-slate-200/70 p-4 sm:p-5 mb-4 grid md:grid-cols-3 gap-2">
          <Field label="الاسم *"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label="الهاتف"><input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="المسمى"><input className={inputCls} placeholder="كاشير / مندوب / فني" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label="الراتب الشهري"><input type="number" min="0" className={inputCls} value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} /></Field>
          <Field label="نسبة العمولة %"><input type="number" min="0" max="100" className={inputCls} value={form.commissionRate} onChange={(e) => setForm({ ...form, commissionRate: e.target.value })} /></Field>
          <div className="md:col-span-3"><button className={btnCls}>حفظ</button></div>
        </form>
      )}
      {employees.map((e) => {
        const monthMin = e.attendances.reduce((s, a) => s + a.minutes, 0);
        const accrued = e.salary > 0 ? (e.salary / (30 * 8 * 60)) * monthMin : 0;
  async function saveEdit() {
    if (!editing) return;
    if (busy) return;
    setBusy(true);
    const res = await fetch(`/api/employees/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editing.title, salary: Number(editing.salary || 0), phone: editing.phone }),
    });
    setBusy(false);
    if (res.ok) {
      setEditing(null);
      toast("تم حفظ بيانات الموظف", "success");
      router.refresh();
    } else toast("تعذر الحفظ", "error");
  }

  async function giveAdvance(id: string) {
    const a = adv[id];
    if (!a || Number(a.amount || 0) <= 0) {
      toast("اكتب مبلغ السلفة", "error");
      return;
    }
    if (busy) return;
    setBusy(true);
    const res = await fetch("/api/advances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId: id, amount: Number(a.amount), note: a.note }),
    });
    setBusy(false);
    if (res.ok) {
      setAdv({ ...adv, [id]: { amount: "", note: "" } });
      toast("سُجلت السلفة", "success");
      router.refresh();
    } else toast("تعذر التسجيل", "error");
  }

  async function settleAdvance(id: string) {
    const res = await fetch("/api/advances", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      toast("تمت تسوية السلفة", "success");
      router.refresh();
    } else toast("تعذر التسوية", "error");
  }

  return (
          <Card key={e.id}>
            <div className="flex flex-wrap justify-between gap-2 items-center">
              <div>
                <b>{e.name}</b> <span className="text-sm text-slate-500">• {e.title} • {e.phone}</span>
                <div className="text-sm">الراتب: {lyd(e.salary)} • العمولة: {e.commissionRate}% • دقائق مسجلة: {monthMin} • المستحق التقريبي: <b>{lyd(accrued)}</b></div>
              </div>
              <div className="flex gap-1">
                <button className={btnXsCls} disabled={busy} onClick={() => att(e.id, "in")}>حضور</button>
                <button className={btnXsCls} disabled={busy} onClick={() => att(e.id, "out")}>انصراف</button>
                <button className={btnXsCls} onClick={() => setEditing({ id: e.id, title: e.title, salary: String(e.salary), phone: e.phone })}>تعديل</button>
              </div>
            </div>
            {editing?.id === e.id && (
              <div className="mt-2 border rounded-xl p-2 bg-amber-50/60 grid sm:grid-cols-4 gap-1.5 items-end">
                <label className="text-xs font-bold text-slate-600">الرتبة/المسمى
                  <input className={inputCls + " !py-1.5 text-sm mt-0.5"} value={editing.title} onChange={(ev) => setEditing({ ...editing, title: ev.target.value })} />
                </label>
                <label className="text-xs font-bold text-slate-600">الراتب
                  <input type="number" min="0" className={inputCls + " !py-1.5 text-sm mt-0.5"} value={editing.salary} onChange={(ev) => setEditing({ ...editing, salary: ev.target.value })} />
                </label>
                <label className="text-xs font-bold text-slate-600">الهاتف
                  <input className={inputCls + " !py-1.5 text-sm mt-0.5"} value={editing.phone} onChange={(ev) => setEditing({ ...editing, phone: ev.target.value })} />
                </label>
                <div className="flex gap-1.5">
                  <button className={btnXsCls} disabled={busy} onClick={saveEdit}>حفظ</button>
                  <button className={btnXsCls} onClick={() => setEditing(null)}>إلغاء</button>
                </div>
              </div>
            )}
            {e.attendances.length > 0 && (
              <div className="text-xs text-slate-500 mt-2">
                {e.attendances.slice(0, 5).map((a) => (
                  <span key={a.id} className="ms-3">{fmtDate(a.date)}: {a.minutes} دقيقة</span>
                ))}
              </div>
            )}
            {canAdvance && (
              <div className="mt-2 border-t border-slate-100 pt-2">
                <div className="text-xs font-bold text-slate-600 mb-1">
                  السلف {e.advances.filter((a) => !a.settled).length > 0 && (
                    <span>— غير المسدد: <b className="text-rose-600">{lyd(e.advances.filter((a) => !a.settled).reduce((s, a) => s + a.amount, 0))}</b></span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 items-end">
                  <input type="number" min="0.01" step="0.01" placeholder="مبلغ سلفة" className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm w-32" value={adv[e.id]?.amount || ""} onChange={(ev) => setAdv({ ...adv, [e.id]: { amount: ev.target.value, note: adv[e.id]?.note || "" } })} />
                  <input placeholder="ملاحظة" className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm flex-1 min-w-24" value={adv[e.id]?.note || ""} onChange={(ev) => setAdv({ ...adv, [e.id]: { amount: adv[e.id]?.amount || "", note: ev.target.value } })} />
                  <button className={btnXsCls} disabled={busy} onClick={() => giveAdvance(e.id)}>+ سلفة</button>
                </div>
                {e.advances.slice(0, 5).map((a) => (
                  <div key={a.id} className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                    <span>{fmtDate(a.date)} — {lyd(a.amount)} {a.note ? `• ${a.note}` : ""}</span>
                    {a.settled ? <Badge tone="green">مسددة</Badge> : <button className="text-[var(--brand)] font-bold hover:underline" onClick={() => settleAdvance(a.id)}>تسوية</button>}
                  </div>
                ))}
              </div>
            )}
          </Card>
        );
      })}
      {employees.length === 0 && <Card><p className="text-center text-slate-400 py-6">لا موظفين</p></Card>}
    </div>
  );
}
