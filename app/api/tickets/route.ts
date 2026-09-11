import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { cookies } from "next/headers";

async function who() {
  const id = cookies().get("dk_session")?.value;
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}

export async function GET() {
  return NextResponse.json(
    await prisma.maintenanceTicket.findMany({ orderBy: { receivedAt: "desc" }, take: 200, include: { parts: true } })
  );
}

export async function POST(req: Request) {
  const me = await who();
  const b = await req.json();
  if (!b.customerName || !b.device) return NextResponse.json({ error: "اسم الزبون والجهاز مطلوبان" }, { status: 400 });
  const t = await prisma.maintenanceTicket.create({
    data: {
      no: `T-${Date.now().toString(36).toUpperCase()}`,
      customerName: String(b.customerName),
      customerPhone: String(b.customerPhone || ""),
      device: String(b.device),
      issue: String(b.issue || ""),
      technician: String(b.technician || ""),
      cost: Number(b.cost || 0),
      status: "RECEIVED",
    },
  });
  await audit("CREATE", "Ticket", t.id, `استلام جهاز ${t.no}`, me?.name, me?.id);
  return NextResponse.json(t);
}
