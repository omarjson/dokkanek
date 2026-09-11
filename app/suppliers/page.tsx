export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isModuleEnabled } from "@/lib/modules";
import { PageTitle } from "@/components/ui";
import { SuppliersClient } from "./SuppliersClient";

export default async function SuppliersPage() {
  const modOk = await isModuleEnabled("suppliers");
  if (!modOk) redirect("/");
  const [suppliers, products, purchases] = await Promise.all([
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({ where: { active: true }, orderBy: { name: "asc" }, take: 500 }),
    prisma.purchase.findMany({
      orderBy: { date: "desc" },
      take: 30,
      include: { supplier: true, items: { include: { product: true } } },
    }),
  ]);
  const shaped = purchases.map((p) => ({
    id: p.id, no: p.no, total: p.total, paid: p.paid, status: p.status,
    date: p.date.toISOString(),
    supplier: p.supplier ? { name: p.supplier.name } : null,
    items: p.items.map((i) => ({ id: i.id, qty: i.qty, price: i.price, product: { name: i.product.name } })),
  }));
  return (
    <div>
      <PageTitle title="الموردون والمشتريات" sub="فواتير الشراء تزيد المخزون تلقائيا" />
      <SuppliersClient suppliers={suppliers} products={products} purchases={shaped} />
    </div>
  );
}
