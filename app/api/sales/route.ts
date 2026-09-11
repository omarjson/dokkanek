import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { cookies } from "next/headers";

export async function GET() {
  const sales = await prisma.sale.findMany({
    orderBy: { date: "desc" },
    take: 100,
    include: { customer: true, cashier: true, items: true },
  });
  return NextResponse.json(sales);
}

export async function POST(req: Request) {
  const me = cookies().get("dk_session")?.value
    ? await prisma.user.findUnique({ where: { id: cookies().get("dk_session")!.value } })
    : null;
  const b = await req.json();
  const items = (b.items || []) as { productId: string; qty: number; price: number }[];
  if (items.length === 0) return NextResponse.json({ error: "السلة فارغة" }, { status: 400 });

  const status = ["COMPLETED", "PENDING", "HELD", "COURIER"].includes(b.status) ? b.status : "COMPLETED";
  const payMethod = ["CASH", "CARD", "TRANSFER", "CREDIT"].includes(b.payMethod) ? b.payMethod : "CASH";
  const discount = Number(b.discount || 0);

  let subtotal = 0;
  for (const it of items) {
    const p = await prisma.product.findUnique({ where: { id: it.productId } });
    if (!p || !p.active) return NextResponse.json({ error: "صنف غير صالح" }, { status: 400 });
    if ((status === "COMPLETED" || status === "COURIER") && p.quantity < Number(it.qty)) {
      return NextResponse.json({ error: `الكمية غير كافية: ${p.name}` }, { status: 400 });
    }
    subtotal += Number(it.price) * Number(it.qty);
  }
  const total = Math.max(0, subtotal - discount);
  const paid = payMethod === "CREDIT" || status === "PENDING" || status === "HELD" ? 0 : total;
  const no = `S-${Date.now().toString(36).toUpperCase()}`;

  const sale = await prisma.sale.create({
    data: {
      no,
      branchId: me?.branchId || (await prisma.branch.findFirst())?.id,
      customerId: b.customerId || null,
      cashierId: me?.id,
      status,
      payMethod,
      subtotal,
      discount,
      total,
      paid,
    },
  });

  for (const it of items) {
    await prisma.saleItem.create({
      data: { saleId: sale.id, productId: it.productId, qty: Number(it.qty), price: Number(it.price) },
    });
    if (status === "COMPLETED" || status === "COURIER") {
      await prisma.product.update({
        where: { id: it.productId },
        data: { quantity: { decrement: Number(it.qty) } },
      });
      await prisma.stockMove.create({
        data: { productId: it.productId, qty: -Number(it.qty), type: "OUT", note: `فاتورة ${no}`, userId: me?.id },
      });
    }
  }

  if (paid > 0) {
    await prisma.payment.create({
      data: { saleId: sale.id, customerId: b.customerId || null, amount: paid, method: payMethod },
    });
  }
  if (b.customerId && total - paid > 0) {
    await prisma.customer.update({
      where: { id: b.customerId },
      data: { balance: { increment: total - paid } },
    });
  }
  if (status === "COURIER") {
    await prisma.courierTask.create({
      data: { saleId: sale.id, courierName: String(b.courierName || ""), status: "PENDING", codAmount: total - paid },
    });
  }
  await audit("CREATE", "Sale", sale.id, `فاتورة ${no} بقيمة ${total}`, me?.name, me?.id);
  return NextResponse.json({ ok: true, id: sale.id, no });
}
