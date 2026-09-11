export const dynamic = "force-dynamic";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { lyd, fmtDate, SALE_STATUS, PAY_METHODS } from "@/lib/format";
import { PageTitle, Card, Badge } from "@/components/ui";

export default async function SalesPage() {
  const sales = await prisma.sale.findMany({
    orderBy: { date: "desc" },
    take: 100,
    include: { customer: true, cashier: true, items: true },
  });
  return (
    <div>
      <PageTitle title="فواتير المبيعات" sub={`${sales.length} فاتورة (الأحدث أولا)`} />
      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-600">
              <th className="p-2 text-right">الرقم</th>
              <th className="p-2 text-right">الزبون</th>
              <th className="p-2">الحالة</th>
              <th className="p-2">الدفع</th>
              <th className="p-2">الإجمالي</th>
              <th className="p-2">المدفوع</th>
              <th className="p-2 text-right">التاريخ</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id} className="border-t hover:bg-gray-50">
                <td className="p-2"><Link href={`/sales/${s.id}`} className="text-blue-600 hover:underline font-bold">{s.no}</Link></td>
                <td className="p-2">{s.customer?.name ?? "—"}</td>
                <td className="p-2"><Badge tone={s.status === "COMPLETED" ? "green" : s.status === "COURIER" ? "blue" : "amber"}>{SALE_STATUS[s.status] ?? s.status}</Badge></td>
                <td className="p-2">{PAY_METHODS[s.payMethod] ?? s.payMethod}</td>
                <td className="p-2 text-center font-bold">{lyd(s.total)}</td>
                <td className="p-2 text-center">{lyd(s.paid)}</td>
                <td className="p-2 text-xs text-gray-500">{fmtDate(s.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sales.length === 0 && <p className="text-center text-gray-400 py-6">لا فواتير بعد — ابدأ من نقطة البيع</p>}
      </Card>
    </div>
  );
}
