"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputCls, btnCls, btnGhostCls, Field, Card } from "@/components/ui";
import { lyd, fmtDate } from "@/lib/format";

type E = { id: string; title: string; amount: number; date: string; note: string };

export function ExpensesClient({ expenses, total }: { expenses: E[]; total: number }) {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", amount: "", note: "" });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: Number(form.amount || 0) }),
    });
    if (res.ok) { setForm({ title: "", amount: "", note: "" }); router.refresh(); } else alert("تعذر الحفظ");
  }

  async function remove(id: string) {
    if (!confirm("حذف هذا المصروف؟")) return;
    await fetch(`/api/expenses?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <form onSubmit={add} className="bg-white border rounded-xl p-4 mb-4 grid md:grid-cols-4 gap-2 items-end">
        <Field label="البيان *"><input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Field>
        <Field label="المبلغ *"><input type="number" min="0.01" step="0.01" className={inputCls} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></Field>
        <Field label="ملاحظة"><input className={inputCls} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
        <button className={btnCls}>+ مصروف</button>
      </form>
      <Card>
        <div className="flex justify-between mb-2"><h2 className="font-bold">سجل المصروفات</h2><b>الإجمالي: {lyd(total)}</b></div>
        <table className="w-full text-sm">
          <tbody>
            {expenses.map((x) => (
              <tr key={x.id} className="border-t">
                <td className="py-1 font-bold">{x.title}<span className="block text-xs text-gray-500 font-normal">{x.note}</span></td>
                <td className="text-center font-bold">{lyd(x.amount)}</td>
                <td className="text-xs text-gray-500">{fmtDate(x.date)}</td>
                <td><button className={btnGhostCls + " !px-2 !py-1 text-xs !text-red-600"} onClick={() => remove(x.id)}>حذف</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {expenses.length === 0 && <p className="text-center text-gray-400 py-6">لا مصروفات</p>}
      </Card>
    </div>
  );
}
