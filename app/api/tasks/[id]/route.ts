import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { cookies } from "next/headers";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const me = cookies().get("dk_session")?.value
    ? await prisma.user.findUnique({ where: { id: cookies().get("dk_session")!.value } })
    : null;
  const b = await req.json();
  const data: Record<string, unknown> = {};
  if (b.status) data.status = b.status;
  if (b.courierName !== undefined) data.courierName = String(b.courierName);
  if (b.collected !== undefined) {
    const t = await prisma.courierTask.findUnique({ where: { id: params.id }, include: { sale: true } });
    if (!t) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
    const amount = Number(b.collected);
    await prisma.courierTask.update({ where: { id: t.id }, data: { collected: { increment: amount } } });
    if (t.sale) {
      await prisma.sale.update({ where: { id: t.sale.id }, data: { paid: { increment: amount } } });
      if (t.sale.customerId) {
        await prisma.customer.update({ where: { id: t.sale.customerId }, data: { balance: { decrement: amount } } });
      }
    }
    await audit("CREATE", "Payment", t.id, `تحصيل توصيل: ${amount}`, me?.name, me?.id);
    return NextResponse.json({ ok: true });
  }
  await prisma.courierTask.update({ where: { id: params.id }, data });
  if (b.status === "DELIVERED") {
    const t = await prisma.courierTask.findUnique({ where: { id: params.id } });
    if (t) await prisma.sale.update({ where: { id: t.saleId }, data: { status: "COMPLETED" } });
  }
  await audit("UPDATE", "CourierTask", params.id, `تحديث مهمة توصيل`, me?.name, me?.id);
  return NextResponse.json({ ok: true });
}
