export const dynamic = "force-dynamic";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { lyd, fmtDate, SALE_STATUS, PAY_METHODS } from "@/lib/format";
import { PageTitle, Card, Badge, THead, btnGhostCls } from "@/components/ui";
import { SaleActions } from "./SaleActions";

export default async function SalesPage() {
  const sales = await prisma.sale.findMany({
    orderBy: { date: "desc" },
    take: 100,
    include: { customer: true, cashier: true, items: true },
  });
  return (
    <div>
      <PageTitle title="فواتير المبيعات" sub={`${sales.length} فاتورة (الأحدث أولا)`} />
      <div className="mb-3 no-print">
        <a href="/api/export?type=sales" className={btnGhostCls + " text-sm"}>تصدير CSV</a>
      </div>
      <Card>
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[680px]">
          <THead>
              <th className="p-2 text-start">الرقم</th>
              <th className="p-2 text-start">الزبون</th>
              <th className="p-2">الحالة</th>
              <th className="p-2">الدفع</th>
              <th className="p-2">الإجمالي</th>
              <th className="p-2">المدفوع</th>
              <th className="p-2 text-start">التاريخ</th>
              <th className="p-2">إجراء</th>
          </THead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id} className="border-t hover:bg-slate-50">
                <td className="p-2"><Link href={`/sales/${s.id}`} className="text-[var(--brand)] hover:underline font-bold">{s.no}</Link></td>
                <td className="p-2">{s.customer?.name ?? "—"}</td>
                <td className="p-2"><Badge tone={s.status === "COMPLETED" ? "green" : s.status === "COURIER" ? "blue" : s.status === "CANCELLED" ? "red" : "amber"}>{SALE_STATUS[s.status] ?? s.status}</Badge></td>
                <td className="p-2">{PAY_METHODS[s.payMethod] ?? s.payMethod}</td>
                <td className="p-2 text-center font-bold">{lyd(s.total)}</td>
                <td className="p-2 text-center">{lyd(s.paid)}</td>
                <td className="p-2 text-xs text-slate-500">{fmtDate(s.date)}</td>
                <td className="p-2"><SaleActions id={s.id} no={s.no} status={s.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {sales.length === 0 && <p className="text-center text-slate-400 py-6">لا فواتير بعد — ابدأ من نقطة البيع</p>}
      </Card>
    </div>
  );
}
