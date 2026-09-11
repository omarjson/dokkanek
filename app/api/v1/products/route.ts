import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkApiKey, unauthorized } from "@/lib/api-auth";

// GET /api/v1/products?q= — قائمة الأصناف النشطة (ترويسة x-api-key مطلوبة)
export async function GET(req: Request) {
  const me = await checkApiKey(req);
  if (!me) return unauthorized();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const products = await prisma.product.findMany({
    where: q
      ? {
          active: true,
          OR: [{ name: { contains: q } }, { sku: { contains: q } }, { barcode: { contains: q } }],
        }
      : { active: true },
    include: { category: true },
    orderBy: { name: "asc" },
    take: 500,
  });
  return NextResponse.json(
    products.map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      category: p.category?.name || null,
      costPrice: p.costPrice,
      salePrice: p.salePrice,
      quantity: p.quantity,
      barcode: p.barcode,
    }))
  );
}
