import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hasPerm } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import { cookies } from "next/headers";

async function who() {
  const id = cookies().get("dk_session")?.value;
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const products = await prisma.product.findMany({
    where: q
      ? {
          active: true,
          OR: [
            { name: { contains: q } },
            { sku: { contains: q } },
            { barcode: { contains: q } },
          ],
        }
      : { active: true },
    include: { category: true, warehouse: true },
    orderBy: [{ isFavorite: "desc" }, { name: "asc" }],
    take: 200,
  });
  return NextResponse.json(products);
}

export async function POST(req: Request) {
  const me = await who();
  if (!me || !(await hasPerm(me.role, "price.edit"))) {
    return NextResponse.json({ error: "إضافة الأصناف تحتاج صلاحية" }, { status: 403 });
  }
  const b = await req.json();
  if (!b.name || b.salePrice === undefined) {
    return NextResponse.json({ error: "الاسم وسعر البيع مطلوبان" }, { status: 400 });
  }
  const sku = String(b.sku || `SKU-${Date.now().toString(36).toUpperCase()}`);
  const p = await prisma.product.create({
    data: {
      sku,
      name: String(b.name),
      categoryId: b.categoryId || null,
      costPrice: Number(b.costPrice || 0),
      costUsd: Number(b.costUsd || 0),
      salePrice: Number(b.salePrice || 0),
      quantity: Number(b.quantity || 0),
      warehouseId: b.warehouseId || null,
      barcode: String(b.barcode || ""),
      minQuantity: Number(b.minQuantity ?? 5),
      isFavorite: Boolean(b.isFavorite),
      legacyNo: String(b.legacyNo || ""),
    },
  });
  await prisma.stockMove.create({
    data: { productId: p.id, qty: p.quantity, type: "IN", note: "رصيد افتتاحي", userId: me?.id },
  });
  await audit("CREATE", "Product", p.id, `إضافة صنف ${p.name}`, me?.name, me?.id);
  return NextResponse.json(p);
}
