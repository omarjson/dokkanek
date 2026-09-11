import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { cookies } from "next/headers";

async function who() {
  const id = cookies().get("dk_session")?.value;
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const me = await who();
  if (!me) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const name = String(b.name || "").trim();
  if (!name) return NextResponse.json({ error: "الاسم مطلوب" }, { status: 400 });
  await prisma.category.update({ where: { id: params.id }, data: { name } });
  await audit("UPDATE", "Category", params.id, `تعديل تصنيف إلى ${name}`, me?.name, me?.id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const me = await who();
  if (!me) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const used = await prisma.product.count({ where: { categoryId: params.id } });
  if (used > 0) {
    return NextResponse.json({ error: `لا يمكن الحذف — عليه ${used} صنف. انقلها أولا` }, { status: 400 });
  }
  await prisma.category.delete({ where: { id: params.id } });
  await audit("DELETE", "Category", params.id, "حذف تصنيف", me?.name, me?.id);
  return NextResponse.json({ ok: true });
}
