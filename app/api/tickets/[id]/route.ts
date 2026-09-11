import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { queueNotification } from "@/lib/notify";
import { cookies } from "next/headers";

const FLOW = ["RECEIVED", "DIAGNOSIS", "WAITING_PARTS", "READY", "DELIVERED"];

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const me = cookies().get("dk_session")?.value
    ? await prisma.user.findUnique({ where: { id: cookies().get("dk_session")!.value } })
    : null;
  const b = await req.json();
  const t = await prisma.maintenanceTicket.findUnique({ where: { id: params.id } });
  if (!t) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  if (b.action === "advance") {
    const next = FLOW[Math.min(FLOW.indexOf(t.status) + 1, FLOW.length - 1)];
    const data: Record<string, unknown> = { status: next };
    if (next === "DELIVERED") data.deliveredAt = new Date();
    if (b.technician !== undefined) data.technician = b.technician;
    if (b.cost !== undefined) data.cost = Number(b.cost);
    await prisma.maintenanceTicket.update({ where: { id: t.id }, data });
    await audit("UPDATE", "Ticket", t.id, `تحويل ${t.no} إلى ${next}`, me?.name, me?.id);
    if (next === "READY" && t.customerPhone) {
      await queueNotification({
        to: t.customerPhone,
        template: "ticket_ready",
        body: `دكّانك: جهازك (${t.device}) أصبح جاهزا للاستلام — تذكرة ${t.no}`,
        relatedType: "Ticket",
        relatedId: t.id,
      }).catch(() => {});
    }
  } else if (b.action === "part") {
    if (!b.name) return NextResponse.json({ error: "اسم القطعة مطلوب" }, { status: 400 });
    await prisma.ticketPart.create({ data: { ticketId: t.id, name: String(b.name), price: Number(b.price || 0) } });
    await prisma.maintenanceTicket.update({ where: { id: t.id }, data: { cost: { increment: Number(b.price || 0) } } });
    await audit("UPDATE", "Ticket", t.id, `إضافة قطعة ${b.name} لـ ${t.no}`, me?.name, me?.id);
  } else if (b.action === "pay") {
    const amount = Number(b.amount || 0);
    if (amount <= 0) return NextResponse.json({ error: "المبلغ غير صالح" }, { status: 400 });
    await prisma.maintenanceTicket.update({ where: { id: t.id }, data: { paid: { increment: amount } } });
    await audit("CREATE", "Payment", t.id, `تحصيل صيانة ${t.no}: ${amount}`, me?.name, me?.id);
  }
  return NextResponse.json({ ok: true });
}
