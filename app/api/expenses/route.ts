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
  return NextResponse.json(await prisma.expense.findMany({ orderBy: { date: "desc" }, take: 200 }));
}

export async function POST(req: Request) {
  const me = await who();
  const b = await req.json();
  if (!b.title || b.amount === undefined) return NextResponse.json({ error: "البيان والمبلغ مطلوبان" }, { status: 400 });
  const e = await prisma.expense.create({
    data: { branchId: me?.branchId || (await prisma.branch.findFirst())?.id, title: String(b.title), amount: Number(b.amount), note: String(b.note || "") },
  });
  await audit("CREATE", "Expense", e.id, `مصروف ${e.title}: ${e.amount}`, me?.name, me?.id);
  return NextResponse.json(e);
}

export async function DELETE(req: Request) {
  const me = await who();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "مطلوب" }, { status: 400 });
  await prisma.expense.delete({ where: { id } });
  await audit("DELETE", "Expense", id, "حذف مصروف", me?.name, me?.id);
  return NextResponse.json({ ok: true });
}
