"use client";
import { toast } from "@/components/toast";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputCls, btnCls, btnGhostCls, Field, Badge } from "@/components/ui";
import { lyd } from "@/lib/format";

type Sale = { id: string; no: string; total: number; paid: number };
type Customer = { id: string; name: string; phone: string; creditLimit: number; balance: number; sales: Sale[] };

export function CustomersClient({ customers }: { customers: Customer[] }) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [payFor, setPayFor] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", address: "", creditLimit: "" });
  const [pay, setPay] = useState({ saleId: "", amount: "", method: "CASH" });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, creditLimit: Number(form.creditLimit || 0) }),
    });
    if (res.ok) {
      setForm({ name: "", phone: "", address: "", creditLimit: "" });
      setShowAdd(false);
      router.refresh();
    } else toast("تعذر الحفظ");
  }

  async function doPay(customerId: string) {
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, saleId: pay.saleId || null, amount: Number(pay.amount), method: pay.method }),
    });
    const j = await res.json().catch(() => ({}));
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
        <form onSubmit={add} className="bg-white border rounded-xl p-4 mb-4 grid md:grid-cols-4 gap-2">
          <Field label="الاسم *"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label="الهاتف"><input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="العنوان"><input className={inputCls} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
          <Field label="سقف الآجل"><input type="number" min="0" className={inputCls} value={form.creditLimit} onChange={(e) => setForm({ ...form, creditLimit: e.target.value })} /></Field>
          <div className="md:col-span-4"><button className={btnCls}>حفظ</button></div>
        </form>
      )}
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-gray-50 text-gray-600">
              <th className="p-2 text-right">الزبون</th>
              <th className="p-2">السقف</th>
              <th className="p-2">المستحق عليه</th>
              <th className="p-2">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-2 font-bold">{c.name}<span className="block text-xs text-gray-500 font-normal">{c.phone}</span></td>
                <td className="p-2 text-center">{lyd(c.creditLimit)}</td>
                <td className="p-2 text-center">{c.balance > 0 ? <Badge tone="red">{lyd(c.balance)}</Badge> : <span>0</span>}</td>
                <td className="p-2">
                  <button className={btnGhostCls + " !px-2 !py-1 text-xs"} onClick={() => setPayFor(payFor === c.id ? null : c.id)}>سداد</button>
                  {payFor === c.id && (
                    <div className="mt-2 border rounded-lg p-2 bg-gray-50 grid gap-2">
                      <select className={inputCls} value={pay.saleId} onChange={(e) => setPay({ ...pay, saleId: e.target.value })}>
                        <option value="">دفعة عامة على الحساب</option>
                        {c.sales.filter((s) => s.total - s.paid > 0.001).map((s) => (
                          <option key={s.id} value={s.id}>{s.no} — متبقي {lyd(s.total - s.paid)}</option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <input type="number" min="0.01" step="0.01" placeholder="المبلغ" className={inputCls} value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} />
                        <select className={inputCls} value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })}>
                          <option value="CASH">نقدي</option>
                          <option value="CARD">بطاقة</option>
                          <option value="TRANSFER">تحويل</option>
                        </select>
                        <button className={btnCls} onClick={() => doPay(c.id)}>تأكيد</button>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
