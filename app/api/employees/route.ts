import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { hasPerm } from "@/lib/permissions";
import { cookies } from "next/headers";

async function who() {
  const id = cookies().get("dk_session")?.value;
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}

export async function GET() {
  const me = await who();
  if (!me || !(await hasPerm(me.role, "hr.view"))) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  return NextResponse.json(await prisma.employee.findMany({ orderBy: { name: "asc" }, include: { attendances: { orderBy: { date: "desc" }, take: 10 } } }));
}

export async function POST(req: Request) {
  const me = await who();
  if (!me || !(await hasPerm(me.role, "hr.view"))) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const b = await req.json();
  if (!b.name) return NextResponse.json({ error: "الاسم مطلوب" }, { status: 400 });
  const e = await prisma.employee.create({
    data: {
      name: String(b.name),
      phone: String(b.phone || ""),
      title: String(b.title || ""),
      salary: Number(b.salary || 0),
      commissionRate: Number(b.commissionRate || 0),
    },
  });
  await audit("CREATE", "Employee", e.id, `إضافة موظف ${e.name}`, me?.name, me?.id);
  return NextResponse.json(e);
}
