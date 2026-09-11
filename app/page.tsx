export const dynamic = "force-dynamic";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { lyd, SALE_STATUS } from "@/lib/format";
import { PageTitle, Card, Badge, Stat, TableWrap, THead, btnGhostCls } from "@/components/ui";
import { IconCart, IconBox, IconUsers, IconBell, IconPlus, IconWrench, IconClock, IconReceipt } from "@/components/icons";

const QUICK = [
  { href: "/pos", label: "بيع جديد", icon: IconCart },
  { href: "/products", label: "صنف جديد", icon: IconPlus },
  { href: "/maintenance", label: "استلام صيانة", icon: IconWrench },
  { href: "/shifts", label: "الوردية", icon: IconClock },
  { href: "/sales", label: "الفواتير", icon: IconReceipt },
];

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
        take: 12,
      }),
      prisma.sale.findMany({
        orderBy: { date: "desc" },
        take: 5,
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

  const low = lowStock.filter((p) => p.quantity <= p.minQuantity).slice(0, 5);
  const todayProfit = todayItems.reduce((s, it) => s + (it.price - (it.product?.costPrice ?? 0)) * it.qty, 0);
  const alerts = pending + tickets + tasks;

  return (
    <div>
      <PageTitle title="لوحة التحكم" sub="نظرة سريعة على حركة المحل" />

      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4 -mt-2">
        {QUICK.map((q) => {
          const Ico = q.icon;
          return (
            <Link key={q.href} href={q.href} className={btnGhostCls + " !py-2 text-sm whitespace-nowrap"}>
              <span className="inline-flex items-center gap-1.5"><Ico width={16} height={16} /> {q.label}</span>
            </Link>
          );
        })}
        {alerts > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200 whitespace-nowrap">
            <IconBell width={16} height={16} /> {alerts} تحتاج انتباها (انتظار {pending} • صيانة {tickets} • توصيل {tasks})
          </span>
        )}
      </div>

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
          label="كميات منخفضة"
          value={low.length}
          sub={low.length > 0 ? "تحتاج طلبية شراء" : "المخزون بخير"}
          icon={IconBell}
          accent="bg-amber-500/10 text-amber-600"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 items-start">
        <div className="min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-extrabold text-[15px]">أحدث الفواتير</h2>
            <Link href="/sales" className="text-xs font-bold text-[var(--brand)] hover:underline">عرض الكل</Link>
          </div>
          <TableWrap>
            <THead>
              <th className="p-2 text-start">الرقم</th>
              <th className="p-2 text-start">الزبون</th>
              <th className="p-2">الحالة</th>
              <th className="p-2">الإجمالي</th>
            </THead>
            <tbody>
              {recent.map((s) => (
                <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50/70 transition">
                  <td className="p-2">
                    <Link href={`/sales/${s.id}`} className="text-[var(--brand)] font-bold hover:underline">
                      {s.no}
                    </Link>
                  </td>
                  <td className="p-2">{s.customer?.name ?? "—"}</td>
                  <td className="p-2"><Badge>{SALE_STATUS[s.status] ?? s.status}</Badge></td>
                  <td className="p-2 font-extrabold">{lyd(s.total)}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          {recent.length === 0 && (
            <Card><p className="text-center text-slate-400 py-4 text-sm">لا فواتير بعد — <Link href="/pos" className="text-[var(--brand)] font-bold hover:underline">ابدأ البيع</Link></p></Card>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-extrabold text-[15px]">تنبيهات المخزون</h2>
            <Link href="/products?low=1" className="text-xs font-bold text-[var(--brand)] hover:underline">عرض الكل</Link>
          </div>
          {low.length === 0 ? (
            <Card><p className="text-sm text-slate-400 text-center py-4">المخزون بخير — لا تنبيهات</p></Card>
          ) : (
            <TableWrap>
              <tbody>
                {low.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100 first:border-0 hover:bg-slate-50/70 transition">
                    <td className="p-2 font-bold">{p.name}</td>
                    <td className="p-2"><Badge tone="red">المتبقي {p.quantity}</Badge></td>
                    <td className="p-2 text-slate-400 text-xs">الحد {p.minQuantity}</td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </div>
      </div>
    </div>
  );
}
