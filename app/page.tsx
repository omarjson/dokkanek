export const dynamic = "force-dynamic";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { lyd, SALE_STATUS } from "@/lib/format";
import { PageTitle, Card, Badge, Stat, TableWrap, THead, btnGhostCls } from "@/components/ui";
import { getModuleState } from "@/lib/modules";
import { IconCart, IconBox, IconUsers, IconBell, IconPlus, IconWrench, IconClock, IconReceipt } from "@/components/icons";

const QUICK = [
  { href: "/pos", label: "بيع جديد", icon: IconCart, tint: "bg-emerald-500/10 text-emerald-600" },
  { href: "/products", label: "صنف جديد", icon: IconPlus, tint: "bg-sky-500/10 text-sky-600" },
  { href: "/maintenance", label: "استلام صيانة", icon: IconWrench, tint: "bg-amber-500/10 text-amber-600", mod: "maintenance" },
  { href: "/shifts", label: "الوردية", icon: IconClock, tint: "bg-violet-500/10 text-violet-600", mod: "shifts" },
  { href: "/sales", label: "الفواتير", icon: IconReceipt, tint: "bg-slate-500/10 text-slate-500" },
];

export default async function Home() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const [productsCount, customersCount, todayAgg, lowStock, recent, pending, tickets, tasks, openShift, todayItems, debtors] =
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
      prisma.customer.findMany({
        where: { balance: { gt: 0 } },
        orderBy: { balance: "desc" },
        take: 5,
      }),
    ]);

  const low = lowStock.filter((p) => p.quantity <= p.minQuantity).slice(0, 5);
  const todayProfit = todayItems.reduce((s, it) => s + (it.price - (it.product?.costPrice ?? 0)) * it.qty, 0);
  // مبيعات آخر 7 أيام للرسم
  const week: { label: string; total: number }[] = [];
  const dayNames = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const weekSales = await prisma.sale.findMany({
    where: { date: { gte: new Date(Date.now() - 7 * 86400000) }, status: { in: ["COMPLETED", "COURIER"] } },
    select: { date: true, total: true },
  });
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const total = weekSales.filter((s) => s.date >= d && s.date < next).reduce((s, x) => s + x.total, 0);
    week.push({ label: i === 0 ? "اليوم" : dayNames[d.getDay()], total });
  }
  const weekMax = Math.max(1, ...week.map((w) => w.total));
  const { enabled } = await getModuleState();
  const quick = QUICK.filter((q) => !q.mod || enabled[q.mod]);
  const alertParts: string[] = [];
  if (pending > 0) alertParts.push(`انتظار ${pending}`);
  if (enabled.maintenance && tickets > 0) alertParts.push(`صيانة ${tickets}`);
  if (enabled.delivery && tasks > 0) alertParts.push(`توصيل ${tasks}`);
  const alerts = pending + (enabled.maintenance ? tickets : 0) + (enabled.delivery ? tasks : 0);

  return (
    <div>
      <PageTitle title="لوحة التحكم" sub="نظرة سريعة على حركة المحل" />

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4 -mt-2">
        {quick.map((q) => {
          const Ico = q.icon;
          return (
            <Link
              key={q.href}
              href={q.href}
              className="bg-white rounded-2xl border border-slate-200/70 shadow-[0_1px_3px_rgba(16,24,40,0.06)] p-3 flex flex-col items-center gap-1.5 text-[13px] font-bold transition hover:border-[var(--brand)] hover:shadow-md active:scale-[0.98]"
            >
              <span className={`flex items-center justify-center w-9 h-9 rounded-xl ${q.tint}`}>
                <Ico width={19} height={19} />
              </span>
              {q.label}
            </Link>
          );
        })}
      </div>
      {alerts > 0 && (
        <div className="mb-4 -mt-2">
          <span className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200 whitespace-nowrap">
            <IconBell width={16} height={16} /> {alerts} تحتاج انتباها ({alertParts.join(" • ")})
          </span>
        </div>
      )}

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
            !enabled.shifts ? (
              <span className="text-slate-400">الورديات معطلة</span>
            ) : openShift ? (
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

      <Card>
        <h2 className="font-extrabold text-[15px] mb-3">مبيعات آخر 7 أيام</h2>
        <div className="flex items-end gap-1.5 h-32" dir="ltr">
          {week.map((w) => (
            <div key={w.label} className="flex-1 flex flex-col items-center gap-1 min-w-0">
              <span className="text-[11px] font-bold tabular-nums">{w.total >= 1000 ? `${(w.total / 1000).toFixed(1)}k` : Math.round(w.total)}</span>
              <div className="w-full max-w-10 rounded-t-lg bg-[var(--brand)]/85 min-h-[4px]" style={{ height: `${Math.max(3, Math.round((w.total / weekMax) * 100))}%` }} title={`${w.label}: ${lyd(w.total)}`} />
              <span className="text-[10px] text-slate-500 truncate" dir="rtl">{w.label}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4 items-start">        <div className="min-w-0">
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
          <div className="flex items-center justify-between mb-2 mt-4">
            <h2 className="font-extrabold text-[15px]">أكبر المدينين</h2>
            <Link href="/customers" className="text-xs font-bold text-[var(--brand)] hover:underline">الديون والسداد</Link>
          </div>
          {debtors.length === 0 ? (
            <Card><p className="text-sm text-slate-400 text-center py-4">لا ديون مستحقة</p></Card>
          ) : (
            <TableWrap>
              <tbody>
                {debtors.map((c) => (
                  <tr key={c.id} className="border-t border-slate-100 first:border-0 hover:bg-slate-50/70 transition">
                    <td className="p-2 font-bold">{c.name}</td>
                    <td className="p-2"><Badge tone="red">{lyd(c.balance)}</Badge></td>
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
