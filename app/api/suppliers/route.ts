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
  return NextResponse.json(await prisma.supplier.findMany({ orderBy: { name: "asc" } }));
}

export async function POST(req: Request) {
  const me = await who();
  if (!me || !(await hasPerm(me.role, "purchases.manage"))) {
    return NextResponse.json({ error: "المشتريات تحتاج صلاحية" }, { status: 403 });
  }
  const b = await req.json();
  if (!b.name) return NextResponse.json({ error: "الاسم مطلوب" }, { status: 400 });
  const s = await prisma.supplier.create({
    data: { name: String(b.name), phone: String(b.phone || ""), address: String(b.address || "") },
  });
  await audit("CREATE", "Supplier", s.id, `إضافة مورد ${s.name}`, me?.name, me?.id);
  return NextResponse.json(s);
}
