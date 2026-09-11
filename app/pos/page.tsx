export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";
import { POSClient } from "./POSClient";

export default async function POSPage() {
  const [products, customers, categories] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      orderBy: [{ isFavorite: "desc" }, { name: "asc" }],
      take: 500,
      include: { category: { select: { id: true, name: true } } },
    }),
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);
  const shaped = products.map((p) => ({
    id: p.id,
    name: p.name,
    salePrice: p.salePrice,
    quantity: p.quantity,
    sku: p.sku,
    barcode: p.barcode,
    isFavorite: p.isFavorite,
    categoryId: p.categoryId,
    categoryName: p.category?.name || null,
  }));
  return <POSClient products={shaped} customers={customers} categories={categories} />;
}
