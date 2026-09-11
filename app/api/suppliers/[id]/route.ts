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
  const data: Record<string, unknown> = {};
  if (b.name !== undefined) {
    if (!String(b.name).trim()) return NextResponse.json({ error: "الاسم مطلوب" }, { status: 400 });
    data.name = String(b.name).trim();
  }
  if (b.phone !== undefined) data.phone = String(b.phone);
  if (b.address !== undefined) data.address = String(b.address);
  const s = await prisma.supplier.update({ where: { id: params.id }, data });
  await audit("UPDATE", "Supplier", s.id, `تعديل مورد ${s.name}`, me.name, me.id);
  return NextResponse.json({ ok: true });
}
