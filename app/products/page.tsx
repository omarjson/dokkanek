export const dynamic = "force-dynamic";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageTitle, Card, Badge, inputCls, btnGhostCls } from "@/components/ui";
import { ProductForm } from "./ProductForm";
import { ProductsTable } from "./ProductsTable";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { q?: string; fav?: string; low?: string };
}) {
  const q = searchParams.q || "";
  const [products, categories, warehouses] = await Promise.all([
    prisma.product.findMany({
      where: {
        active: true,
        ...(q
          ? { OR: [{ name: { contains: q } }, { sku: { contains: q } }, { barcode: { contains: q } }] }
          : {}),
        ...(searchParams.fav ? { isFavorite: true } : {}),
      },
      include: { category: true, warehouse: true },
      orderBy: [{ isFavorite: "desc" }, { name: "asc" }],
      take: 200,
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.warehouse.findMany({ orderBy: { name: "asc" } }),
  ]);
  const shown = searchParams.low ? products.filter((p) => p.quantity <= p.minQuantity) : products;

  return (
    <div>
      <PageTitle title="إدارة الأصناف" sub={`${shown.length} صنف`} />
      <Card>
        <div className="flex flex-wrap gap-2 items-center">
          <form className="flex gap-2 flex-1 min-w-[220px]">
            <input name="q" defaultValue={q} placeholder="بحث بالاسم / SKU / باركود" className={inputCls} />
            <button className={btnGhostCls}>بحث</button>
          </form>
          <Link href="/products?fav=1" className={btnGhostCls + " text-sm"}>★ المفضلة</Link>
          <Link href="/products?low=1" className={btnGhostCls + " text-sm"}>⚠ المنخفضة</Link>
          <Link href="/products" className={btnGhostCls + " text-sm"}>الكل</Link>
        </div>
      </Card>
      <ProductForm categories={categories} warehouses={warehouses} />
      {shown.length === 0 ? (
        <Card><p className="text-center text-gray-400 py-6">لا أصناف مطابقة</p></Card>
      ) : (
        <ProductsTable products={shown} />
      )}
      {searchParams.low && <p className="text-xs text-gray-500 mt-2"><Badge tone="red">تنبيه</Badge> الأصناف التي وصلت للحد الأدنى أو تحته.</p>}
    </div>
  );
}
