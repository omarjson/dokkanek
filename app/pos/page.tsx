export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";
import { POSClient } from "./POSClient";

export default async function POSPage() {
  const [products, customers] = await Promise.all([
    prisma.product.findMany({ where: { active: true }, orderBy: [{ isFavorite: "desc" }, { name: "asc" }], take: 500 }),
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
  ]);
  return <POSClient products={products} customers={customers} />;
}
