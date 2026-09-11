import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const me = cookies().get("dk_session")?.value
    ? await prisma.user.findUnique({ where: { id: cookies().get("dk_session")!.value } })
    : null;
  const b = await req.json();
  const amount = Number(b.amount || 0);
  if (amount <= 0) return NextResponse.json({ error: "المبلغ غير صالح" }, { status: 400 });

  if (b.saleId) {
    const sale = await prisma.sale.findUnique({ where: { id: b.saleId } });
    if (!sale) return NextResponse.json({ error: "الفاتورة غير موجودة" }, { status: 404 });
    const rest = sale.total - sale.paid;
    if (amount > rest + 0.001) return NextResponse.json({ error: `المبلغ أكبر من المتبقي (${rest})` }, { status: 400 });
    await prisma.sale.update({ where: { id: sale.id }, data: { paid: { increment: amount } } });
    if (sale.customerId) {
      await prisma.customer.update({ where: { id: sale.customerId }, data: { balance: { decrement: amount } } });
    }
  } else if (b.customerId) {
    await prisma.customer.update({ where: { id: b.customerId }, data: { balance: { decrement: amount } } });
  } else {
    return NextResponse.json({ error: "حدد زبونا أو فاتورة" }, { status: 400 });
  }

  const p = await prisma.payment.create({
    data: {
      saleId: b.saleId || null,
      customerId: b.customerId || null,
      amount,
      method: b.method || "CASH",
      note: String(b.note || "سداد دين"),
    },
  });
  await audit("CREATE", "Payment", p.id, `سداد ${amount}`, me?.name, me?.id);
  return NextResponse.json(p);
}
