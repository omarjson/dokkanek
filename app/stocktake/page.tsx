export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";
import { PageTitle } from "@/components/ui";
import { StocktakeClient } from "./StocktakeClient";

export default async function StocktakePage() {
  const [sessions, products] = await Promise.all([
    prisma.stocktake.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { items: { include: { product: true } } },
    }),
    prisma.product.findMany({ where: { active: true }, orderBy: { name: "asc" }, take: 500 }),
  ]);
  const shaped = sessions.map((s) => ({
    id: s.id, no: s.no, status: s.status, note: s.note, createdAt: s.createdAt.toISOString(),
    items: s.items.map((it) => ({
      id: it.id, countedQty: it.countedQty, systemQty: it.systemQty,
      product: { id: it.product.id, name: it.product.name, sku: it.product.sku },
    })),
  }));
  return (
    <div>
      <PageTitle title="الجرد المخزني" sub="عدّ الأصناف فعليا ثم اقفل — الفروقات تُسوّى تلقائيا وتُسجل" />
      <StocktakeClient sessions={shaped} products={products} />
    </div>
  );
}
