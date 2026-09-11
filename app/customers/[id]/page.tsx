export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { lyd, fmtDate } from "@/lib/format";
import { PageTitle, Card, Badge } from "@/components/ui";
import { PrintButton } from "@/components/PrintButton";

// كشف حساب زبون: فواتيره + دفعاته + الرصيد — قابل للطباعة
export default async function CustomerStatementPage({ params }: { params: { id: string } }) {
  const c = await prisma.customer.findUnique({
    where: { id: params.id },
    include: {
      sales: { orderBy: { date: "desc" }, take: 100 },
      payments: { orderBy: { date: "desc" }, take: 100, include: { sale: true } },
    },
  });
  if (!c) notFound();

  const ledger: { date: Date; text: string; debit: number; credit: number }[] = [
    ...c.sales.map((s) => ({ date: s.date, text: `فاتورة ${s.no}`, debit: s.total - s.paid, credit: 0 })),
    ...c.payments.map((p) => ({ date: p.date, text: p.sale ? `سداد فاتورة ${p.sale.no}` : `دفعة ${p.note || ""}`, debit: 0, credit: p.amount })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const totalDebit = ledger.reduce((s, x) => s + x.debit, 0);
  const totalCredit = ledger.reduce((s, x) => s + x.credit, 0);

  return (
    <div className="max-w-3xl mx-auto">
      <PageTitle title={`كشف حساب: ${c.name}`} sub={`${c.phone} — الرصيد المستحق ${lyd(c.balance)}`} />
      <Card>
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-extrabold text-[15px]">الحركة ({ledger.length})</h2>
          <PrintButton label="طباعة الكشف" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[13px]">
                <th className="p-2 text-start">التاريخ</th>
                <th className="p-2 text-start">البيان</th>
                <th className="p-2">عليه</th>
                <th className="p-2">له (سداد)</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((l, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="p-2 text-xs text-slate-500">{fmtDate(l.date)}</td>
                  <td className="p-2">{l.text}</td>
                  <td className="p-2 text-center">{l.debit > 0 ? lyd(l.debit) : "—"}</td>
                  <td className="p-2 text-center">{l.credit > 0 ? lyd(l.credit) : "—"}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-slate-300 font-extrabold">
                <td className="p-2" colSpan={2}>الإجمالي</td>
                <td className="p-2 text-center">{lyd(totalDebit)}</td>
                <td className="p-2 text-center">{lyd(totalCredit)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex justify-between items-center">
          <span>الصافي المستحق: <Badge tone={c.balance > 0 ? "red" : "green"}>{lyd(c.balance)}</Badge></span>
          <Link href="/customers" className="text-xs font-bold text-[var(--brand)] hover:underline no-print">رجوع للزبائن</Link>
        </div>
      </Card>
    </div>
  );
}
