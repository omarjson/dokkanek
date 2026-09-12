import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { hasPerm } from "@/lib/permissions";
import { cookies } from "next/headers";

// حضور/انصراف + تعديل بيانات الموظف (الرتبة/الراتب — تُسجل في الأمن)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const me = cookies().get("dk_session")?.value
    ? await prisma.user.findUnique({ where: { id: cookies().get("dk_session")!.value } })
    : null;
  if (!me || !(await hasPerm(me.role, "hr.view"))) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const b = await req.json();

  if (!b.action) {
    const data: Record<string, unknown> = {};
    if (b.name !== undefined) data.name = String(b.name);
    if (b.phone !== undefined) data.phone = String(b.phone);
    if (b.title !== undefined) data.title = String(b.title);
    if (b.salary !== undefined) data.salary = Number(b.salary || 0);
    if (b.commissionRate !== undefined) data.commissionRate = Number(b.commissionRate || 0);
    const e = await prisma.employee.update({ where: { id: params.id }, data });
    await audit("UPDATE", "Employee", e.id, `تعديل بيانات ${e.name} (رتبة/راتب)`, me.name, me.id);
    return NextResponse.json({ ok: true });
  }
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
