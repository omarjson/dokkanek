export const dynamic = "force-dynamic";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { lyd, fmtDate, SALE_STATUS } from "@/lib/format";
import { PageTitle, Card, Badge } from "@/components/ui";

export default async function Home() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const [productsCount, customersCount, todayAgg, lowStock, recent, pending, tickets, tasks] =
    await Promise.all([
      prisma.product.count({ where: { active: true } }),
      prisma.customer.count(),
      prisma.sale.aggregate({
        _sum: { total: true },
        where: { date: { gte: start }, status: { in: ["COMPLETED", "COURIER"] } },
      }),
      prisma.product.findMany({
        where: { active: true },
        orderBy: { quantity: "asc" },
        take: 8,
      }),
      prisma.sale.findMany({
        orderBy: { date: "desc" },
        take: 8,
        include: { customer: true },
      }),
      prisma.sale.count({ where: { status: { in: ["PENDING", "HELD"] } } }),
      prisma.maintenanceTicket.count({ where: { status: { not: "DELIVERED" } } }),
      prisma.courierTask.count({ where: { status: { in: ["PENDING", "WITH_COURIER"] } } }),
    ]);

  const low = lowStock.filter((p) => p.quantity <= p.minQuantity);

  return (
    <div>
      <PageTitle title="لوحة التحكم" sub="نظرة سريعة على حركة المحل" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Card>
          <div className="text-sm text-gray-500">مبيعات اليوم</div>
          <div className="text-xl font-bold">{lyd(todayAgg._sum.total)}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">الأصناف</div>
          <div className="text-xl font-bold">{productsCount}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">الزبائن</div>
          <div className="text-xl font-bold">{customersCount}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">تنبيهات</div>
          <div className="text-sm mt-1 flex flex-col gap-1">
            <span>فواتير انتظار: <b>{pending}</b></span>
            <span>تذاكر صيانة مفتوحة: <b>{tickets}</b></span>
            <span>مهام توصيل: <b>{tasks}</b></span>
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <Card>
          <h2 className="font-bold mb-2">أحدث الفواتير</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-gray-400">لا فواتير بعد</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {recent.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="py-1">
                      <Link href={`/sales/${s.id}`} className="text-blue-600 hover:underline">
                        {s.no}
                      </Link>
                    </td>
                    <td>{s.customer?.name ?? "—"}</td>
                    <td><Badge>{SALE_STATUS[s.status] ?? s.status}</Badge></td>
                    <td className="text-left font-bold">{lyd(s.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
        <Card>
          <h2 className="font-bold mb-2">كميات منخفضة</h2>
          {low.length === 0 ? (
            <p className="text-sm text-gray-400">لا تنبيهات — المخزون بخير</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {low.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="py-1">{p.name}</td>
                    <td><Badge tone="red">المتبقي {p.quantity}</Badge></td>
                    <td className="text-gray-500 text-xs">الحد {p.minQuantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="text-xs text-gray-400 mt-2">آخر تحديث: {fmtDate(new Date())}</p>
        </Card>
      </div>
    </div>
  );
}
