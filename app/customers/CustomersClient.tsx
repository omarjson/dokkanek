"use client";
import { toast } from "@/components/toast";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputCls, btnCls, btnGhostCls, btnXsCls, Field, Badge, Card, THead, Empty } from "@/components/ui";
import { IconUsers } from "@/components/icons";
import { lyd } from "@/lib/format";

type Sale = { id: string; no: string; total: number; paid: number };
type Customer = { id: string; name: string; phone: string; creditLimit: number; balance: number; sales: Sale[] };

export function CustomersClient({ customers }: { customers: Customer[] }) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [payFor, setPayFor] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", address: "", creditLimit: "" });
  const [pay, setPay] = useState({ saleId: "", amount: "", method: "CASH" });
  const [paying, setPaying] = useState(false);
  const [editing, setEditing] = useState<null | { id: string; name: string; phone: string; creditLimit: string }>(null);

  async function saveEdit() {
    if (!editing || !editing.name.trim()) {
      toast("اسم الزبون مطلوب", "error");
      return;
    }
    const res = await fetch(`/api/customers/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editing.name.trim(), phone: editing.phone, creditLimit: Number(editing.creditLimit || 0) }),
    });
    if (res.ok) {
      setEditing(null);
      toast("تم حفظ التعديل", "success");
      router.refresh();
    } else toast("تعذر الحفظ", "error");
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (paying) return;
    setPaying(true);
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, creditLimit: Number(form.creditLimit || 0) }),
    });
    setPaying(false);
    if (res.ok) {
      setForm({ name: "", phone: "", address: "", creditLimit: "" });
      setShowAdd(false);
      router.refresh();
    } else toast("تعذر الحفظ");
  }

  async function remind(customerId: string) {
    const res = await fetch("/api/remind", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId }),
    });
    const j = await res.json().catch(() => ({}));
    if (res.ok) toast("أُضيف التذكير لقائمة التنبيهات", "success");
    else toast(j.error || "تعذر التذكير", "error");
  }

  async function doPay(customerId: string) {
    if (paying) return;
    setPaying(true);
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, saleId: pay.saleId || null, amount: Number(pay.amount), method: pay.method }),
    });
    const j = await res.json().catch(() => ({}));
    setPaying(false);
    if (res.ok) {
      setPayFor(null);
      setPay({ saleId: "", amount: "", method: "CASH" });
      router.refresh();
    } else toast(j.error || "تعذر السداد");
  }

  return (
    <div>
      <button className={btnCls + " mb-3"} onClick={() => setShowAdd(!showAdd)}>+ زبون جديد</button>
      {showAdd && (
        <form onSubmit={add} className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(16,24,40,0.08),0_4px_12px_rgba(16,24,40,0.06)] border border-slate-200/70 p-4 sm:p-5 mb-4 grid md:grid-cols-4 gap-2">
          <Field label="الاسم *"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label="الهاتف"><input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="العنوان"><input className={inputCls} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
          <Field label="سقف الآجل"><input type="number" min="0" className={inputCls} value={form.creditLimit} onChange={(e) => setForm({ ...form, creditLimit: e.target.value })} /></Field>
          <div className="md:col-span-4"><button className={btnCls}>حفظ</button></div>
        </form>
      )}
      {customers.length === 0 ? (
        <Card><Empty text="لا زبائن بعد — أضف أول زبون من الأعلى" icon={IconUsers} /></Card>
      ) : (
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(16,24,40,0.08),0_4px_12px_rgba(16,24,40,0.06)] border border-slate-200/70 overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <THead>
              <th className="p-2 text-start">الزبون</th>
              <th className="p-2">السقف</th>
              <th className="p-2">المستحق عليه</th>
              <th className="p-2">إجراءات</th>
          </THead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-2 font-bold"><Link href={`/customers/${c.id}`} className="hover:text-[var(--brand)] hover:underline">{c.name}</Link><span className="block text-xs text-slate-500 font-normal">{c.phone}</span></td>
                <td className="p-2 text-center">{lyd(c.creditLimit)}</td>
                <td className="p-2 text-center">
                  {c.balance > 0 ? <Badge tone="red">{lyd(c.balance)}</Badge> : <span className="text-slate-400 text-xs">لا ديون</span>}
                  {c.creditLimit > 0 && c.balance > c.creditLimit && <span className="block mt-0.5"><Badge tone="red">تجاوز السقف!</Badge></span>}
                </td>
                <td className="p-2">
                  <div className="flex flex-wrap gap-1">
                    <button className={btnXsCls} onClick={() => setPayFor(payFor === c.id ? null : c.id)}>سداد</button>
                    <button className={btnXsCls} onClick={() => setEditing({ id: c.id, name: c.name, phone: c.phone, creditLimit: String(c.creditLimit) })}>تعديل</button>
                  </div>
                  {editing?.id === c.id && (
                    <div className="mt-2 border rounded-lg p-2 bg-amber-50/60 grid gap-1.5">
                      <input className={inputCls + " !py-1.5 text-sm"} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="الاسم" />
                      <div className="flex gap-1.5">
                        <input className={inputCls + " !py-1.5 text-sm"} value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} placeholder="الهاتف" />
                        <input type="number" min="0" className={inputCls + " !py-1.5 text-sm"} value={editing.creditLimit} onChange={(e) => setEditing({ ...editing, creditLimit: e.target.value })} placeholder="السقف" />
                      </div>
                      <div className="flex gap-1.5">
                        <button className={btnXsCls} onClick={saveEdit}>حفظ</button>
                        <button className={btnXsCls} onClick={() => setEditing(null)}>إلغاء</button>
                      </div>
                    </div>
                  )}
                  {payFor === c.id && (
                    <div className="mt-2 border rounded-lg p-2 bg-slate-50 grid gap-2">
                      <select className={inputCls} value={pay.saleId} onChange={(e) => setPay({ ...pay, saleId: e.target.value })}>
                        <option value="">دفعة عامة على الحساب</option>
                        {c.sales.filter((s) => s.total - s.paid > 0.001).map((s) => (
                          <option key={s.id} value={s.id}>{s.no} — متبقي {lyd(s.total - s.paid)}</option>
                        ))}
                      </select>
                      <div className="flex flex-wrap gap-2">
                        <input type="number" min="0.01" step="0.01" placeholder="المبلغ" className={inputCls + " min-w-0 flex-1"} value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} />
                        <select className={inputCls + " !w-auto"} value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })}>
                          <option value="CASH">نقدي</option>
                          <option value="CARD">بطاقة</option>
                          <option value="TRANSFER">تحويل</option>
                        </select>
                        <button className={btnCls} disabled={paying} onClick={() => doPay(c.id)}>{paying ? "جاري..." : "تأكيد"}</button>
                        {c.balance > 0 && (
                          <button className={btnGhostCls} onClick={() => remind(c.id)}>تذكير</button>
                        )}
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
    </div>
  );
}
