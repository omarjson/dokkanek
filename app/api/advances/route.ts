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

// سلفة جديدة أو تسويتها — تحتاج صلاحية السلف
export async function POST(req: Request) {
  const me = await who();
  if (!me || !(await hasPerm(me.role, "hr.advance"))) {
    return NextResponse.json({ error: "السلف تحتاج صلاحية" }, { status: 403 });
  }
  const b = await req.json().catch(() => ({}));
  const amount = Number(b.amount || 0);
  if (!b.employeeId || amount <= 0) {
    return NextResponse.json({ error: "الموظف والمبلغ مطلوبان" }, { status: 400 });
  }
  const a = await prisma.employeeAdvance.create({
    data: { employeeId: b.employeeId, amount, note: String(b.note || "سلفة") },
  });
  await audit("CREATE", "Advance", a.id, `سلفة ${amount} لموظف`, me.name, me.id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  const me = await who();
  if (!me || !(await hasPerm(me.role, "hr.advance"))) {
    return NextResponse.json({ error: "السلف تحتاج صلاحية" }, { status: 403 });
  }
  const b = await req.json().catch(() => ({}));
  if (!b.id) return NextResponse.json({ error: "مطلوب" }, { status: 400 });
  await prisma.employeeAdvance.update({ where: { id: b.id }, data: { settled: true } });
  await audit("UPDATE", "Advance", b.id, "تسوية سلفة", me.name, me.id);
  return NextResponse.json({ ok: true });
}
