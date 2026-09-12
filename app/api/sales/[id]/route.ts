import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { hasPerm } from "@/lib/permissions";
import { cookies } from "next/headers";

// إلغاء فاتورة: يرجع الكميات للمخزون ويعكس دين الزبون — مع سجل كامل
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const me = cookies().get("dk_session")?.value
    ? await prisma.user.findUnique({ where: { id: cookies().get("dk_session")!.value } })
    : null;
  const b = await req.json().catch(() => ({}));
  if (b.action !== "void") return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
  if (!(await hasPerm(me?.role, "sales.void"))) {
    return NextResponse.json({ error: "الإلغاء يحتاج صلاحية" }, { status: 403 });
  }

  const sale = await prisma.sale.findUnique({
    where: { id: params.id },
    include: { items: { include: { product: true } } },
  });
  if (!sale) return NextResponse.json({ error: "الفاتورة غير موجودة" }, { status: 404 });
  if (sale.status === "CANCELLED") return NextResponse.json({ error: "ملغاة already" }, { status: 400 });

  if (sale.status === "COMPLETED" || sale.status === "COURIER") {
    for (const it of sale.items) {
      await prisma.product.update({ where: { id: it.productId }, data: { quantity: { increment: it.qty } } });
      await prisma.stockMove.create({
        data: { productId: it.productId, qty: it.qty, type: "IN", note: `إلغاء فاتورة ${sale.no}`, userId: me?.id },
      });
    }
    await prisma.courierTask.deleteMany({ where: { saleId: sale.id } });
  }
  const outstanding = sale.total - sale.paid;
  if (sale.customerId && outstanding > 0) {
    await prisma.customer.update({ where: { id: sale.customerId }, data: { balance: { decrement: outstanding } } });
  }
  await prisma.sale.update({ where: { id: sale.id }, data: { status: "CANCELLED" } });
  await audit("UPDATE", "Sale", sale.id, `إلغاء فاتورة ${sale.no} بقيمة ${sale.total}`, me?.name, me?.id);
  return NextResponse.json({ ok: true });
}
