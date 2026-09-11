"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputCls, btnCls, btnGhostCls, Field, Card } from "@/components/ui";
import { lyd, fmtDate } from "@/lib/format";

type A = { id: string; date: string; checkIn: string | null; checkOut: string | null; minutes: number };
type E = { id: string; name: string; phone: string; title: string; salary: number; commissionRate: number; attendances: A[] };

export function EmployeesClient({ employees }: { employees: E[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", title: "", salary: "", commissionRate: "" });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, salary: Number(form.salary || 0), commissionRate: Number(form.commissionRate || 0) }),
    });
    if (res.ok) {
      setForm({ name: "", phone: "", title: "", salary: "", commissionRate: "" });
      setOpen(false);
      router.refresh();
    } else alert("تعذر الحفظ");
  }

  async function att(id: string, action: string) {
    const res = await fetch(`/api/employees/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const j = await res.json().catch(() => ({}));
    if (res.ok) router.refresh();
    else alert(j.error || "تعذر التسجيل");
  }

  return (
    <div>
      <button className={btnCls + " mb-3"} onClick={() => setOpen(!open)}>+ موظف جديد</button>
      {open && (
        <form onSubmit={add} className="bg-white border rounded-xl p-4 mb-4 grid md:grid-cols-3 gap-2">
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
        return (
          <Card key={e.id}>
            <div className="flex flex-wrap justify-between gap-2 items-center">
              <div>
                <b>{e.name}</b> <span className="text-sm text-gray-500">• {e.title} • {e.phone}</span>
                <div className="text-sm">الراتب: {lyd(e.salary)} • العمولة: {e.commissionRate}% • دقائق مسجلة: {monthMin} • المستحق التقريبي: <b>{lyd(accrued)}</b></div>
              </div>
              <div className="flex gap-1">
                <button className={btnGhostCls + " !px-2 !py-1 text-xs"} onClick={() => att(e.id, "in")}>حضور</button>
                <button className={btnGhostCls + " !px-2 !py-1 text-xs"} onClick={() => att(e.id, "out")}>انصراف</button>
              </div>
            </div>
            {e.attendances.length > 0 && (
              <div className="text-xs text-gray-500 mt-2">
                {e.attendances.slice(0, 5).map((a) => (
                  <span key={a.id} className="ml-3">{fmtDate(a.date)}: {a.minutes} د</span>
                ))}
              </div>
            )}
          </Card>
        );
      })}
      {employees.length === 0 && <Card><p className="text-center text-gray-400 py-6">لا موظفين</p></Card>}
    </div>
  );
}
