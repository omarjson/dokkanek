export const dynamic = "force-dynamic";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { lyd, fmtDate, SALE_STATUS } from "@/lib/format";
import { PageTitle, Card, Badge, Stat, TableWrap, THead } from "@/components/ui";
import { IconCart, IconBox, IconUsers, IconBell, IconClock } from "@/components/icons";

export default async function Home() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const [productsCount, customersCount, todayAgg, lowStock, recent, pending, tickets, tasks, openShift, todayItems] =
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
      prisma.cashShift.findFirst({ where: { status: "OPEN" }, orderBy: { openedAt: "desc" } }),
      prisma.saleItem.findMany({
        where: { sale: { date: { gte: start }, status: { in: ["COMPLETED", "COURIER"] } } },
        include: { product: { select: { costPrice: true } } },
      }),
    ]);

  const low = lowStock.filter((p) => p.quantity <= p.minQuantity);
  const todayProfit = todayItems.reduce((s, it) => s + (it.price - (it.product?.costPrice ?? 0)) * it.qty, 0);

  return (
    <div>
      <PageTitle title="لوحة التحكم" sub="نظرة سريعة على حركة المحل" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Stat
          label="مبيعات اليوم"
          value={lyd(todayAgg._sum.total)}
          sub={<span className="text-emerald-700 font-bold">الربح: {lyd(todayProfit)}</span>}
          icon={IconCart}
          accent="bg-emerald-500/10 text-emerald-600"
        />
        <Stat
          label="الأصناف"
          value={productsCount}
          sub={
            openShift ? (
              <Link href="/shifts" className="text-emerald-700 font-bold hover:underline">الوردية مفتوحة</Link>
            ) : (
              <Link href="/shifts" className="text-amber-700 font-bold hover:underline">الوردية مغلقة — افتح</Link>
            )
          }
          icon={IconBox}
          accent="bg-sky-500/10 text-sky-600"
        />
        <Stat label="الزبائن" value={customersCount} icon={IconUsers} accent="bg-violet-500/10 text-violet-600" />
        <Stat
          label="تحتاج انتباها"
          value={`${pending + tickets + tasks}`}
          sub={`انتظار ${pending} • صيانة ${tickets} • توصيل ${tasks}`}
          icon={IconBell}
          accent="bg-amber-500/10 text-amber-600"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 items-start">
        <div>
          <h2 className="font-extrabold mb-2 flex items-center gap-2">
            <IconClock width={18} height={18} /> أحدث الفواتير
          </h2>
          <TableWrap>
            <THead>
              <th className="p-2.5 text-start font-bold">الرقم</th>
              <th className="p-2.5 text-start font-bold">الزبون</th>
              <th className="p-2.5 font-bold">الحالة</th>
              <th className="p-2.5 font-bold">الإجمالي</th>
            </THead>
            <tbody>
              {recent.map((s) => (
                <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50/70 transition">
                  <td className="p-2.5">
                    <Link href={`/sales/${s.id}`} className="text-[var(--brand)] font-bold hover:underline">
                      {s.no}
                    </Link>
                  </td>
                  <td className="p-2.5">{s.customer?.name ?? "—"}</td>
                  <td className="p-2.5"><Badge>{SALE_STATUS[s.status] ?? s.status}</Badge></td>
                  <td className="p-2.5 font-extrabold">{lyd(s.total)}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          {recent.length === 0 && (
            <Card><p className="text-center text-slate-400 py-4 text-sm">لا فواتير بعد</p></Card>
          )}
        </div>
        <div>
          <h2 className="font-extrabold mb-2">كميات منخفضة</h2>
          {low.length === 0 ? (
            <Card><p className="text-sm text-slate-400 text-center py-4">المخزون بخير — لا تنبيهات</p></Card>
          ) : (
            <TableWrap>
              <tbody>
                {low.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100 first:border-0 hover:bg-slate-50/70 transition">
                    <td className="p-2.5 font-bold">{p.name}</td>
                    <td className="p-2.5"><Badge tone="red">المتبقي {p.quantity}</Badge></td>
                    <td className="p-2.5 text-slate-400 text-xs">الحد {p.minQuantity}</td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
          <p className="text-xs text-slate-400 mt-2">آخر تحديث: {fmtDate(new Date())}</p>
        </div>
      </div>
    </div>
  );
}
