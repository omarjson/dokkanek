import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { cookies } from "next/headers";

// تسجيل فاتورة شراء: تزيد المخزون + حركة IN + دين للمورد لو غير مدفوعة
export async function POST(req: Request) {
  const me = cookies().get("dk_session")?.value
    ? await prisma.user.findUnique({ where: { id: cookies().get("dk_session")!.value } })
    : null;
  const b = await req.json();
  const items = (b.items || []) as { productId: string; qty: number; price: number }[];
  if (!b.supplierId || items.length === 0) {
    return NextResponse.json({ error: "المورد والأصناف مطلوبة" }, { status: 400 });
  }
  const total = items.reduce((s, x) => s + Number(x.qty) * Number(x.price), 0);
  const paid = Number(b.paid || 0);
  const no = `P-${Date.now().toString(36).toUpperCase()}`;

  const pur = await prisma.purchase.create({
    data: { no, supplierId: b.supplierId, branchId: me?.branchId || (await prisma.branch.findFirst())?.id, total, paid, status: total - paid > 0 ? "CREDIT" : "COMPLETED" },
  });
  for (const it of items) {
    await prisma.purchaseItem.create({
      data: { purchaseId: pur.id, productId: it.productId, qty: Number(it.qty), price: Number(it.price) },
    });
    // متوسط التكلفة المرجح: (الكمية القديمة×التكلفة القديمة + الكمية×السعر) / الإجمالي
    const old = await prisma.product.findUnique({ where: { id: it.productId } });
    const q = Number(it.qty);
    const pr = Number(it.price);
    const newQty = (old?.quantity || 0) + q;
    const newCost = pr > 0 && newQty > 0 ? ((old?.quantity || 0) * (old?.costPrice || 0) + q * pr) / newQty : old?.costPrice || 0;
    await prisma.product.update({
      where: { id: it.productId },
      data: { quantity: { increment: q }, costPrice: Math.round(newCost * 100) / 100 },
    });
    await prisma.stockMove.create({
      data: { productId: it.productId, qty: Number(it.qty), type: "IN", note: `شراء ${no}`, userId: me?.id },
    });
  }
  if (total - paid > 0) {
    await prisma.supplier.update({ where: { id: b.supplierId }, data: { balance: { increment: total - paid } } });
  }
  await audit("CREATE", "Purchase", pur.id, `فاتورة شراء ${no} بقيمة ${total}`, me?.name, me?.id);
  return NextResponse.json({ ok: true, id: pur.id, no });
}

export async function GET() {
  const list = await prisma.purchase.findMany({
    orderBy: { date: "desc" },
    take: 100,
    include: { supplier: true, items: { include: { product: true } } },
  });
  return NextResponse.json(list);
}
