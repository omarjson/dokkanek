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
  const [open, history] = await Promise.all([
    prisma.cashShift.findFirst({ where: { status: "OPEN" }, orderBy: { openedAt: "desc" } }),
    prisma.cashShift.findMany({ orderBy: { openedAt: "desc" }, take: 30 }),
  ]);
  let expected = 0;
  if (open) {
    const agg = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { method: "CASH", date: { gte: open.openedAt } },
    });
    expected = open.opening + (agg._sum.amount ?? 0);
  }
  return NextResponse.json({ open, history, expected });
}

export async function POST(req: Request) {
  const me = await who();
  const b = await req.json();
  if (b.action === "open") {
    const exists = await prisma.cashShift.findFirst({ where: { status: "OPEN" } });
    if (exists) return NextResponse.json({ error: "توجد وردية مفتوحة already" }, { status: 400 });
    const s = await prisma.cashShift.create({
      data: { branchId: me?.branchId || (await prisma.branch.findFirst())?.id, userId: me?.id, opening: Number(b.opening || 0), status: "OPEN" },
    });
    await audit("CREATE", "CashShift", s.id, `فتح وردية بعهدة ${b.opening}`, me?.name, me?.id);
    return NextResponse.json(s);
  }
  if (b.action === "close") {
    const open = await prisma.cashShift.findFirst({ where: { status: "OPEN" }, orderBy: { openedAt: "desc" } });
    if (!open) return NextResponse.json({ error: "لا توجد وردية مفتوحة" }, { status: 400 });
    const agg = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { method: "CASH", date: { gte: open.openedAt } },
    });
    const expected = open.opening + (agg._sum.amount ?? 0);
    const closing = Number(b.closing ?? expected);
    await prisma.cashShift.update({
      where: { id: open.id },
      data: { closing, closedAt: new Date(), status: "CLOSED" },
    });
    await audit("UPDATE", "CashShift", open.id, `إقفال وردية: متوقع ${expected} / فعلي ${closing} / فرق ${closing - expected}`, me?.name, me?.id);
    return NextResponse.json({ ok: true, expected, closing, diff: closing - expected });
  }
  return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
}
