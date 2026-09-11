import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { cookies } from "next/headers";

// تسجيل حضور/انصراف وحساب الدقائق تلقائيا
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const me = cookies().get("dk_session")?.value
    ? await prisma.user.findUnique({ where: { id: cookies().get("dk_session")!.value } })
    : null;
  const b = await req.json();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let att = await prisma.attendance.findFirst({
    where: { employeeId: params.id, date: { gte: today } },
    orderBy: { date: "desc" },
  });

  if (b.action === "in") {
    if (att?.checkIn && !att.checkOut) return NextResponse.json({ error: "مسجل حضوره already" }, { status: 400 });
    att = await prisma.attendance.create({ data: { employeeId: params.id, checkIn: new Date() } });
    await audit("CREATE", "Attendance", att.id, "تسجيل حضور", me?.name, me?.id);
  } else if (b.action === "out") {
    if (!att?.checkIn) return NextResponse.json({ error: "لم يسجل حضوره اليوم" }, { status: 400 });
    if (att.checkOut) return NextResponse.json({ error: "مسجل انصرافه already" }, { status: 400 });
    const out = new Date();
    const minutes = Math.max(0, Math.round((out.getTime() - att.checkIn.getTime()) / 60000));
    await prisma.attendance.update({ where: { id: att.id }, data: { checkOut: out, minutes } });
    await audit("UPDATE", "Attendance", att.id, `تسجيل انصراف (${minutes} دقيقة)`, me?.name, me?.id);
  }
  return NextResponse.json({ ok: true });
}
