import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// عام — للزبون ليتابع جهازه برقم التذكرة (بدون بيانات حساسة)
export async function GET(_req: Request, { params }: { params: { no: string } }) {
  const t = await prisma.maintenanceTicket.findUnique({
    where: { no: decodeURIComponent(params.no) },
    include: { parts: true },
  });
  if (!t) return NextResponse.json({ error: "رقم التذكرة غير موجود" }, { status: 404 });
  return NextResponse.json({
    no: t.no,
    customerName: t.customerName,
    device: t.device,
    issue: t.issue,
    status: t.status,
    cost: t.cost,
    paid: t.paid,
    receivedAt: t.receivedAt,
    deliveredAt: t.deliveredAt,
    parts: t.parts.map((p) => ({ name: p.name, price: p.price })),
  });
}
