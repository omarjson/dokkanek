"use client";
import { toast } from "@/components/toast";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputCls, btnCls, btnGhostCls, Field, Card, btnXsCls, SectionTitle } from "@/components/ui";
import { IconWallet } from "@/components/icons";
import { confirmDialog } from "@/components/toast";
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
    if (res.ok) { setForm({ title: "", amount: "", note: "" }); router.refresh(); } else toast("تعذر الحفظ");
  }

  async function remove(id: string) {
    if (!(await confirmDialog("حذف هذا المصروف؟"))) return;
    await fetch(`/api/expenses?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <form onSubmit={add} className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(16,24,40,0.08),0_4px_12px_rgba(16,24,40,0.06)] border border-slate-200/70 p-4 sm:p-5 mb-4 grid md:grid-cols-4 gap-2 items-end">
        <Field label="البيان *"><input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Field>
        <Field label="المبلغ *"><input type="number" min="0.01" step="0.01" className={inputCls} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></Field>
        <Field label="ملاحظة"><input className={inputCls} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
        <button className={btnCls}>+ مصروف</button>
      </form>
      <Card>
        <div className="flex justify-between items-center mb-2"><SectionTitle icon={IconWallet} title="سجل المصروفات" /><b>الإجمالي: {lyd(total)}</b></div>
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <tbody>
            {expenses.map((x) => (
              <tr key={x.id} className="border-t">
                <td className="py-1 font-bold">{x.title}<span className="block text-xs text-slate-500 font-normal">{x.note}</span></td>
                <td className="text-center font-bold">{lyd(x.amount)}</td>
                <td className="text-xs text-slate-500">{fmtDate(x.date)}</td>
                <td><button className={btnXsCls + " !text-rose-600"} onClick={() => remove(x.id)}>حذف</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {expenses.length === 0 && <p className="text-center text-slate-400 py-6">لا مصروفات</p>}
      </Card>
    </div>
  );
}
