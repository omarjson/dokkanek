export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireRoles } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/format";
import { lyd } from "@/lib/format";
import { PageTitle, Stat, Card, Badge, btnGhostCls, btnXsCls } from "@/components/ui";
import { IconChart, IconReceipt, IconBox, IconTrend, IconWallet } from "@/components/icons";

const RANGES = [
  { key: "today", label: "اليوم", days: 1 },
  { key: "week", label: "7 أيام", days: 7 },
  { key: "month", label: "30 يوما", days: 30 },
];

export default async function ReportsPage({ searchParams }: { searchParams: { range?: string } }) {
  const me = await requireRoles(ADMIN_ROLES);
  if (!me) redirect("/");
  const range = RANGES.find((r) => r.key === searchParams.range) || RANGES[2];
  const from = new Date(Date.now() - range.days * 86400000);

  const [sales, items, expenses] = await Promise.all([
    prisma.sale.findMany({
      where: { date: { gte: from }, status: { in: ["COMPLETED", "COURIER"] } },
    }),
    prisma.saleItem.findMany({
      where: { sale: { date: { gte: from }, status: { in: ["COMPLETED", "COURIER"] } } },
      include: { product: { include: { category: true } } },
      take: 5000,
    }),
    prisma.expense.aggregate({ _sum: { amount: true }, where: { date: { gte: from } } }),
  ]);

  const revenue = sales.reduce((s, x) => s + x.total, 0);
  const discounts = sales.reduce((s, x) => s + x.discount, 0);
  const gross = items.reduce((s, x) => s + x.price * x.qty, 0);
  const cogs = items.reduce((s, x) => s + (x.product?.costPrice ?? 0) * x.qty, 0);
  const profit = gross - discounts - cogs;
  const expTotal = expenses._sum.amount ?? 0;
  const net = profit - expTotal;
  const margin = gross > 0 ? (profit / gross) * 100 : 0;

  const byProduct = new Map<string, { name: string; qty: number; revenue: number; profit: number }>();
  const byCat = new Map<string, { revenue: number; profit: number }>();
  for (const it of items) {
    const name = it.product?.name ?? "—";
    const p = byProduct.get(it.productId) || { name, qty: 0, revenue: 0, profit: 0 };
    p.qty += it.qty;
    p.revenue += it.price * it.qty;
    p.profit += (it.price - (it.product?.costPrice ?? 0)) * it.qty;
    byProduct.set(it.productId, p);
    const cat = it.product?.category?.name ?? "بدون تصنيف";
    const c = byCat.get(cat) || { revenue: 0, profit: 0 };
    c.revenue += it.price * it.qty;
    c.profit += (it.price - (it.product?.costPrice ?? 0)) * it.qty;
    byCat.set(cat, c);
  }
  const top = Array.from(byProduct.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  const cats = Array.from(byCat.entries()).sort((a, b) => b[1].revenue - a[1].revenue);
  const maxRev = top[0]?.revenue || 1;

  return (
    <div>
      <PageTitle title="تقارير الأرباح" sub={`آخر ${range.label} — الإيراد والهامش والأعلى مبيعا`} />
      <div className="flex gap-2 mb-4">
        {RANGES.map((r) => (
          <Link key={r.key} href={`/reports?range=${r.key}`} className={btnGhostCls + " text-sm" + (r.key === range.key ? " !border-[var(--brand)] !text-[var(--brand)] font-bold" : "")}>
            {r.label}
          </Link>
        ))}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        <Stat label="الإيراد" value={lyd(revenue)} icon={IconChart} accent="bg-sky-500/10 text-sky-600" />
        <Stat label="الخصومات" value={lyd(discounts)} icon={IconReceipt} accent="bg-slate-500/10 text-slate-500" />
        <Stat label="تكلفة البضاعة" value={lyd(cogs)} icon={IconBox} accent="bg-amber-500/10 text-amber-600" />
        <Stat label="الربح" value={lyd(profit)} sub={`الهامش ${margin.toFixed(1)}%`} icon={IconTrend} accent="bg-emerald-500/10 text-emerald-600" />
        <Stat label="المصروفات" value={lyd(expTotal)} sub={<span>الصافي: <b>{lyd(net)}</b></span>} icon={IconWallet} accent="bg-rose-500/10 text-rose-600" />
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <Card>
          <h2 className="font-bold mb-2">الأعلى مبيعا</h2>
          {top.map((t) => (
            <div key={t.name} className="mb-2">
              <div className="flex justify-between text-sm"><span>{t.name}</span><b>{lyd(t.revenue)}</b></div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[var(--brand)] rounded-full" style={{ width: `${Math.round((t.revenue / maxRev) * 100)}%` }} />
              </div>
              <div className="text-xs text-slate-500">الكمية {t.qty} • الربح {lyd(t.profit)}</div>
            </div>
          ))}
          {top.length === 0 && <p className="text-slate-400 text-sm">لا مبيعات في الفترة</p>}
        </Card>
        <Card>
          <h2 className="font-bold mb-2">حسب التصنيف</h2>
          <table className="w-full text-sm">
            <tbody>
              {cats.map(([name, c]) => (
                <tr key={name} className="border-t">
                  <td className="py-1 font-bold">{name}</td>
                  <td className="text-center">{lyd(c.revenue)}</td>
                  <td className="text-center"><Badge tone="green">{lyd(c.profit)}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
          {cats.length === 0 && <p className="text-slate-400 text-sm">لا بيانات</p>}
        </Card>
      </div>
    </div>
  );
}
