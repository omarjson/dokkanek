import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRoles, ADMIN_ROLES } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { cookies } from "next/headers";

async function who() {
  const id = cookies().get("dk_session")?.value;
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const me = await who();
  const b = await req.json();
  const old = await prisma.product.findUnique({ where: { id: params.id } });
  if (!old) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  const data: Record<string, unknown> = {};
  for (const k of ["name", "costPrice", "salePrice", "quantity", "barcode", "minQuantity", "isFavorite", "legacyNo", "categoryId", "warehouseId"]) {
    if (b[k] !== undefined) data[k] = b[k];
  }
  if (typeof data.costPrice !== "undefined") data.costPrice = Number(data.costPrice);
  if (typeof data.salePrice !== "undefined") data.salePrice = Number(data.salePrice);
  if (typeof data.quantity !== "undefined") data.quantity = Number(data.quantity);
  if (typeof data.minQuantity !== "undefined") data.minQuantity = Number(data.minQuantity);
  const p = await prisma.product.update({ where: { id: params.id }, data });
  if (data.quantity !== undefined && Number(data.quantity) !== old.quantity) {
    await prisma.stockMove.create({
      data: {
        productId: p.id,
        qty: Number(data.quantity) - old.quantity,
        type: "ADJUST",
        note: `تعديل كمية من ${old.quantity} إلى ${data.quantity}`,
        userId: me?.id,
      },
    });
  }
  await audit("UPDATE", "Product", p.id, `تعديل صنف ${p.name}`, me?.name, me?.id);
  return NextResponse.json(p);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const me = await requireRoles(ADMIN_ROLES);
  if (!me) return NextResponse.json({ error: "غير مصرح — الحذف للإدارة فقط" }, { status: 403 });
  const used = await prisma.saleItem.count({ where: { productId: params.id } });
  if (used > 0) {
    await prisma.product.update({ where: { id: params.id }, data: { active: false } });
    await audit("ARCHIVE", "Product", params.id, "أرشفة صنف عليه حركات", me?.name, me?.id);
    return NextResponse.json({ archived: true });
  }
  const p = await prisma.product.findUnique({ where: { id: params.id } });
  await prisma.stockMove.deleteMany({ where: { productId: params.id } });
  await prisma.product.delete({ where: { id: params.id } });
  await audit("DELETE", "Product", params.id, `حذف صنف ${p?.name ?? ""}`, me?.name, me?.id);
  return NextResponse.json({ ok: true });
}
