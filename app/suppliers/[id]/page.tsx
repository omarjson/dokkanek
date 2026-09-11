export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { lyd, fmtDate } from "@/lib/format";
import { PageTitle, Card, Badge } from "@/components/ui";
import { PrintButton } from "@/components/PrintButton";

// كشف حساب مورد: مشترياته + دفعاته + الرصيد — قابل للطباعة
export default async function SupplierStatementPage({ params }: { params: { id: string } }) {
  const s = await prisma.supplier.findUnique({
    where: { id: params.id },
    include: {
      purchases: { orderBy: { date: "desc" }, take: 100 },
      payments: { orderBy: { date: "desc" }, take: 100 },
    },
  });
  if (!s) notFound();

  const ledger: { date: Date; text: string; debit: number; credit: number }[] = [
    ...s.purchases.map((p) => ({ date: p.date, text: `فاتورة شراء ${p.no}`, debit: p.total - p.paid, credit: 0 })),
    ...s.payments.map((p) => ({ date: p.date, text: `سداد ${p.note || ""}`, debit: 0, credit: p.amount })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="max-w-3xl mx-auto">
      <PageTitle title={`كشف حساب: ${s.name}`} sub={`${s.phone} — المستحق عليه ${lyd(s.balance)}`} />
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
                <th className="p-2">علينا</th>
                <th className="p-2">سددنا</th>
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
                <td className="p-2 text-center">{lyd(ledger.reduce((x, l) => x + l.debit, 0))}</td>
                <td className="p-2 text-center">{lyd(ledger.reduce((x, l) => x + l.credit, 0))}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex justify-between items-center">
          <span>الصافي المستحق عليه: <Badge tone={s.balance > 0 ? "red" : "green"}>{lyd(s.balance)}</Badge></span>
          <Link href="/suppliers" className="text-xs font-bold text-[var(--brand)] hover:underline no-print">رجوع للموردين</Link>
        </div>
      </Card>
    </div>
  );
}
