export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";
import { lyd, PAY_METHODS } from "@/lib/format";
import { PageTitle, Card, SectionTitle } from "@/components/ui";
import { IconBox } from "@/components/icons";
import { PrintButton } from "@/components/PrintButton";

// تقرير الإقفال اليومي Z: مبيعات حسب الطريقة + مصروفات + صافي الدرج — قابل للطباعة
export default async function ClosingPage() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const [sales, expenses, payments] = await Promise.all([
    prisma.sale.findMany({
      where: { date: { gte: start }, status: { in: ["COMPLETED", "COURIER"] } },
      include: { items: { include: { product: { select: { costPrice: true, name: true } } } } },
    }),
    prisma.expense.aggregate({ _sum: { amount: true }, where: { date: { gte: start } } }),
    prisma.payment.findMany({ where: { date: { gte: start } } }),
  ]);

  const revenue = sales.reduce((s, x) => s + x.total, 0);
  const byMethod: Record<string, number> = {};
  for (const s of sales) byMethod[s.payMethod] = (byMethod[s.payMethod] || 0) + s.total;
  const collected = payments.reduce((s, p) => s + p.amount, 0);
  const cogs = sales.flatMap((s) => s.items).reduce((sum, it) => sum + (it.product?.costPrice ?? 0) * it.qty, 0);
  const discounts = sales.reduce((s, x) => s + x.discount, 0);
  const expTotal = expenses._sum.amount ?? 0;
  const byProduct = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const s of sales) {
    for (const it of s.items) {
      const name = it.product?.name ?? "—";
      const e = byProduct.get(it.productId) || { name, qty: 0, revenue: 0 };
      e.qty += it.qty;
      e.revenue += it.price * it.qty;
      byProduct.set(it.productId, e);
    }
  }
  const top = Array.from(byProduct.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  return (
    <div className="max-w-3xl mx-auto">
      <PageTitle title="تقرير الإقفال اليومي" sub={`${sales.length} فاتورة اليوم`} />
      <Card>
        <div className="flex justify-between items-center mb-2">
          <SectionTitle icon={IconBox} title="الملخص" />
          <PrintButton label="طباعة التقرير" />
        </div>
        <div className="text-sm space-y-1.5">
          {Object.entries(byMethod).map(([m, v]) => (
            <div key={m} className="flex justify-between border-b border-slate-100 py-1">
              <span>مبيعات {PAY_METHODS[m] ?? m}</span><b className="tnum">{lyd(v)}</b>
            </div>
          ))}
          <div className="flex justify-between border-b border-slate-100 py-1"><span>إجمالي المبيعات</span><b className="tnum">{lyd(revenue)}</b></div>
          <div className="flex justify-between border-b border-slate-100 py-1"><span>المحصل اليوم (شامل ديون قديمة)</span><b className="tnum">{lyd(collected)}</b></div>
          <div className="flex justify-between border-b border-slate-100 py-1"><span>الخصومات</span><b className="tnum">{lyd(discounts)}</b></div>
          <div className="flex justify-between border-b border-slate-100 py-1"><span>تكلفة البضاعة المباعة</span><b className="tnum">{lyd(cogs)}</b></div>
          <div className="flex justify-between border-b border-slate-100 py-1"><span>الربح التقريبي</span><b className="tnum text-emerald-700">{lyd(revenue - discounts - cogs)}</b></div>
          <div className="flex justify-between py-1"><span>المصروفات</span><b className="tnum text-rose-600">{lyd(expTotal)}</b></div>
        </div>
      </Card>
      <Card>
        <SectionTitle icon={IconBox} title="الأعلى مبيعا اليوم" />
        {top.map((t) => (
          <div key={t.name} className="flex justify-between text-sm border-t border-slate-100 py-1.5">
            <span>{t.name} <span className="text-slate-400">× {t.qty}</span></span><b className="tnum">{lyd(t.revenue)}</b>
          </div>
        ))}
        {top.length === 0 && <p className="text-slate-400 text-sm">لا مبيعات اليوم</p>}
      </Card>
    </div>
  );
}
