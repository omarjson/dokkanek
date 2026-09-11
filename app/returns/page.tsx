export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";
import { PageTitle } from "@/components/ui";
import { ReturnsClient } from "./ReturnsClient";

export default async function ReturnsPage() {
  const [products, returns, damages] = await Promise.all([
    prisma.product.findMany({ where: { active: true }, orderBy: { name: "asc" }, take: 500 }),
    prisma.return.findMany({ orderBy: { date: "desc" }, take: 100, include: { product: true, sale: true } }),
    prisma.damage.findMany({ orderBy: { date: "desc" }, take: 100, include: { product: true } }),
  ]);
  const shapeReturns = (rows: typeof returns) =>
    rows.map((r) => ({
      id: r.id, qty: r.qty, reason: r.reason, date: r.date.toISOString(),
      product: r.product ? { name: r.product.name } : null,
      sale: r.sale ? { no: r.sale.no } : null,
    }));
  const shapeDamages = (rows: typeof damages) =>
    rows.map((r) => ({
      id: r.id, qty: r.qty, reason: r.reason, date: r.date.toISOString(),
      product: r.product ? { name: r.product.name } : null,
      sale: null as { no: string } | null,
    }));
  return (
    <div>
      <PageTitle title="الرواجع والتالف" sub="الراجع يرجع للمخزون — التالف يخرج منه، وكلاهما مسجل" />
      <ReturnsClient products={products} returns={shapeReturns(returns)} damages={shapeDamages(damages)} />
    </div>
  );
}
