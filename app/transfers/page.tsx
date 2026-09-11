export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";
import { PageTitle } from "@/components/ui";
import { TransfersClient } from "./TransfersClient";

export default async function TransfersPage() {
  const [products, warehouses, history] = await Promise.all([
    prisma.product.findMany({ where: { active: true }, orderBy: { name: "asc" }, take: 500 }),
    prisma.warehouse.findMany({ orderBy: { name: "asc" }, include: { branch: true } }),
    prisma.stockMove.findMany({
      where: { type: "TRANSFER" },
      orderBy: { date: "desc" },
      take: 100,
      include: { product: true },
    }),
  ]);
  return (
    <div>
      <PageTitle title="التحويل بين المخازن" sub="سجل تحويلات موثق بمرجع — مع نقل تبعية الصنف للمخزن المستلم" />
      <TransfersClient
        products={products}
        warehouses={warehouses.map((w) => ({ id: w.id, name: w.name, branch: w.branch ? { name: w.branch.name } : null }))}
        history={history.map((m) => ({ id: m.id, qty: m.qty, note: m.note, date: m.date.toISOString(), product: m.product ? { name: m.product.name } : null }))}
      />
    </div>
  );
}
