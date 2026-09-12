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
  const cats = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return NextResponse.json(cats);
}

export async function POST(req: Request) {
  const me = await who();
  if (!me || !(await hasPerm(me.role, "price.edit"))) {
    return NextResponse.json({ error: "إدارة التصنيفات تحتاج صلاحية" }, { status: 403 });
  }
  const b = await req.json().catch(() => ({}));
  const name = String(b.name || "").trim();
  if (!name) return NextResponse.json({ error: "الاسم مطلوب" }, { status: 400 });
  const exists = await prisma.category.findUnique({ where: { name } });
  if (exists) return NextResponse.json({ error: "التصنيف موجود already" }, { status: 400 });
  const c = await prisma.category.create({ data: { name } });
  await audit("CREATE", "Category", c.id, `تصنيف جديد ${name}`, me.name, me.id);
  return NextResponse.json(c);
}
